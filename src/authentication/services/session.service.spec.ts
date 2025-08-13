import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { SessionsRepository } from '../repository/sessions.repository';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../entities/users.entity';
import { Session } from '../entities/sessions.entity';

describe('SessionService', () => {
  let service: SessionService;
  let sessionsRepository: jest.Mocked<SessionsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: SessionsRepository,
          useValue: {
            create: jest.fn(),
            findByToken: jest.fn(),
            deleteByToken: jest.fn(),
            deleteByUserId: jest.fn(),
            deleteExpiredSessions: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    sessionsRepository = module.get(SessionsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a new session for a user', async () => {
      const mockUser = { id: 'user-123' } as User;
      const refreshToken = 'refresh-token-123';
      
      await service.createSession(mockUser, refreshToken);
      
      expect(sessionsRepository.create).toHaveBeenCalledWith({
        user: mockUser,
        token: refreshToken,
      });
    });
  });

  describe('validateSession', () => {
    it('should return the session if token is valid', async () => {
      const mockSession = { 
        id: 'session-123', 
        token: 'valid-token',
        user: { id: 'user-123' } as User,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Session;
      sessionsRepository.findByToken.mockResolvedValue(mockSession);
      
      const result = await service.validateSession('valid-token');
      
      expect(sessionsRepository.findByToken).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual(mockSession);
    });

    it('should throw UnauthorizedException if session is not found', async () => {
      sessionsRepository.findByToken.mockResolvedValue(null);
      
      await expect(service.validateSession('invalid-token')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('deleteByToken', () => {
    it('should delete a session by its token', async () => {
      await service.deleteByToken('token-to-delete');
      
      expect(sessionsRepository.deleteByToken).toHaveBeenCalledWith('token-to-delete');
    });
  });

  describe('deleteByUserId', () => {
    it('should delete all sessions for a user', async () => {
      const userId = 'user-123';
      
      await service.deleteByUserId(userId);
      
      expect(sessionsRepository.deleteByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should clean up expired sessions for a user', async () => {
      const userId = 'user-123';
      
      await service.cleanupExpiredSessions(userId);
      
      expect(sessionsRepository.deleteExpiredSessions).toHaveBeenCalledWith(
        userId,
        expect.any(Number) // EXPIRATION_TIME
      );
    });
  });
});
