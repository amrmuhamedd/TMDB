import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SessionsRepository } from './sessions.repository';
import { Session, SessionDocument } from '../entities/sessions.entity';
import { User } from '../entities/users.entity';

describe('SessionsRepository', () => {
  let repository: SessionsRepository;
  // Using any type to avoid TypeScript errors with Mongoose model mocking
  let model: any;

  // Mock session data
  const mockUserId = 'user123';
  const mockToken = 'token123';
  const mockSession = {
    _id: { toString: () => 'session123' },
    user: { toString: () => mockUserId },
    token: mockToken,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn(),
    exec: jest.fn(),
  } as unknown as SessionDocument;

  // Create a mock function that can also be used as a constructor
  const mockModelFn = jest.fn();
  
  // Add necessary model methods with proper typing
  const mockModel = mockModelFn as unknown as {
    (): any;
    findOne: jest.Mock;
    find: jest.Mock;
    deleteOne: jest.Mock;
    deleteMany: jest.Mock;
    exec: jest.Mock;
  };
  
  // Add the methods to the mock function
  mockModel.findOne = jest.fn();
  mockModel.find = jest.fn();
  mockModel.deleteOne = jest.fn();
  mockModel.deleteMany = jest.fn();
  mockModel.exec = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsRepository,
        {
          provide: getModelToken(Session.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get<SessionsRepository>(SessionsRepository);
    model = module.get(getModelToken(Session.name));
    
    // Clear all mock calls
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new session', async () => {
      const createSessionDto = {
        user: mockUserId as unknown as User,
        token: mockToken,
      };

      const mockCreatedSession = {
        ...mockSession,
        save: jest.fn().mockResolvedValue(mockSession),
      };

      // Reset mock for this test
      (model as jest.Mock).mockReturnValue(mockCreatedSession);

      const result = await repository.create(createSessionDto);

      expect(model).toHaveBeenCalledWith(createSessionDto);
      expect(mockCreatedSession.save).toHaveBeenCalled();
      expect(result).toEqual(mockSession);
    });

    it('should throw an error if save fails', async () => {
      const createSessionDto = {
        user: mockUserId as unknown as User,
        token: mockToken,
      };

      const mockError = new Error('Database error');
      const mockCreatedSession = {
        ...mockSession,
        save: jest.fn().mockRejectedValue(mockError),
      };

      // Reset mock for this test
      (model as jest.Mock).mockReturnValue(mockCreatedSession);

      await expect(repository.create(createSessionDto))
        .rejects.toThrow('Database error');
    });
  });

  describe('findByToken', () => {
    it('should find a session by token', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSession),
      });

      const result = await repository.findByToken(mockToken);

      expect(mockModel.findOne).toHaveBeenCalledWith({ token: mockToken });
      expect(result).toEqual(mockSession);
    });

    it('should return null if session not found by token', async () => {
      mockModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findByToken('nonexistent-token');

      expect(mockModel.findOne).toHaveBeenCalledWith({ token: 'nonexistent-token' });
      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all sessions for a user', async () => {
      const mockSessions = [
        mockSession,
        { ...mockSession, token: 'token456' },
      ];

      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockSessions),
      });

      const result = await repository.findByUserId(mockUserId);

      expect(mockModel.find).toHaveBeenCalledWith({ user: mockUserId });
      expect(result).toEqual(mockSessions);
      expect(result.length).toBe(2);
    });

    it('should return empty array if no sessions found for user', async () => {
      mockModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findByUserId('nonexistent-user');

      expect(mockModel.find).toHaveBeenCalledWith({ user: 'nonexistent-user' });
      expect(result).toEqual([]);
    });
  });

  describe('deleteByUserId', () => {
    it('should delete all sessions for a user', async () => {
      const mockDeleteResult = { deletedCount: 2 };

      mockModel.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDeleteResult),
      });

      const result = await repository.deleteByUserId(mockUserId);

      expect(mockModel.deleteMany).toHaveBeenCalledWith({ user: mockUserId });
      expect(result).toEqual(mockDeleteResult);
    });

    it('should handle case when no sessions are deleted', async () => {
      const mockDeleteResult = { deletedCount: 0 };

      mockModel.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDeleteResult),
      });

      const result = await repository.deleteByUserId('nonexistent-user');

      expect(mockModel.deleteMany).toHaveBeenCalledWith({ user: 'nonexistent-user' });
      expect(result).toEqual(mockDeleteResult);
    });
  });

  describe('deleteByToken', () => {
    it('should delete a session by token', async () => {
      const mockDeleteResult = { deletedCount: 1 };

      mockModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDeleteResult),
      });

      const result = await repository.deleteByToken(mockToken);

      expect(mockModel.deleteOne).toHaveBeenCalledWith({ token: mockToken });
      expect(result).toEqual(mockDeleteResult);
    });

    it('should handle case when no session is deleted', async () => {
      const mockDeleteResult = { deletedCount: 0 };

      mockModel.deleteOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDeleteResult),
      });

      const result = await repository.deleteByToken('nonexistent-token');

      expect(mockModel.deleteOne).toHaveBeenCalledWith({ token: 'nonexistent-token' });
      expect(result).toEqual(mockDeleteResult);
    });
  });

  describe('deleteExpiredSessions', () => {
    it('should delete expired sessions for a user', async () => {
      const mockDeleteResult = { deletedCount: 1 };
      const expirationTime = 3600000; // 1 hour in milliseconds
      
      // Spy on Date to control its behavior
      jest.spyOn(global, 'Date').mockImplementation(() => {
        return {
          getTime: jest.fn().mockReturnValue(1629400000000), // Mock current time
          setTime: jest.fn(),
        } as unknown as Date;
      });

      mockModel.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDeleteResult),
      });

      const result = await repository.deleteExpiredSessions(mockUserId, expirationTime);

      // Verify deleteMany was called with the right filter
      expect(mockModel.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ 
          user: mockUserId,
          updatedAt: expect.objectContaining({ $lt: expect.any(Object) })
        })
      );
      expect(result).toEqual(mockDeleteResult);
      
      // Restore Date
      jest.restoreAllMocks();
    });

    it('should use the correct expiration calculation', async () => {
      const expirationTime = 3600000; // 1 hour in milliseconds
      const mockCurrentTime = new Date(2023, 8, 15, 12, 0, 0); // Sep 15, 2023, 12:00:00
      const mockDeleteResult = { deletedCount: 2 };
      
      // Create a spy for Date
      jest.spyOn(global, 'Date').mockImplementation(() => {
        return {
          getTime: jest.fn().mockReturnValue(mockCurrentTime.getTime()),
          setTime: jest.fn(),
        } as unknown as Date;
      });
      
      mockModel.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockDeleteResult),
      });
      
      await repository.deleteExpiredSessions(mockUserId, expirationTime);
      
      // The query should use a date that is expirationTime milliseconds in the past
      const expectedDate = new Date(mockCurrentTime);
      expectedDate.setTime(expectedDate.getTime() - expirationTime);
      
      expect(mockModel.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUserId,
          updatedAt: { $lt: expect.any(Object) }
        })
      );
      
      // Restore Date
      jest.restoreAllMocks();
    });
  });
});
