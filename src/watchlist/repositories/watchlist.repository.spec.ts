import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { WatchlistRepository } from './watchlist.repository';
import { Watchlist, WatchlistDocument } from '../entities/watchlist.entity';
import { Model, Types } from 'mongoose';

describe('WatchlistRepository', () => {
  let repository: WatchlistRepository;
  // Using any type to avoid TypeScript errors with Mongoose model mocking
  let model: any;

  // Mock user and movie IDs for testing
  const mockUserId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
  const mockMovieId = '507f1f77bcf86cd799439012'; // Valid ObjectId format
  
  // Create ObjectId instances for testing
  const mockUserObjectId = new Types.ObjectId(mockUserId);
  const mockMovieObjectId = new Types.ObjectId(mockMovieId);

  // Mock watchlist document
  const mockWatchlistItem = {
    _id: { toString: () => 'watchlist789' },
    user: { toString: () => mockUserId },
    movie: { toString: () => mockMovieId },
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
    populate: jest.fn(),
    exec: jest.fn(),
  } as unknown as WatchlistDocument;

  // Create a mock function that can also be used as a constructor
  const mockModelFn = jest.fn();
  
  // Add necessary model methods with proper typing
  const mockModel = mockModelFn as unknown as {
    (): any;
    findOne: jest.Mock;
    find: jest.Mock;
    deleteOne: jest.Mock;
    select: jest.Mock;
    sort: jest.Mock;
    populate: jest.Mock;
    exec: jest.Mock;
  };
  
  // Add the methods to the mock function
  mockModel.findOne = jest.fn();
  mockModel.find = jest.fn();
  mockModel.deleteOne = jest.fn();
  mockModel.select = jest.fn();
  mockModel.sort = jest.fn();
  mockModel.populate = jest.fn();
  mockModel.exec = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchlistRepository,
        {
          provide: getModelToken(Watchlist.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get<WatchlistRepository>(WatchlistRepository);
    model = module.get(getModelToken(Watchlist.name));
    
    // Clear all mock calls
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUserAndMovie', () => {
    it('should find a watchlist item by user and movie ids', async () => {
      // Chain method mocks for fluent API
      mockModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockWatchlistItem),
      });

      const result = await repository.findByUserAndMovie(mockUserId, mockMovieId);

      expect(mockModel.findOne).toHaveBeenCalledWith({ 
        user: mockUserObjectId, 
        movie: mockMovieObjectId 
      });
      expect(result).toEqual(mockWatchlistItem);
    });

    it('should return null if watchlist item not found', async () => {
      // Mock the chain of method calls
      mockModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      // Use another valid ObjectId for a non-existent movie
      const nonExistentMovieId = '507f1f77bcf86cd799439013';
      const nonExistentMovieObjectId = new Types.ObjectId(nonExistentMovieId);

      const result = await repository.findByUserAndMovie(mockUserId, nonExistentMovieId);

      expect(mockModel.findOne).toHaveBeenCalledWith({ 
        user: mockUserObjectId, 
        movie: nonExistentMovieObjectId 
      });
      expect(result).toBeNull();
    });

    it('should properly chain populate calls', async () => {
      const populateSpy = jest.fn().mockReturnThis();
      mockModel.findOne.mockReturnValue({
        populate: populateSpy,
        exec: jest.fn().mockResolvedValue(mockWatchlistItem),
      });

      await repository.findByUserAndMovie(mockUserId, mockMovieId);

      // Verify that both movie and user are populated
      expect(populateSpy).toHaveBeenCalledWith('movie');
      expect(populateSpy).toHaveBeenCalledWith('user');
    });
  });

  describe('findByUser', () => {
    it('should find all watchlist items for a user', async () => {
      const mockWatchlistItems = [
        mockWatchlistItem,
        { ...mockWatchlistItem, movie: { toString: () => 'movie789' } }
      ];

      // Chain method mocks for fluent API
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockWatchlistItems),
      });

      const result = await repository.findByUser(mockUserId);

      expect(mockModel.find).toHaveBeenCalledWith({ user: mockUserObjectId });
      expect(result).toEqual(mockWatchlistItems);
      expect(result.length).toBe(2);
    });

    it('should return empty array if no watchlist items found', async () => {
      // Mock the chain of method calls
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      // Use another valid ObjectId for a non-existent user
      const nonExistentUserId = '507f1f77bcf86cd799439014';
      const nonExistentUserObjectId = new Types.ObjectId(nonExistentUserId);
      
      const result = await repository.findByUser(nonExistentUserId);

      expect(mockModel.find).toHaveBeenCalledWith({ user: nonExistentUserObjectId });
      expect(result).toEqual([]);
    });

    it('should sort by createdAt in descending order', async () => {
      const sortSpy = jest.fn().mockReturnThis();
      mockModel.find.mockReturnValue({
        sort: sortSpy,
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      await repository.findByUser(mockUserId);

      // Verify sort is called with correct parameters
      expect(sortSpy).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should properly chain populate calls', async () => {
      const populateSpy = jest.fn().mockReturnThis();
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        populate: populateSpy,
        exec: jest.fn().mockResolvedValue([]),
      });

      await repository.findByUser(mockUserId);

      // Verify that both movie and user are populated
      expect(populateSpy).toHaveBeenCalledWith('movie');
      expect(populateSpy).toHaveBeenCalledWith('user');
    });
  });

  describe('create', () => {
    it('should create a new watchlist item', async () => {
      // Setup the new instance and save mock
      const saveSpy = jest.fn().mockResolvedValue(mockWatchlistItem);
      mockModelFn.mockImplementation(() => ({
        save: saveSpy,
      }));

      const result = await repository.create(mockUserId, mockMovieId);
      
      // Expect the constructor was called with right params
      expect(mockModelFn).toHaveBeenCalledWith({
        user: mockUserObjectId,
        movie: mockMovieObjectId
      });
      expect(saveSpy).toHaveBeenCalled();
      expect(result).toEqual(mockWatchlistItem);
    });

    it('should throw an error if save fails', async () => {
      // Setup save to throw an error
      mockModelFn.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('Database error')),
      }));

      await expect(repository.create(mockUserId, mockMovieId))
        .rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete a watchlist item and return true if deleted', async () => {
      mockModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await repository.delete(mockUserId, mockMovieId);

      expect(mockModel.deleteOne).toHaveBeenCalledWith({ 
        user: mockUserObjectId, 
        movie: mockMovieObjectId 
      });
      expect(result).toBe(true);
    });

    it('should return false if no item was deleted', async () => {
      mockModel.deleteOne.mockResolvedValue({ deletedCount: 0 });
      
      // Use another valid ObjectId for a non-existent movie
      const nonExistentMovieId = '507f1f77bcf86cd799439015';
      const nonExistentMovieObjectId = new Types.ObjectId(nonExistentMovieId);

      const result = await repository.delete(mockUserId, nonExistentMovieId);

      expect(mockModel.deleteOne).toHaveBeenCalledWith({ 
        user: mockUserObjectId, 
        movie: nonExistentMovieObjectId 
      });
      expect(result).toBe(false);
    });
  });

  describe('findAllMovieIdsByUser', () => {
    it('should return an array of movie ids for a user', async () => {
      mockModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          { movie: { toString: () => mockMovieId } },
          { movie: { toString: () => '507f1f77bcf86cd799439016' } },
        ]),
      });

      const result = await repository.findAllMovieIdsByUser(mockUserId);

      expect(mockModel.find).toHaveBeenCalledWith({ user: mockUserObjectId });
      expect(result).toEqual([mockMovieId, '507f1f77bcf86cd799439016']);
      expect(result.length).toBe(2);
    });

    it('should return empty array if user has no watchlist items', async () => {
      mockModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      
      // Use another valid ObjectId for a non-existent user
      const nonExistentUserId = '507f1f77bcf86cd799439017';
      const nonExistentUserObjectId = new Types.ObjectId(nonExistentUserId);

      const result = await repository.findAllMovieIdsByUser(nonExistentUserId);

      expect(mockModel.find).toHaveBeenCalledWith({ user: nonExistentUserObjectId });
      expect(result).toEqual([]);
    });

    it('should select only the movie field', async () => {
      const selectSpy = jest.fn().mockReturnThis();
      mockModel.find.mockReturnValue({
        select: selectSpy,
        exec: jest.fn().mockResolvedValue([]),
      });

      await repository.findAllMovieIdsByUser(mockUserId);

      expect(selectSpy).toHaveBeenCalledWith('movie');
    });
  });
});
