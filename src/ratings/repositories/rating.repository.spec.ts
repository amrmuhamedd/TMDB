import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RatingRepository } from './rating.repository';
import { Rating, RatingDocument } from '../entities/rating.entity';
import { CreateRatingDto } from '../dto/rating.dto';

describe('RatingRepository', () => {
  let repository: RatingRepository;
  let model: any;

  const mockRatingDocument = {
    _id: { toString: () => 'rating123' },
    user: { _id: { toString: () => 'user123' }, name: 'Test User' },
    movie: { _id: { toString: () => 'movie123' }, title: 'Test Movie' },
    rating: 8,
    comment: 'Great movie!',
    save: jest.fn().mockResolvedValue(undefined),
    exec: jest.fn(),
  } as unknown as RatingDocument;

  const mockModelFn = jest.fn();
  
  const mockModel = mockModelFn as unknown as {
    (): any;
    findById: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    findOneAndUpdate: jest.Mock;
    deleteOne: jest.Mock;
    aggregate: jest.Mock;
    exec: jest.Mock;
  };
  
  mockModel.findById = jest.fn();
  mockModel.findOne = jest.fn();
  mockModel.find = jest.fn();
  mockModel.findOneAndUpdate = jest.fn();
  mockModel.deleteOne = jest.fn();
  mockModel.aggregate = jest.fn();
  mockModel.exec = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingRepository,
        {
          provide: getModelToken(Rating.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get<RatingRepository>(RatingRepository);
    model = module.get(getModelToken(Rating.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a new rating', async () => {
      const createRatingDto: CreateRatingDto = {
        movieId: 'movie123',
        rating: 8,
        comment: 'Great movie!',
      };

      const mockCreatedRating = {
        ...mockRatingDocument,
        movie: { _id: { toString: () => 'movie123' } },
        save: jest.fn().mockResolvedValue(mockRatingDocument),
      };

      (model as jest.Mock).mockReturnValue(mockCreatedRating);

      const result = await repository.create(createRatingDto, 'user123');

      expect(model).toHaveBeenCalledWith({
        user: 'user123',
        movie: 'movie123',
        rating: 8,
        comment: 'Great movie!',
      });
      expect(mockCreatedRating.save).toHaveBeenCalled();
      expect(result).toEqual(mockRatingDocument);
    });

    it('should create rating without comment', async () => {
      const createRatingDto: CreateRatingDto = {
        movieId: 'movie123',
        rating: 7,
      };

      const mockCreatedRating = {
        ...mockRatingDocument,
        movie: { _id: { toString: () => 'movie123' } },
        rating: 7,
        save: jest.fn().mockResolvedValue(mockRatingDocument),
      };

      // Reset mock for this test
      (model as jest.Mock).mockReturnValue(mockCreatedRating);

      await repository.create(createRatingDto, 'user123');

      expect(model).toHaveBeenCalledWith({
        user: 'user123',
        movie: 'movie123',
        rating: 7,
      });
    });
  });

  describe('findById', () => {
    it('should find rating by id', async () => {
      const mockExec = jest.fn().mockResolvedValue(mockRatingDocument);
      model.findById.mockReturnValue({ exec: mockExec } as any);

      const result = await repository.findById('rating123');

      expect(model.findById).toHaveBeenCalledWith('rating123');
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockRatingDocument);
    });
  });

  describe('findByUserAndMovie', () => {
    it('should find rating by user and movie', async () => {
      const mockExec = jest.fn().mockResolvedValue(mockRatingDocument);
      model.findOne.mockReturnValue({ exec: mockExec } as any);

      const result = await repository.findByUserAndMovie('user123', 'movie123');

      expect(model.findOne).toHaveBeenCalledWith({
        user: 'user123',
        movie: 'movie123',
      });
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockRatingDocument);
    });

    it('should return null when rating not found', async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      model.findOne.mockReturnValue({ exec: mockExec } as any);

      const result = await repository.findByUserAndMovie('user123', 'movie456');

      expect(result).toBeNull();
    });
  });

  describe('findByMovie', () => {
    it('should find all ratings for a movie', async () => {
      const mockRatings = [mockRatingDocument, { ...mockRatingDocument, _id: 'rating456' }];
      const mockExec = jest.fn().mockResolvedValue(mockRatings);
      model.find.mockReturnValue({ exec: mockExec } as any);

      const result = await repository.findByMovie('movie123');

      expect(model.find).toHaveBeenCalledWith({ movie: 'movie123' });
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockRatings);
    });

    it('should return empty array when no ratings found', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      model.find.mockReturnValue({ exec: mockExec } as any);

      const result = await repository.findByMovie('movie456');

      expect(result).toEqual([]);
    });
  });

  describe('findByUser', () => {
    it('should find all ratings by a user', async () => {
      const mockRatings = [mockRatingDocument, { ...mockRatingDocument, movie: 'movie456' }];
      const mockExec = jest.fn().mockResolvedValue(mockRatings);
      model.find.mockReturnValue({ exec: mockExec } as any);

      const result = await repository.findByUser('user123');

      expect(model.find).toHaveBeenCalledWith({ user: 'user123' });
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockRatings);
    });

    it('should return empty array when user has no ratings', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      model.find.mockReturnValue({ exec: mockExec } as any);

      const result = await repository.findByUser('user456');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update rating with comment', async () => {
      const mockExec = jest.fn().mockResolvedValue(mockRatingDocument);
      model.findOneAndUpdate.mockReturnValue({ exec: mockExec } as any);

      const result = await repository.update('user123', 'movie123', 9, 'Updated comment');

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { user: 'user123', movie: 'movie123' },
        { rating: 9, comment: 'Updated comment' },
        { new: true, upsert: true }
      );
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockRatingDocument);
    });

    it('should update rating without comment', async () => {
      const mockExec = jest.fn().mockResolvedValue(mockRatingDocument);
      model.findOneAndUpdate.mockReturnValue({ exec: mockExec } as any);

      await repository.update('user123', 'movie123', 7);

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { user: 'user123', movie: 'movie123' },
        { rating: 7 },
        { new: true, upsert: true }
      );
    });

    it('should create new rating if not exists (upsert)', async () => {
      const newRating = { ...mockRatingDocument, _id: 'newRating123' };
      const mockExec = jest.fn().mockResolvedValue(newRating);
      model.findOneAndUpdate.mockReturnValue({ exec: mockExec } as any);

      const result = await repository.update('user456', 'movie123', 6, 'New rating');

      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { user: 'user456', movie: 'movie123' },
        { rating: 6, comment: 'New rating' },
        { new: true, upsert: true }
      );
      expect(result).toEqual(newRating);
    });
  });

  describe('delete', () => {
    it('should delete rating and return true when successful', async () => {
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 1 });
      model.deleteOne.mockReturnValue({ exec: mockExec } as any);

      const result = await repository.delete('user123', 'movie123');

      expect(model.deleteOne).toHaveBeenCalledWith({
        user: 'user123',
        movie: 'movie123',
      });
      expect(mockExec).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when no rating was deleted', async () => {
      const mockExec = jest.fn().mockResolvedValue({ deletedCount: 0 });
      model.deleteOne.mockReturnValue({ exec: mockExec } as any);

      const result = await repository.delete('user123', 'movie456');

      expect(result).toBe(false);
    });
  });

  describe('calculateAverageRating', () => {
    it('should calculate average rating and count', async () => {
      const aggregateResult = [{ average: 7.5, count: 4 }];
      const mockExec = jest.fn().mockResolvedValue(aggregateResult);
      model.aggregate.mockReturnValue({ exec: mockExec } as any);
      
      // Mock countDocuments for the count check
      const mockCountDocuments = jest.fn().mockResolvedValue(4);
      model.countDocuments = mockCountDocuments;

      const result = await repository.calculateAverageRating('movie123');

      expect(mockCountDocuments).toHaveBeenCalled();
      expect(model.aggregate).toHaveBeenCalled();
      const aggregateArgs = model.aggregate.mock.calls[0][0];
      expect(aggregateArgs[0].$match).toBeDefined();
      expect(mockExec).toHaveBeenCalled();
      
      expect(result).toEqual({ average: 7.5, count: 4 });
    });

    it('should return zero average when no ratings exist', async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      model.aggregate.mockReturnValue({ exec: mockExec } as any);
      
      const mockCountDocuments = jest.fn().mockResolvedValue(0);
      model.countDocuments = mockCountDocuments;

      const result = await repository.calculateAverageRating('movie456');

      expect(result).toEqual({ average: 0, count: 0 });
    });

    it('should handle null aggregate result', async () => {
      const aggregateResult = [{ average: null, count: 0 }];
      const mockExec = jest.fn().mockResolvedValue(aggregateResult);
      model.aggregate.mockReturnValue({ exec: mockExec } as any);
      
      // Mock countDocuments to return 0
      const mockCountDocuments = jest.fn().mockResolvedValue(0);
      model.countDocuments = mockCountDocuments;

      const result = await repository.calculateAverageRating('movie123');

      // With no documents, the result should have 0 count and 0 average
      expect(result).toEqual({ average: 0, count: 0 });
    });
  });
});
