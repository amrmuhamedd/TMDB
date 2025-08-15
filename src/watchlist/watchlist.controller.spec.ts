import { Test, TestingModule } from '@nestjs/testing';
import { WatchlistController } from './watchlist.controller';
import { WatchlistService } from './watchlist.service';

describe('WatchlistController', () => {
  let controller: WatchlistController;
  let watchlistService;

  const userId = 'user-123';
  const movieId = 'movie-123';

  const mockWatchlistItem = {
    id: 'watchlist-item-123',
    userId,
    movieId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockWatchlistService = {
      addToWatchlist: jest.fn(),
      removeFromWatchlist: jest.fn(),
      getUserWatchlist: jest.fn(),
      isInWatchlist: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WatchlistController],
      providers: [
        {
          provide: WatchlistService,
          useValue: mockWatchlistService,
        },
      ],
    }).compile();

    controller = module.get<WatchlistController>(WatchlistController);
    watchlistService = mockWatchlistService;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addToWatchlist', () => {
    it('should add movie to watchlist', async () => {
      watchlistService.addToWatchlist.mockResolvedValue(mockWatchlistItem);
      
      // Updated to use id instead of userId in req.user to match controller implementation
      const result = await controller.addToWatchlist(
        { user: { id: userId } }, 
        { movieId }
      );
      
      expect(result).toEqual(mockWatchlistItem);
      expect(watchlistService.addToWatchlist).toHaveBeenCalledWith(userId, movieId);
    });
  });

  describe('removeFromWatchlist', () => {
    it('should remove movie from watchlist', async () => {
      watchlistService.removeFromWatchlist.mockResolvedValue(true);
      
      const result = await controller.removeFromWatchlist(
        { user: { id: userId } }, 
        { movieId }
      );
      
      expect(result).toEqual({ success: true });
      expect(watchlistService.removeFromWatchlist).toHaveBeenCalledWith(userId, movieId);
    });
  });

  describe('getUserWatchlist', () => {
    it('should return user watchlist', async () => {
      const watchlist = [mockWatchlistItem];
      watchlistService.getUserWatchlist.mockResolvedValue(watchlist);
      
      // Updated to use id instead of userId in req.user to match controller implementation
      const result = await controller.getUserWatchlist({ user: { id: userId } }, {});
      
      expect(result).toEqual(watchlist);
      expect(watchlistService.getUserWatchlist).toHaveBeenCalledWith(userId, {});
    });
  });

  describe('isInWatchlist', () => {
    it('should check if movie is in watchlist', async () => {
      watchlistService.isInWatchlist.mockResolvedValue(true);
      
      // Updated to use id instead of userId in req.user to match controller implementation
      const result = await controller.isInWatchlist(
        { user: { id: userId } }, 
        movieId
      );
      
      expect(result).toEqual({ inWatchlist: true });
      expect(watchlistService.isInWatchlist).toHaveBeenCalledWith(userId, movieId);
    });
  });
});
