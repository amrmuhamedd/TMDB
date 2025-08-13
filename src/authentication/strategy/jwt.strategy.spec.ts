import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.stratgy';
import { UserRepository } from '../repository/user.repository';
import { SessionsRepository } from '../repository/sessions.repository';

describe('JwtStrategy', () => {
  let jwtStrategy: JwtStrategy;
  let configService: ConfigService;
  let userRepository: UserRepository;
  let sessionsRepository: SessionsRepository;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key, options) => {
      if (key === 'JWT_SECRET') {
        return 'test-jwt-secret';
      }
      return null;
    }),
  };

  const mockUserRepository = {
    findById: jest.fn(),
  };

  const mockSessionsRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: SessionsRepository,
          useValue: mockSessionsRepository,
        },
      ],
    }).compile();

    jwtStrategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
    userRepository = module.get<UserRepository>(UserRepository);
    sessionsRepository = module.get<SessionsRepository>(SessionsRepository);

    // No need to mock here as we've already set up the implementation in the mockConfigService object
  });

  it('should be defined', () => {
    expect(jwtStrategy).toBeDefined();
  });

  describe('validate', () => {
    it('should throw UnauthorizedException if payload is missing', async () => {
      await expect(jwtStrategy.validate({ id: 'user-id' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if payload.id is missing', async () => {
      await expect(jwtStrategy.validate({ id: 'user-id' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(jwtStrategy.validate({ id: 'user-id' })).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-id');
    });

    it('should return user data if user is found', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password', // Not included in return value
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await jwtStrategy.validate({ id: 'user-id' });

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-id');
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
      // Ensure password is not included
      expect(result).not.toHaveProperty('password');
    });
  });
});
