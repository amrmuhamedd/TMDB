import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { WatchlistRepository } from './repositories/watchlist.repository';
import { RedisService } from '../cache/redis.service';
import { WatchlistItemResponseDto, WatchlistFilterDto, WatchlistItemWithMovieResponseDto } from './dto/watchlist.dto';
import { MovieRepository } from '../movie/repositories/movie.repository';
import { MovieDocument } from '../movie/entities/movie.entity';

@Injectable()
export class WatchlistService {
  private readonly logger = new Logger(WatchlistService.name);

  constructor(
    private readonly watchlistRepository: WatchlistRepository,
    private readonly movieRepository: MovieRepository,
    private readonly redisService: RedisService,
  ) {}

  async addToWatchlist(userId: string, movieId: string): Promise<WatchlistItemResponseDto> {
    
    const movie = await this.movieRepository.findById(movieId);
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }

    
    const existing = await this.watchlistRepository.findByUserAndMovie(userId, movieId);
    if (existing) {
      console.log('Movie already in watchlist, returning existing item');
      return this.mapToResponseDto(existing);
    }

    try {
    
      console.log('Creating new watchlist item...');
      const watchlistItem = await this.watchlistRepository.create(userId, movieId);
      console.log('Watchlist item created successfully:', watchlistItem);

   
      await this.invalidateCache(userId, movieId);

      return this.mapToResponseDto(watchlistItem);
    } catch (error) {
      console.error('Error in addToWatchlist:', error);
      throw error;
    }
  }

  async removeFromWatchlist(userId: string, movieId: string): Promise<boolean> {
   
    const movie = await this.movieRepository.findById(movieId);
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }

   
    const deleted = await this.watchlistRepository.delete(userId, movieId);

  
    if (deleted) {
      await this.invalidateCache(userId, movieId);
    }

    return deleted;
  }

  async getUserWatchlist(userId: string, filterDto: WatchlistFilterDto = {}): Promise<WatchlistItemWithMovieResponseDto[]> {
    const { genre } = filterDto;
    const cacheKey = `user_watchlist_items_${userId}${genre ? '_genre_' + genre : ''}`;
    
    const cachedResult = await this.redisService.get<WatchlistItemWithMovieResponseDto[]>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    let watchlistItems = await this.watchlistRepository.findByUser(userId);
    
    if (watchlistItems.length === 0) {
      return [];
    }
    
  
    if (genre) {
      watchlistItems = watchlistItems.filter(item => {
        const movie = item.movie as any;
        return movie.genres && movie.genres.some((g: { name: string }) => g.name.toLowerCase() === genre.toLowerCase());
      });
    }
    
    if (watchlistItems.length === 0) {
      return [];
    }
    
 
    const mappedItems = watchlistItems.map(item => {
      return this.mapToResponseWithMovieDto(item, item.movie as any);
    });
    
    // Cache the result for 5 minutes (300 seconds)
    await this.redisService.set(cacheKey, mappedItems, 300);
 
    return mappedItems;
  }

  async isInWatchlist(userId: string, movieId: string): Promise<boolean> {
    const item = await this.watchlistRepository.findByUserAndMovie(userId, movieId);
    return !!item;
  }

  async getAllMovieIdsInWatchlist(userId: string): Promise<string[]> {
    return this.watchlistRepository.findAllMovieIdsByUser(userId);
  }

  private async invalidateCache(userId: string, movieId: string): Promise<void> {
    // Clear user watchlist cache
    await this.redisService.delete(`user_watchlist_items_${userId}`);
    await this.redisService.delete(`user_watchlist_${userId}_*`);
    
    // Clear movie cache that might include watchlist status
    await this.redisService.delete(`movie_${movieId}_${userId}`);
  }

  private mapToResponseDto(watchlistItem: any): WatchlistItemResponseDto {
    return {
      id: watchlistItem.id || watchlistItem._id?.toString(),
      userId: watchlistItem.user?._id?.toString() || watchlistItem.user?.toString(),
      movieId: watchlistItem.movie?._id?.toString() || watchlistItem.movie?.toString(),
      createdAt: watchlistItem.createdAt,
      updatedAt: watchlistItem.updatedAt,
    };
  }
  
  private mapToResponseWithMovieDto(watchlistItem: any, movieDoc: MovieDocument): WatchlistItemWithMovieResponseDto {
    const baseDto = this.mapToResponseDto(watchlistItem);
    const userId = watchlistItem.user?._id?.toString() || watchlistItem.user?.toString();
    
    // Create a complete response with movie data
    return {
      ...baseDto,
      movie: {
        id: movieDoc._id.toString(),
        tmdbId: movieDoc.tmdbId,
        title: movieDoc.title,
        overview: movieDoc.overview,
        posterPath: movieDoc.posterPath,
        backdropPath: movieDoc.backdropPath,
        releaseDate: movieDoc.releaseDate,
        voteAverage: movieDoc.voteAverage,
        voteCount: movieDoc.voteCount,
        popularity: movieDoc.popularity,
        genres: movieDoc.genres,
        adult: movieDoc.adult || false,
        // Include optional fields for our extended MovieResponseDto
        isInWatchlist: true, // Since this is coming from watchlist, it's always true
        isFavorite: false, // We'll need to implement this feature later
        userRatingAverage: 0, // Default values
        userRatingsCount: 0
      }
    };
  }
}
