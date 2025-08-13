import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { RatingRepository } from './repositories/rating.repository';
import { RedisService } from '../cache/redis.service';
import { CreateRatingDto, UpdateRatingDto, RatingResponseDto } from './dto/rating.dto';
import { RatingDocument } from './entities/rating.entity';

describe('RatingsService', () => {
  let service: RatingsService;
  let ratingRepository: jest.Mocked<RatingRepository>;
  let redisService: jest.Mocked<RedisService>;

  const mockRatingDocument = {
    _id: { toString: () => 'rating123' },
    user: { _id: { toString: () => 'user123' }, name: 'Test User' },
    movie: { _id: { toString: () => 'movie123' }, title: 'Test Movie' },
    rating: 8,
    comment: 'Great movie!',
    save: jest.fn().mockImplementation(function() { return Promise.resolve(this); }),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as RatingDocument;

  const mockRatingResponse: RatingResponseDto = {
    id: 'rating123',
    userId: 'user123',
    movieId: 'movie123',
    rating: 8,
    comment: 'Great movie!',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRatingRepository = {
    findByUserAndMovie: jest.fn(),
    create: jest.fn().mockImplementation(() => Promise.resolve(mockRatingDocument)),
    update: jest.fn(),
    delete: jest.fn(),
    findByUser: jest.fn(),
    findByMovie: jest.fn(),
    calculateAverageRating: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        {
          provide: RatingRepository,
          useValue: mockRatingRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
    ratingRepository = module.get(RatingRepository);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('rateMovie', () => {
    const createRatingDto: CreateRatingDto = {
      movieId: 'movie123',
      rating: 8,
      comment: 'Great movie!',
    };

    it('should create a new rating when user has not rated the movie', async () => {
      ratingRepository.findByUserAndMovie.mockResolvedValue(null);
      ratingRepository.create.mockResolvedValue(mockRatingDocument);

      const result = await service.rateMovie('user123', createRatingDto);

      expect(ratingRepository.findByUserAndMovie).toHaveBeenCalledWith('user123', 'movie123');
      expect(ratingRepository.create).toHaveBeenCalledWith(createRatingDto, 'user123');
      expect(redisService.delete).toHaveBeenCalledTimes(7);
      expect(result.id).toBe('rating123');
      expect(result.rating).toBe(8);
    });

    it('should update existing rating when user has already rated the movie', async () => {
      // Create a properly typed document with save method
      const existingRating = {
        _id: { toString: () => 'rating123' },
        user: { _id: { toString: () => 'user123' }, name: 'Test User' },
        movie: { _id: { toString: () => 'movie123' }, title: 'Test Movie' },
        rating: 6,
        comment: 'Great movie!',
        save: jest.fn().mockImplementation(function() { return Promise.resolve(this); }),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as RatingDocument;
      ratingRepository.findByUserAndMovie.mockResolvedValue(existingRating as RatingDocument);
      ratingRepository.update.mockResolvedValue(mockRatingDocument);

      const result = await service.rateMovie('user123', createRatingDto);

      expect(ratingRepository.findByUserAndMovie).toHaveBeenCalledWith('user123', 'movie123');
      expect(ratingRepository.update).toHaveBeenCalledWith('user123', 'movie123', 8, 'Great movie!');
      expect(redisService.delete).toHaveBeenCalledTimes(7); // Updated to match actual cache keys being deleted
      expect(result.rating).toBe(8);
    });

    it('should handle rating without comment', async () => {
      const dtoWithoutComment = { movieId: 'movie123', rating: 7 };
      ratingRepository.findByUserAndMovie.mockResolvedValue(null);
      ratingRepository.create.mockResolvedValue(mockRatingDocument);

      await service.rateMovie('user123', dtoWithoutComment);

      expect(ratingRepository.create).toHaveBeenCalledWith(dtoWithoutComment, 'user123');
    });
  });

  describe('updateRating', () => {
    const updateRatingDto: UpdateRatingDto = {
      rating: 9,
      comment: 'Even better!',
    };

    it('should update an existing rating', async () => {
      ratingRepository.findByUserAndMovie.mockResolvedValue(mockRatingDocument);
      ratingRepository.update.mockResolvedValue(mockRatingDocument);

      const result = await service.updateRating('user123', 'movie123', updateRatingDto);

      expect(ratingRepository.findByUserAndMovie).toHaveBeenCalledWith('user123', 'movie123');
      expect(ratingRepository.update).toHaveBeenCalledWith('user123', 'movie123', 9, 'Even better!');
      expect(redisService.delete).toHaveBeenCalledTimes(7);
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when rating does not exist', async () => {
      ratingRepository.findByUserAndMovie.mockResolvedValue(null);

      await expect(
        service.updateRating('user123', 'movie123', updateRatingDto)
      ).rejects.toThrow(NotFoundException);

      expect(ratingRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteRating', () => {
    it('should delete an existing rating', async () => {
      ratingRepository.delete.mockResolvedValue(true);

      await service.deleteRating('user123', 'movie123');

      expect(ratingRepository.delete).toHaveBeenCalledWith('user123', 'movie123');
      expect(redisService.delete).toHaveBeenCalledTimes(7);
    });

    it('should throw NotFoundException when rating does not exist', async () => {
      ratingRepository.delete.mockResolvedValue(false);

      await expect(
        service.deleteRating('user123', 'movie123')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserRating', () => {
    it('should return cached rating if available', async () => {
      redisService.get.mockResolvedValue(mockRatingResponse);

      const result = await service.getUserRating('user123', 'movie123');

      expect(redisService.get).toHaveBeenCalledWith('rating_user123_movie123');
      expect(ratingRepository.findByUserAndMovie).not.toHaveBeenCalled();
      expect(result).toEqual(mockRatingResponse);
    });

    it('should fetch from database and cache when not in cache', async () => {
      redisService.get.mockResolvedValue(null);
      ratingRepository.findByUserAndMovie.mockResolvedValue(mockRatingDocument);

      const result = await service.getUserRating('user123', 'movie123');

      expect(redisService.get).toHaveBeenCalledWith('rating_user123_movie123');
      expect(ratingRepository.findByUserAndMovie).toHaveBeenCalledWith('user123', 'movie123');
      expect(redisService.set).toHaveBeenCalledWith('rating_user123_movie123', expect.any(Object), 300);
      expect(result).toBeDefined();
    });

    it('should return null when rating does not exist', async () => {
      redisService.get.mockResolvedValue(null);
      ratingRepository.findByUserAndMovie.mockResolvedValue(null);

      const result = await service.getUserRating('user123', 'movie123');

      expect(result).toBeNull();
      expect(redisService.set).not.toHaveBeenCalled();
    });
  });

  describe('getUserRatings', () => {
    it('should return cached user ratings if available', async () => {
      const cachedRatings = [mockRatingResponse];
      redisService.get.mockResolvedValue(cachedRatings);

      const result = await service.getUserRatings('user123');

      expect(redisService.get).toHaveBeenCalledWith('ratings_user_user123');
      expect(ratingRepository.findByUser).not.toHaveBeenCalled();
      expect(result).toEqual(cachedRatings);
    });

    it('should fetch from database and cache when not in cache', async () => {
      redisService.get.mockResolvedValue(null);
      ratingRepository.findByUser.mockResolvedValue([mockRatingDocument]);

      const result = await service.getUserRatings('user123');

      expect(redisService.get).toHaveBeenCalledWith('ratings_user_user123');
      expect(ratingRepository.findByUser).toHaveBeenCalledWith('user123');
      expect(redisService.set).toHaveBeenCalledWith('ratings_user_user123', expect.any(Array), 300);
      expect(result).toHaveLength(1);
    });
  });

  describe('getMovieRatings', () => {
    it('should return cached movie ratings if available', async () => {
      const cachedRatings = [mockRatingResponse];
      redisService.get.mockResolvedValue(cachedRatings);

      const result = await service.getMovieRatings('movie123');

      expect(redisService.get).toHaveBeenCalledWith('ratings_movie_movie123');
      expect(ratingRepository.findByMovie).not.toHaveBeenCalled();
      expect(result).toEqual(cachedRatings);
    });

    it('should fetch from database and cache when not in cache', async () => {
      redisService.get.mockResolvedValue(null);
      ratingRepository.findByMovie.mockResolvedValue([mockRatingDocument]);

      const result = await service.getMovieRatings('movie123');

      expect(redisService.get).toHaveBeenCalledWith('ratings_movie_movie123');
      expect(ratingRepository.findByMovie).toHaveBeenCalledWith('movie123');
      expect(redisService.set).toHaveBeenCalledWith('ratings_movie_movie123', expect.any(Array), 300);
      expect(result).toHaveLength(1);
    });
  });

  describe('getMovieAverageRating', () => {
    it('should return cached average rating if available', async () => {
      const cachedAverage = { average: 7.5, count: 4 };
      redisService.get.mockResolvedValue(cachedAverage);

      const result = await service.getMovieAverageRating('movie123');

      expect(redisService.get).toHaveBeenCalledWith('rating_avg_movie123');
      expect(ratingRepository.calculateAverageRating).not.toHaveBeenCalled();
      expect(result).toEqual(cachedAverage);
    });

    it('should fetch from database and cache when not in cache', async () => {
      const averageRating = { average: 8.2, count: 5 };
      redisService.get.mockResolvedValue(null);
      ratingRepository.calculateAverageRating.mockResolvedValue(averageRating);

      const result = await service.getMovieAverageRating('movie123');

      expect(redisService.get).toHaveBeenCalledWith('rating_avg_movie123');
      expect(ratingRepository.calculateAverageRating).toHaveBeenCalledWith('movie123');
      expect(redisService.set).toHaveBeenCalledWith('rating_avg_movie123', averageRating, 300);
      expect(result).toEqual(averageRating);
    });
  });

  describe('clearRatingCaches', () => {
    it('should clear all related caches', async () => {
      await service['clearRatingCaches']('user123', 'movie123');

      expect(redisService.delete).toHaveBeenCalledTimes(7);
      expect(redisService.delete).toHaveBeenCalledWith('rating_user123_movie123');
      expect(redisService.delete).toHaveBeenCalledWith('ratings_user_user123');
      expect(redisService.delete).toHaveBeenCalledWith('ratings_movie_movie123');
      expect(redisService.delete).toHaveBeenCalledWith('rating_avg_movie123');
      expect(redisService.delete).toHaveBeenCalledWith('movie_movie123_user123');
      expect(redisService.delete).toHaveBeenCalledWith('movie_movie123_nouser');
      expect(redisService.delete).toHaveBeenCalledWith('movies_*');
    });
  });

  describe('mapRatingToResponseDto', () => {
    it('should correctly map rating document to response DTO', () => {
      const result = service['mapRatingToResponseDto'](mockRatingDocument);

      expect(result).toEqual({
        id: 'rating123',
        userId: 'user123',
        movieId: 'movie123',
        rating: 8,
        comment: 'Great movie!',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should handle populated user and movie references', () => {
      const populatedRating = {
        _id: { toString: () => 'rating123' },
        user: { _id: { toString: () => 'user123' }, name: 'Test User' },
        movie: { _id: { toString: () => 'movie123' }, title: 'Test Movie' },
        rating: 8,
        comment: 'Great movie!',
        save: jest.fn().mockImplementation(function() { return Promise.resolve(this); }),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as RatingDocument;

      const result = service['mapRatingToResponseDto'](populatedRating);

      expect(result.userId).toBe('user123');
      expect(result.movieId).toBe('movie123');
    });
  });
});
