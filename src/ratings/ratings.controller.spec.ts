import { Test, TestingModule } from '@nestjs/testing';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { CreateRatingDto, UpdateRatingDto, RatingResponseDto } from './dto/rating.dto';

describe('RatingsController', () => {
  let controller: RatingsController;
  let ratingsService: jest.Mocked<RatingsService>;

  const mockUser = { id: 'user123', email: 'test@example.com' };
  const mockRequest = { user: mockUser };

  const mockRatingResponse: RatingResponseDto = {
    id: 'rating123',
    userId: 'user123',
    movieId: 'movie123',
    rating: 8,
    comment: 'Great movie!',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRatingsService = {
    rateMovie: jest.fn(),
    updateRating: jest.fn(),
    deleteRating: jest.fn(),
    getMovieRatings: jest.fn(),
    getMovieAverageRating: jest.fn(),
    getUserRatings: jest.fn(),
    getUserRating: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatingsController],
      providers: [
        {
          provide: RatingsService,
          useValue: mockRatingsService,
        },
      ],
    }).compile();

    controller = module.get<RatingsController>(RatingsController);
    ratingsService = module.get(RatingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('rateMovie', () => {
    it('should create a new rating', async () => {
      const createRatingDto: CreateRatingDto = {
        movieId: 'movie123',
        rating: 8,
        comment: 'Great movie!',
      };

      ratingsService.rateMovie.mockResolvedValue(mockRatingResponse);

      const result = await controller.rateMovie(mockRequest, createRatingDto);

      expect(ratingsService.rateMovie).toHaveBeenCalledWith('user123', createRatingDto);
      expect(result).toEqual(mockRatingResponse);
    });

    it('should handle rating creation without comment', async () => {
      const createRatingDto: CreateRatingDto = {
        movieId: 'movie123',
        rating: 7,
      };

      const expectedResponse = { ...mockRatingResponse, rating: 7, comment: undefined };
      ratingsService.rateMovie.mockResolvedValue(expectedResponse);

      const result = await controller.rateMovie(mockRequest, createRatingDto);

      expect(ratingsService.rateMovie).toHaveBeenCalledWith('user123', createRatingDto);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('updateRating', () => {
    it('should update an existing rating', async () => {
      const updateRatingDto: UpdateRatingDto = {
        rating: 9,
        comment: 'Even better on second watch!',
      };

      const updatedResponse = { ...mockRatingResponse, ...updateRatingDto };
      ratingsService.updateRating.mockResolvedValue(updatedResponse);

      const result = await controller.updateRating(mockRequest, 'movie123', updateRatingDto);

      expect(ratingsService.updateRating).toHaveBeenCalledWith('user123', 'movie123', updateRatingDto);
      expect(result).toEqual(updatedResponse);
    });

    it('should update rating without comment', async () => {
      const updateRatingDto: UpdateRatingDto = {
        rating: 6,
      };

      const updatedResponse = { ...mockRatingResponse, rating: 6 };
      ratingsService.updateRating.mockResolvedValue(updatedResponse);

      const result = await controller.updateRating(mockRequest, 'movie123', updateRatingDto);

      expect(ratingsService.updateRating).toHaveBeenCalledWith('user123', 'movie123', updateRatingDto);
      expect(result).toEqual(updatedResponse);
    });
  });

  describe('deleteRating', () => {
    it('should delete a rating', async () => {
      ratingsService.deleteRating.mockResolvedValue(undefined);

      await controller.deleteRating(mockRequest, 'movie123');

      expect(ratingsService.deleteRating).toHaveBeenCalledWith('user123', 'movie123');
    });
  });

  describe('getMovieRatings', () => {
    it('should return all ratings for a movie', async () => {
      const movieRatings = [
        mockRatingResponse,
        { ...mockRatingResponse, id: 'rating456', userId: 'user456', rating: 7 },
      ];

      ratingsService.getMovieRatings.mockResolvedValue(movieRatings);

      const result = await controller.getMovieRatings('movie123');

      expect(ratingsService.getMovieRatings).toHaveBeenCalledWith('movie123');
      expect(result).toEqual(movieRatings);
    });

    it('should return empty array when no ratings exist', async () => {
      ratingsService.getMovieRatings.mockResolvedValue([]);

      const result = await controller.getMovieRatings('movie123');

      expect(ratingsService.getMovieRatings).toHaveBeenCalledWith('movie123');
      expect(result).toEqual([]);
    });
  });

  describe('getMovieAverageRating', () => {
    it('should return average rating and count', async () => {
      const averageRating = { average: 7.5, count: 4 };
      ratingsService.getMovieAverageRating.mockResolvedValue(averageRating);

      const result = await controller.getMovieAverageRating('movie123');

      expect(ratingsService.getMovieAverageRating).toHaveBeenCalledWith('movie123');
      expect(result).toEqual(averageRating);
    });

    it('should return zero average when no ratings exist', async () => {
      const averageRating = { average: 0, count: 0 };
      ratingsService.getMovieAverageRating.mockResolvedValue(averageRating);

      const result = await controller.getMovieAverageRating('movie123');

      expect(ratingsService.getMovieAverageRating).toHaveBeenCalledWith('movie123');
      expect(result).toEqual(averageRating);
    });
  });

  describe('getUserRatings', () => {
    it('should return all ratings by the user', async () => {
      const userRatings = [
        mockRatingResponse,
        { ...mockRatingResponse, id: 'rating789', movieId: 'movie456', rating: 9 },
      ];

      ratingsService.getUserRatings.mockResolvedValue(userRatings);

      const result = await controller.getUserRatings(mockRequest);

      expect(ratingsService.getUserRatings).toHaveBeenCalledWith('user123');
      expect(result).toEqual(userRatings);
    });

    it('should return empty array when user has no ratings', async () => {
      ratingsService.getUserRatings.mockResolvedValue([]);

      const result = await controller.getUserRatings(mockRequest);

      expect(ratingsService.getUserRatings).toHaveBeenCalledWith('user123');
      expect(result).toEqual([]);
    });
  });

  describe('getUserRating', () => {
    it('should return user rating for a specific movie', async () => {
      ratingsService.getUserRating.mockResolvedValue(mockRatingResponse);

      const result = await controller.getUserRating(mockRequest, 'movie123');

      expect(ratingsService.getUserRating).toHaveBeenCalledWith('user123', 'movie123');
      expect(result).toEqual(mockRatingResponse);
    });

    it('should return null when user has not rated the movie', async () => {
      ratingsService.getUserRating.mockResolvedValue(null);

      const result = await controller.getUserRating(mockRequest, 'movie123');

      expect(ratingsService.getUserRating).toHaveBeenCalledWith('user123', 'movie123');
      expect(result).toBeNull();
    });
  });
});
