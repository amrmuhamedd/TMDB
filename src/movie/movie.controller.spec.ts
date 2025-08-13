import { Test, TestingModule } from '@nestjs/testing';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import {
  CreateMovieDto,
  MovieFilterDto,
  RateMovieDto,
  UpdateMovieDto,
} from './dto/movie.dto';

describe('MovieController', () => {
  let controller: MovieController;
  let service: MovieService;

  const mockMovieResponse = {
    id: 'movie-id-1',
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
    userRatingsCount: 1,
    userRatingAverage: 8,
    isInWatchlist: false,
    isFavorite: false,
  };

  const mockMovieService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    rateMovie: jest.fn(),

    syncPopularMovies: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MovieController],
      providers: [
        {
          provide: MovieService,
          useValue: mockMovieService,
        },
      ],
    }).compile();

    controller = module.get<MovieController>(MovieController);
    service = module.get<MovieService>(MovieService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of movies', async () => {
      const filterDto: MovieFilterDto = { page: 1, limit: 10 };
      const mockResponse = {
        data: [mockMovieResponse],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockMovieService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(filterDto);

      expect(result).toEqual(mockResponse);
      expect(mockMovieService.findAll).toHaveBeenCalledWith(filterDto);
    });
  });

  describe('findOne', () => {
    it('should return a single movie', async () => {
      const movieId = 'movie-id-1';

      mockMovieService.findOne.mockResolvedValue(mockMovieResponse);

      const result = await controller.findOne(movieId);

      expect(result).toEqual(mockMovieResponse);
      expect(mockMovieService.findOne).toHaveBeenCalledWith(movieId);
    });
  });

  describe('create', () => {
    it('should create a new movie', async () => {
      const createMovieDto: CreateMovieDto = {
        tmdbId: 123,
        title: 'New Movie',
        overview: 'New Overview',
      };

      mockMovieService.create.mockResolvedValue(mockMovieResponse);

      const result = await controller.create(createMovieDto);

      expect(result).toEqual(mockMovieResponse);
      expect(mockMovieService.create).toHaveBeenCalledWith(createMovieDto);
    });
  });

  describe('update', () => {
    it('should update a movie', async () => {
      const movieId = 'movie-id-1';
      const updateMovieDto: UpdateMovieDto = {
        tmdbId: 123,
        title: 'Updated Movie',
        overview: 'Updated Overview',
      };

      mockMovieService.update.mockResolvedValue({
        ...mockMovieResponse,
        title: 'Updated Movie',
        overview: 'Updated Overview',
      });

      const result = await controller.update(movieId, updateMovieDto);

      expect(result.title).toBe('Updated Movie');
      expect(mockMovieService.update).toHaveBeenCalledWith(
        movieId,
        updateMovieDto,
      );
    });
  });

  describe('delete', () => {
    it('should delete a movie', async () => {
      const movieId = 'movie-id-1';

      mockMovieService.delete.mockResolvedValue(undefined);

      await controller.delete(movieId);

      expect(mockMovieService.delete).toHaveBeenCalledWith(movieId);
    });
  });

  describe('syncMovies', () => {
    it('should sync movies from TMDB', async () => {
      mockMovieService.syncPopularMovies.mockResolvedValue(undefined);

      const result = await controller.syncMovies();

      expect(result).toEqual({ message: 'Movies synced successfully' });
      expect(mockMovieService.syncPopularMovies).toHaveBeenCalled();
    });
  });
});
