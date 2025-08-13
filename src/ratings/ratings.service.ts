import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RedisService } from '../cache/redis.service';
import { RatingRepository } from './repositories/rating.repository';
import { CreateRatingDto, RatingResponseDto, UpdateRatingDto } from './dto/rating.dto';
import { RatingDocument } from './entities/rating.entity';

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(
    private readonly ratingRepository: RatingRepository,
    private readonly redisService: RedisService,
  ) {}

  async rateMovie(
    userId: string,
    createRatingDto: CreateRatingDto,
  ): Promise<RatingResponseDto> {
    try {
      const existingRating = await this.ratingRepository.findByUserAndMovie(
        userId,
        createRatingDto.movieId,
      );

      let rating;
      if (existingRating) {
        rating = await this.ratingRepository.update(
          userId,
          createRatingDto.movieId,
          createRatingDto.rating,
          createRatingDto.comment,
        );
      } else {
        rating = await this.ratingRepository.create(createRatingDto, userId);
      }

      await this.clearRatingCaches(userId, createRatingDto.movieId);

      return this.mapRatingToResponseDto(rating);
    } catch (error) {
      this.logger.error(`Error rating movie: ${error.message}`);
      throw error;
    }
  }

  async updateRating(
    userId: string,
    movieId: string,
    updateRatingDto: UpdateRatingDto,
  ): Promise<RatingResponseDto> {
    const existingRating = await this.ratingRepository.findByUserAndMovie(
      userId,
      movieId,
    );

    if (!existingRating) {
      throw new NotFoundException(`Rating for movie ID ${movieId} not found`);
    }

    const updatedRating = await this.ratingRepository.update(
      userId,
      movieId,
      updateRatingDto.rating,
      updateRatingDto.comment,
    );

    await this.clearRatingCaches(userId, movieId);

    return this.mapRatingToResponseDto(updatedRating);
  }

  async deleteRating(userId: string, movieId: string): Promise<void> {
    const result = await this.ratingRepository.delete(userId, movieId);
    
    if (!result) {
      throw new NotFoundException(`Rating for movie ID ${movieId} not found`);
    }

    await this.clearRatingCaches(userId, movieId);
  }

  async getUserRating(
    userId: string,
    movieId: string,
  ): Promise<RatingResponseDto | null> {
    const cacheKey = `rating_${userId}_${movieId}`;

    const cachedResult = await this.redisService.get<RatingResponseDto>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const rating = await this.ratingRepository.findByUserAndMovie(userId, movieId);
    
    if (!rating) {
      return null;
    }

    const response = this.mapRatingToResponseDto(rating);
    
    await this.redisService.set(cacheKey, response, 300); // 5 minutes TTL
    
    return response;
  }

  async getUserRatings(userId: string): Promise<RatingResponseDto[]> {
    const cacheKey = `ratings_user_${userId}`;

    const cachedResult = await this.redisService.get<RatingResponseDto[]>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const ratings = await this.ratingRepository.findByUser(userId);
    const response = ratings.map(rating => this.mapRatingToResponseDto(rating));
    
    await this.redisService.set(cacheKey, response, 300); // 5 minutes TTL
    
    return response;
  }

  async getMovieRatings(movieId: string): Promise<RatingResponseDto[]> {
    const cacheKey = `ratings_movie_${movieId}`;

    const cachedResult = await this.redisService.get<RatingResponseDto[]>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const ratings = await this.ratingRepository.findByMovie(movieId);
    const response = ratings.map(rating => this.mapRatingToResponseDto(rating));
    
    await this.redisService.set(cacheKey, response, 300); // 5 minutes TTL
    
    return response;
  }

  async getMovieAverageRating(movieId: string): Promise<{ average: number; count: number }> {
    const cacheKey = `rating_avg_${movieId}`;

    const cachedResult = await this.redisService.get<{ average: number; count: number }>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const result = await this.ratingRepository.calculateAverageRating(movieId);
    
    await this.redisService.set(cacheKey, result, 300); // 5 minute TTL
    
    return result;
  }

  private async clearRatingCaches(userId: string, movieId: string): Promise<void> {
    await Promise.all([
      this.redisService.delete(`rating_${userId}_${movieId}`),
      this.redisService.delete(`ratings_user_${userId}`),
      this.redisService.delete(`ratings_movie_${movieId}`),
      this.redisService.delete(`rating_avg_${movieId}`),
      
      this.redisService.delete(`movie_${movieId}_${userId}`),
      this.redisService.delete(`movie_${movieId}_nouser`),
      
      this.redisService.delete('movies_*'),
    ]);
    
    this.logger.debug(`Cleared caches for movie ${movieId} and user ${userId}`);
  }

  private mapRatingToResponseDto(rating: RatingDocument): RatingResponseDto {
    const response: RatingResponseDto = {
      id: rating._id.toString(),
      userId: rating.user ? (typeof rating.user === 'string' ? rating.user : (rating.user as any)._id?.toString() || '') : '',
      movieId: rating.movie ? (typeof rating.movie === 'string' ? rating.movie : (rating.movie as any)._id?.toString() || '') : '',
      rating: rating.rating,
      comment: rating.comment,
      createdAt: (rating as any).createdAt,
      updatedAt: (rating as any).updatedAt,
    };
    
    return response;
  }
}
