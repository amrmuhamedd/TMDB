import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RedisService } from '../cache/redis.service';
import { MovieRepository } from './repositories/movie.repository';
import {
  CreateMovieDto,
  UpdateMovieDto,
  MovieFilterDto,
  MovieResponseDto,
  PaginatedMovieResponseDto,
} from './dto/movie.dto';
import { MovieDocument } from './entities/movie.entity';
import { TmdbService } from '../tmdb/services/tmdb.service';
import { RatingsService } from '../ratings/ratings.service';

@Injectable()
export class MovieService {
  private readonly logger = new Logger(MovieService.name);

  constructor(
    private readonly movieRepository: MovieRepository,
    private readonly tmdbService: TmdbService,
    private readonly redisService: RedisService,
    private readonly ratingsService: RatingsService,
  ) {}

  async syncPopularMovies(): Promise<void> {
    try {
      this.logger.log('Starting to sync popular movies from TMDB');

      for (let page = 1; page <= 5; page++) {
        const popularMovies = await this.tmdbService.getPopularMovies(page);

 
        for (const movieData of popularMovies.results) {
          const detailedMovie = await this.tmdbService.getMovieDetails(
            movieData.id,
          );

          await this.movieRepository.updateByTmdbId(detailedMovie.id, {
            tmdbId: detailedMovie.id,
            title: detailedMovie.title,
            overview: detailedMovie.overview,
            posterPath: detailedMovie.poster_path,
            backdropPath: detailedMovie.backdrop_path,
            releaseDate: detailedMovie.release_date
              ? new Date(detailedMovie.release_date)
              : undefined,
            popularity: detailedMovie.popularity,
            voteCount: detailedMovie.vote_count,
            voteAverage: detailedMovie.vote_average,
            adult: detailedMovie.adult,
            genres:
              detailedMovie.genres?.map((genre) => ({
                id: genre.id,
                name: genre.name,
              })) || [],
          });
        }
      }

      this.logger.log('Finished syncing popular movies from TMDB');
    } catch (error) {
      this.logger.error(`Error syncing popular movies: ${error.message}`);
      throw error;
    }
  }

  async findAll(filterDto: MovieFilterDto): Promise<PaginatedMovieResponseDto> {
    const { page = 1, limit = 10, genre, search } = filterDto;

    const cacheKey = `movies_${page}_${limit}_${genre || 'allgenre'}_${search || 'nosearch'}`;

    const cachedResult = await this.redisService.get<PaginatedMovieResponseDto>(cacheKey);
    if (cachedResult) {
      this.logger.debug(`Cache hit for movie listing with key: ${cacheKey}`);
      return cachedResult;
    }

    this.logger.debug(`Cache miss for movie listing with key: ${cacheKey}, fetching from database`);
    let result;

    if (search) {
      result = await this.movieRepository.search(search, page, limit);
    } else if (genre) {
      const filters = { 'genres.name': { $regex: new RegExp(genre, 'i') } };
      result = await this.movieRepository.findAll(page, limit, filters);
    } else {
      result = await this.movieRepository.findAll(page, limit);
    }

    // Properly await all the mapped movie promises
    const mappedMovies = await Promise.all(result.data.map(movie => this.mapMovieToResponseDto(movie)));
    
    const response: PaginatedMovieResponseDto = {
      data: mappedMovies,
      total: result.total,
      page: result.page,
      limit: result.limit,
    };

    // Only cache if we have valid data
    if (response && response.data && response.data.length > 0) {
      await this.redisService.set(cacheKey, response, 300); 
      this.logger.debug(`Cached movie listing with key: ${cacheKey}`);
    } else {
      this.logger.warn(`Not caching invalid movie listing response for key: ${cacheKey}`);
    }

    return response;
  }

  async findOne(id: string, userId?: string): Promise<MovieResponseDto> {
    const cacheKey = `movie_${id}_${userId || 'nouser'}`;

    const cachedResult = await this.redisService.get<MovieResponseDto>(cacheKey);
    if (cachedResult) {
      this.logger.debug(`Cache hit for movie ${id}`);
      return cachedResult;
    }

    this.logger.debug(`Cache miss for movie ${id}, fetching from database`);
    const movie = await this.movieRepository.findById(id);
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    // Properly await the async response
    const response = await this.mapMovieToResponseDto(movie, userId);

    // Ensure we're caching a complete object
    if (response && response.id) {
      await this.redisService.set(cacheKey, response, 300);
      this.logger.debug(`Cached movie ${id} response`);
    } else {
      this.logger.warn(`Not caching invalid movie response for ${id}`);
    }

    return response;
  }

  async create(createMovieDto: CreateMovieDto): Promise<MovieResponseDto> {
    const movie = await this.movieRepository.create(createMovieDto);

    await this.redisService.delete('movies_*');

    return await this.mapMovieToResponseDto(movie);
  }

  async update(
    id: string,
    updateMovieDto: UpdateMovieDto,
  ): Promise<MovieResponseDto> {
    const movie = await this.movieRepository.update(id, updateMovieDto);
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    await this.redisService.delete(`movie_${id}_*`);
    await this.redisService.delete('movies_*');

    return await this.mapMovieToResponseDto(movie);
  }

  async delete(id: string): Promise<void> {
    const existingMovie = await this.movieRepository.findById(id);
    if (!existingMovie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }

    await this.movieRepository.delete(id);

    await this.redisService.delete(`movie_${id}_nouser`);
  }



  private async mapMovieToResponseDto(
    movie: MovieDocument,
    userId?: string,
  ): Promise<MovieResponseDto> {
    // Get the average rating from our platform's ratings
    const movieId = movie._id.toString();
    const { average, count } = await this.ratingsService.getMovieAverageRating(movieId);
    
    const response: MovieResponseDto = {
      id: movieId,
      tmdbId: movie.tmdbId,
      title: movie.title,
      overview: movie.overview,
      posterPath: movie.posterPath,
      backdropPath: movie.backdropPath,
      releaseDate: movie.releaseDate,
      genres: movie.genres,
      popularity: movie.popularity,
      voteCount: count || movie.voteCount, // Use our rating count if available, otherwise use TMDB count
      voteAverage: count > 0 ? average : movie.voteAverage, // Use our average if we have ratings, otherwise use TMDB average
      adult: movie.adult,
    };

    return response;
  }

}
