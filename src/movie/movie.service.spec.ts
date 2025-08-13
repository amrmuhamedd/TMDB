import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/common/cache';
import { MovieService } from './movie.service';
import { MovieRepository } from './repositories/movie.repository';
import { NotFoundException } from '@nestjs/common';
import { MovieFilterDto } from './dto/movie.dto';
import { TmdbService } from '../tmdb/services/tmdb.service';
import { RedisService } from '../cache/redis.service';
import { RatingsService } from '../ratings/ratings.service';

jest.mock('../tmdb/services/tmdb.service');
jest.mock('../cache/redis.service');

describe('MovieService', () => {
  let service: MovieService;
  let repository: MovieRepository;
  let tmdbService: TmdbService;
  let cacheManager;
  let redisService;
  let ratingsService;

  const mockMovie = {
    _id: { toString: () => 'movie-id-1' },
    tmdbId: 123,
    title: 'Test Movie',
    overview: 'Test Overview',
    posterPath: '/poster.jpg',
    backdropPath: '/backdrop.jpg',
    releaseDate: new Date('2023-01-01'),
    genres: [{ id: 1, name: 'Action' }],
    popularity: 100,
    voteCount: 1000,
    voteAverage: 8.5,
    adult: false,
    watchlist: [{ toString: () => 'user-2' }],
    favorites: [{ toString: () => 'user-3' }],
    save: jest.fn().mockResolvedValue({}),
  };

  const mockMovieRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByIds: jest.fn(),
    findByTmdbId: jest.fn(),
    search: jest.fn(),
    findByGenre: jest.fn(),
    update: jest.fn(),
    updateByTmdbId: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    saveMany: jest.fn(),
  };

  const mockTmdbService = {
    getPopularMovies: jest.fn(),
    getMovieDetails: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    deletePattern: jest.fn(),
  };

  const mockRatingsService = {
    getMovieAverageRating: jest.fn().mockResolvedValue({ average: 7.5, count: 50 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovieService,
        {
          provide: MovieRepository,
          useValue: mockMovieRepository,
        },
        {
          provide: TmdbService,
          useValue: mockTmdbService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: RatingsService,
          useValue: mockRatingsService,
        },
      ],
    }).compile();

    service = module.get<MovieService>(MovieService);
    repository = module.get<MovieRepository>(MovieRepository);
    tmdbService = module.get<TmdbService>(TmdbService);
    cacheManager = module.get(CACHE_MANAGER);
    redisService = module.get(RedisService);
    ratingsService = module.get<RatingsService>(RatingsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    const filterDto: MovieFilterDto = { page: 1, limit: 10 };

    it('should return cached results if available', async () => {
      const cachedResult = { page: 1, limit: 10, total: 1, data: [mockMovie] };
      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedResult));

      const result = await service.findAll(filterDto);
      expect(result).toBeDefined();
      expect(mockMovieRepository.findAll).not.toHaveBeenCalled();
    });

    it('should return movies when no cache is available', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockMovieRepository.findAll.mockResolvedValue({
        data: [mockMovie],
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await service.findAll(filterDto);
      expect(result).toBeDefined();
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should search movies when search param is provided', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockMovieRepository.search.mockResolvedValue({
        data: [mockMovie],
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await service.findAll({ ...filterDto, search: 'test' });
      expect(result).toBeDefined();
      expect(mockMovieRepository.search).toHaveBeenCalledWith('test', 1, 10);
    });

    it('should filter by genre name when genre param is provided', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockMovieRepository.findAll.mockResolvedValue({
        data: [mockMovie],
        total: 1,
        page: 1,
        limit: 10,
      });

      const result = await service.findAll({ ...filterDto, genre: 'Action' });
      expect(result).toBeDefined();
      expect(mockMovieRepository.findAll).toHaveBeenCalledWith(1, 10, {
        'genres.name': { $regex: expect.any(RegExp) },
      });
    });
  });

  describe('findOne', () => {
    const movieId = 'movie-id-1';

    it('should return cached movie if available', async () => {
      const cachedMovie = { id: movieId, title: 'Cached Movie' };
      mockRedisService.get.mockResolvedValue(cachedMovie);

      const result = await service.findOne(movieId);

      expect(result).toEqual(cachedMovie);
      expect(mockMovieRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if movie not found', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockMovieRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(movieId)).rejects.toThrow(NotFoundException);
    });

    it('should return movie and cache it when no cache exists', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockMovieRepository.findById.mockResolvedValue(mockMovie);

      const result = await service.findOne(movieId);
      expect(result).toBeDefined();
    });
  });

  describe('create', () => {
    const createDto = {
      title: 'New Movie',
      overview: 'New Overview',
      posterPath: '/new-poster.jpg',
      tmdbId: 456,
      releaseDate: new Date('2023-02-01'),
      genres: [{ id: 1, name: 'Action' }],
    };

    it('should create a new movie', async () => {
      mockMovieRepository.create.mockResolvedValue(mockMovie);

      const result = await service.create(createDto);

      expect(mockMovieRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockRedisService.delete).toHaveBeenCalledWith('movies_*');
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    const movieId = 'movie-id-1';
    const updateDto = {
      tmdbId: 123,
      title: 'Updated Title',
      overview: 'Updated Overview',
    };

    it('should throw NotFoundException if movie not found', async () => {
      mockMovieRepository.update.mockResolvedValue(null);

      await expect(service.update(movieId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update an existing movie', async () => {
      const updatedMovie = {
        ...mockMovie,
        title: 'Updated Title',
        overview: 'Updated Overview',
      };

      mockMovieRepository.update.mockResolvedValue(updatedMovie);

      const result = await service.update(movieId, updateDto);

      expect(mockMovieRepository.update).toHaveBeenCalledWith(
        movieId,
        updateDto,
      );
      expect(mockRedisService.delete).toHaveBeenCalledWith(
        `movie_${movieId}_*`,
      );
      expect(mockRedisService.delete).toHaveBeenCalledWith('movies_*');
      expect(result).toBeDefined();
    });
  });

  describe('delete', () => {
    const movieId = 'movie-id-1';

    it('should throw NotFoundException if movie not found', async () => {
      mockMovieRepository.findById.mockResolvedValue(null);

      await expect(service.delete(movieId)).rejects.toThrow(NotFoundException);
    });

    it('should delete an existing movie', async () => {
      mockMovieRepository.findById.mockResolvedValue(mockMovie);
      mockMovieRepository.delete.mockResolvedValue(undefined);

      await service.delete(movieId);

      expect(mockMovieRepository.delete).toHaveBeenCalledWith(movieId);
      expect(mockRedisService.delete).toHaveBeenCalledWith(
        `movie_${movieId}_nouser`,
      );
    });
  });

  describe('syncPopularMovies', () => {
    it('should sync popular movies from TMDB', async () => {
      const mockTmdbPopularMovies = {
        results: [{ id: 123 }, { id: 456 }],
      };

      const mockMovieDetails1 = {
        id: 123,
        title: 'Movie 1',
        overview: 'Overview 1',
        poster_path: '/poster1.jpg',
        backdrop_path: '/backdrop1.jpg',
        release_date: '2023-01-01',
        popularity: 100,
        vote_count: 1000,
        vote_average: 8.5,
        adult: false,
        genres: [{ id: 1, name: 'Action' }],
      };

      const mockMovieDetails2 = {
        id: 456,
        title: 'Movie 2',
        overview: 'Overview 2',
        poster_path: '/poster2.jpg',
        backdrop_path: '/backdrop2.jpg',
        release_date: '2023-02-01',
        popularity: 90,
        vote_count: 900,
        vote_average: 7.5,
        adult: false,
        genres: [{ id: 2, name: 'Drama' }],
      };

      mockTmdbService.getPopularMovies.mockResolvedValue(mockTmdbPopularMovies);
      mockTmdbService.getMovieDetails.mockImplementation(async (id) => {
        if (id === 123) return mockMovieDetails1;
        if (id === 456) return mockMovieDetails2;
        return null;
      });
      mockMovieRepository.updateByTmdbId.mockResolvedValue({});

      await service.syncPopularMovies();

      expect(mockTmdbService.getPopularMovies).toHaveBeenCalledTimes(5);
      expect(mockTmdbService.getMovieDetails).toHaveBeenCalledWith(123);
      expect(mockTmdbService.getMovieDetails).toHaveBeenCalledWith(456);
      expect(mockMovieRepository.updateByTmdbId).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          tmdbId: 123,
          title: 'Movie 1',
        }),
      );
      expect(mockMovieRepository.updateByTmdbId).toHaveBeenCalledWith(
        456,
        expect.objectContaining({
          tmdbId: 456,
          title: 'Movie 2',
        }),
      );
    });

    it('should handle errors during sync', async () => {
      mockTmdbService.getPopularMovies.mockRejectedValue(
        new Error('TMDB API error'),
      );

      await expect(service.syncPopularMovies()).rejects.toThrow(
        'TMDB API error',
      );
    });
  });

  describe('mapMovieToResponseDto', () => {
    it('should map movie document to response DTO correctly', async () => {
      mockMovieRepository.findById.mockResolvedValue(mockMovie);
      mockRedisService.get.mockResolvedValue(null);

      const result = await service.findOne('movie-id-1');

      // Check that the main properties from the movie are correctly mapped
      expect(result).toEqual(expect.objectContaining({
        id: 'movie-id-1',
        title: 'Test Movie',
        tmdbId: 123,
        // Using values from the ratings service mock
        voteAverage: 7.5,  // from mockRatingsService
        voteCount: 50,     // from mockRatingsService
        // Other expected fields from mockMovie
        overview: 'Test Overview',
        posterPath: '/poster.jpg',
        backdropPath: '/backdrop.jpg',
        releaseDate: expect.any(Date), // just check it's a date
        genres: [{ id: 1, name: 'Action' }],
        popularity: 100,
        adult: false
      }));

      // Verify the ratings service was called with the correct movie ID
      expect(mockRatingsService.getMovieAverageRating).toHaveBeenCalledWith('movie-id-1');
    });
  });
});
