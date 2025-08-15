import { Test, TestingModule } from '@nestjs/testing';
import { WatchlistService } from './watchlist.service';
import { WatchlistRepository } from './repositories/watchlist.repository';
import { MovieRepository } from '../movie/repositories/movie.repository';
import { RedisService } from '../cache/redis.service';
import { NotFoundException } from '@nestjs/common';

describe('WatchlistService', () => {
  let service: WatchlistService;
  let watchlistRepository;
  let movieRepository;
  let redisService;

  const userId = 'user-123';
  const movieId = 'movie-123';

  const mockMovie = {
    _id: { toString: () => movieId },
    id: 12345,
    title: 'Test Movie',
    overview: 'Test Overview',
    posterPath: '/test.jpg',
    voteAverage: 8.5,
    voteCount: 100,
    watchlist: [],
    favorites: [],
    userRatingAverage: 0,
    userRatingCount: 0,
    genres: ['Action', 'Drama'],
    toString: () => movieId
  };

  const mockWatchlistItem = {
    _id: 'watchlist-item-123',
    user: userId,
    movie: movieId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockWatchlistRepository = {
      findByUserAndMovie: jest.fn(),
      findByUser: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findAllMovieIdsByUser: jest.fn(),
    };

    const mockMovieRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
    };

    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchlistService,
        {
          provide: WatchlistRepository,
          useValue: mockWatchlistRepository,
        },
        {
          provide: MovieRepository,
          useValue: mockMovieRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<WatchlistService>(WatchlistService);
    watchlistRepository = mockWatchlistRepository;
    movieRepository = mockMovieRepository;
    redisService = mockRedisService;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addToWatchlist', () => {
    it('should throw NotFoundException if movie not found', async () => {
      movieRepository.findById.mockResolvedValue(null);

      await expect(service.addToWatchlist(userId, movieId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return existing item if already in watchlist', async () => {
      movieRepository.findById.mockResolvedValue(mockMovie);
      watchlistRepository.findByUserAndMovie.mockResolvedValue(mockWatchlistItem);

      const result = await service.addToWatchlist(userId, movieId);
      
      expect(result.id).toBe(mockWatchlistItem._id);
      expect(watchlistRepository.create).not.toHaveBeenCalled();
    });

    it('should add movie to watchlist', async () => {
      movieRepository.findById.mockResolvedValue(mockMovie);
      watchlistRepository.findByUserAndMovie.mockResolvedValue(null);
      watchlistRepository.create.mockResolvedValue(mockWatchlistItem);

      const result = await service.addToWatchlist(userId, movieId);
      
      expect(result.id).toBe(mockWatchlistItem._id);
      expect(watchlistRepository.create).toHaveBeenCalledWith(userId, movieId);
      expect(redisService.delete).toHaveBeenCalledTimes(3);
    });
  });

  describe('removeFromWatchlist', () => {
    it('should throw NotFoundException if movie not found', async () => {
      movieRepository.findById.mockResolvedValue(null);

      await expect(service.removeFromWatchlist(userId, movieId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should remove movie from watchlist', async () => {
      movieRepository.findById.mockResolvedValue(mockMovie);
      watchlistRepository.delete.mockResolvedValue(true);

      const result = await service.removeFromWatchlist(userId, movieId);
      
      expect(result).toBe(true);
      expect(watchlistRepository.delete).toHaveBeenCalledWith(userId, movieId);
      expect(redisService.delete).toHaveBeenCalledTimes(3);
    });

    it('should return false if movie was not in watchlist', async () => {
      movieRepository.findById.mockResolvedValue(mockMovie);
      watchlistRepository.delete.mockResolvedValue(false);

      const result = await service.removeFromWatchlist(userId, movieId);
      
      expect(result).toBe(false);
      expect(redisService.delete).not.toHaveBeenCalled();
    });
  });

  describe('getUserWatchlist', () => {
    it('should return cached watchlist if available', async () => {
      const cachedWatchlist = [{ id: 'item-1', userId, movieId }];
      redisService.get.mockResolvedValue(cachedWatchlist);

      const result = await service.getUserWatchlist(userId);
      
      expect(result).toEqual(cachedWatchlist);
      expect(watchlistRepository.findByUser).not.toHaveBeenCalled();
    });

    it('should fetch and return watchlist if not in cache', async () => {
      redisService.get.mockResolvedValue(null);
      // Create populated watchlist item for the test
      const populatedWatchlistItem = {
        ...mockWatchlistItem,
        movie: mockMovie
      };
      watchlistRepository.findByUser.mockResolvedValue([populatedWatchlistItem]);

      const result = await service.getUserWatchlist(userId);
      
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(mockWatchlistItem._id);
      expect(result[0].movie).toBeDefined();
      expect(watchlistRepository.findByUser).toHaveBeenCalledWith(userId);
      expect(redisService.set).toHaveBeenCalled();
    });
    
    it('should filter watchlist by genre name when provided', async () => {
      redisService.get.mockResolvedValue(null);
      
      // Create a movie with Action genre
      const movieWithGenre = {
        ...mockMovie,
        genres: [{ name: 'Action' }]
      };
      
      // Create populated watchlist item with the movie that has genres
      const populatedWatchlistItem = {
        ...mockWatchlistItem,
        movie: movieWithGenre
      };
      
      watchlistRepository.findByUser.mockResolvedValue([populatedWatchlistItem]);
      
      const filterDto = { genre: 'Action' };
      const result = await service.getUserWatchlist(userId, filterDto);
      
      expect(result).toHaveLength(1);
      expect(result[0].movie).toBeDefined();
      expect(redisService.set).toHaveBeenCalledWith(
        `user_watchlist_items_${userId}_genre_Action`,
        expect.any(Array),
        300
      );
    });
    
    it('should return empty array when no movies match the genre filter', async () => {
      redisService.get.mockResolvedValue(null);
      
      // Create a movie with Drama genre only
      const movieWithDramaOnly = {
        ...mockMovie,
        genres: [{ name: 'Drama' }]
      };
      
      // Create populated watchlist item
      const populatedWatchlistItem = {
        ...mockWatchlistItem,
        movie: movieWithDramaOnly
      };
      
      watchlistRepository.findByUser.mockResolvedValue([populatedWatchlistItem]);
      
      const filterDto = { genre: 'Comedy' };
      const result = await service.getUserWatchlist(userId, filterDto);
      
      expect(result).toHaveLength(0);
    });
  });

  describe('isInWatchlist', () => {
    it('should return true if movie is in watchlist', async () => {
      watchlistRepository.findByUserAndMovie.mockResolvedValue(mockWatchlistItem);

      const result = await service.isInWatchlist(userId, movieId);
      
      expect(result).toBe(true);
    });

    it('should return false if movie is not in watchlist', async () => {
      watchlistRepository.findByUserAndMovie.mockResolvedValue(null);

      const result = await service.isInWatchlist(userId, movieId);
      
      expect(result).toBe(false);
    });
  });

  describe('getAllMovieIdsInWatchlist', () => {
    it('should return array of movie IDs in watchlist', async () => {
      const movieIds = ['movie-1', 'movie-2', 'movie-3'];
      watchlistRepository.findAllMovieIdsByUser.mockResolvedValue(movieIds);

      const result = await service.getAllMovieIdsInWatchlist(userId);
      
      expect(result).toEqual(movieIds);
      expect(watchlistRepository.findAllMovieIdsByUser).toHaveBeenCalledWith(userId);
    });
  });
});
