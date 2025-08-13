import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from './repository/user.repository';
import { User } from './entities/users.entity';
import {
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { SessionsRepository } from './repository/sessions.repository';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Session } from './entities/sessions.entity';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let userRepository: jest.Mocked<UserRepository>;
  let sessionRepository: jest.Mocked<SessionsRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;
  let sessionService: jest.Mocked<SessionService>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
        ConfigModule,
      ],
      providers: [
        AuthenticationService,
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: SessionsRepository,
          useValue: {
            create: jest.fn(),
            deleteExpiredSessions: jest.fn(),
            deleteByUserId: jest.fn(),
            findByToken: jest.fn(),
            deleteByToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mocked-jwt-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hash: jest.fn(),
            compare: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateAccessToken: jest.fn().mockReturnValue('mocked-jwt-token'),
            generateRefreshToken: jest.fn().mockReturnValue('mocked-refresh-token'),
            verifyToken: jest.fn(),
          },
        },
        {
          provide: SessionService,
          useValue: {
            createSession: jest.fn(),
            validateSession: jest.fn(),
            deleteByToken: jest.fn(),
            deleteByUserId: jest.fn(),
            cleanupExpiredSessions: jest.fn(),
          },
        },
      ],
      exports: [AuthenticationService],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    userRepository = module.get(UserRepository);
    sessionRepository = module.get(SessionsRepository);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
    passwordService = module.get(PasswordService);
    tokenService = module.get(TokenService);
    sessionService = module.get(SessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });


  describe('login', () => {
    const mockUser: User = {
      _id: '12345',
      name: 'John Doe',
      email: 'john@example.com',
      password: '$2b$12$hashedpassword',
    } as User;

    it('should login user and return JWT token', async () => {
      // Mock repositories and services for login
      userRepository.findByEmail.mockResolvedValue(mockUser);
      passwordService.compare.mockResolvedValue(true);
      
      // Mock token service methods
      tokenService.generateAccessToken.mockReturnValue('access-token');
      tokenService.generateRefreshToken.mockReturnValue('refresh-token');
      
      // Mock session service
      sessionService.cleanupExpiredSessions.mockResolvedValue(undefined);
      sessionService.createSession.mockResolvedValue(undefined);
      
      const result = await service.login({
        email: mockUser.email,
        password: 'P@ssword123',
      });

      expect(userRepository.findByEmail).toHaveBeenCalledWith(mockUser.email);
      expect(passwordService.compare).toHaveBeenCalledWith('P@ssword123', mockUser.password);
      expect(sessionService.cleanupExpiredSessions).toHaveBeenCalledWith(mockUser.id);
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith(mockUser.id);
      expect(tokenService.generateRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(sessionService.createSession).toHaveBeenCalled();
      
      expect(result).toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      jest.spyOn(service, 'validateUser').mockResolvedValue(null);

      await expect(
        service.login({ email: mockUser.email, password: 'P@ssword123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(
        service.login({ email: mockUser.email, password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getUserInfo', () => {
    it('should return user info for a valid user ID', async () => {
      const mockUser = {
        id: '12345',
        name: 'John Doe',
        email: 'john@example.com',
      } as User;

      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getUserInfo('12345');
      
      expect(userRepository.findById).toHaveBeenCalledWith('12345');
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException if user is not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.getUserInfo('non-existent-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('logout', () => {
    it('should logout user and delete session', async () => {
      const mockSession = {
        id: 'session-id',
        user: { id: '12345' } as User,
        token: 'refresh-token',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Session;

      sessionService.validateSession.mockResolvedValue(mockSession);
      sessionService.deleteByToken.mockResolvedValue(undefined);

      const result = await service.logout('refresh-token');

      expect(sessionService.validateSession).toHaveBeenCalledWith('refresh-token');
      expect(sessionService.deleteByToken).toHaveBeenCalledWith('refresh-token');
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      // Mock sessionService.validateSession to throw UnauthorizedException
      sessionService.validateSession.mockRejectedValue(new UnauthorizedException('Session not found'));

      await expect(service.logout('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(sessionService.deleteByToken).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    const mockUser = {
      id: '12345',
      name: 'John Doe',
      email: 'john@example.com',
    } as User;

    const mockSession = {
      id: 'session-id',
      user: mockUser,
      token: 'valid-refresh-token',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Session;

    const mockDecodedToken = { id: '12345' };

    beforeEach(() => {
      jest.clearAllMocks();
      sessionRepository.findByToken.mockResolvedValue(mockSession);
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockDecodedToken);
      userRepository.findById.mockResolvedValue(mockUser);
      sessionRepository.deleteByUserId.mockResolvedValue({ acknowledged: true, deletedCount: 1 });
      sessionRepository.create.mockResolvedValue({
        ...mockSession,
        token: 'new-refresh-token',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Session);
    });

    it('should refresh tokens successfully', async () => {
      // Create fresh spy implementations for this test
      sessionRepository.findByToken.mockResolvedValue(mockSession);
      tokenService.verifyToken.mockReturnValue(mockDecodedToken);
      userRepository.findById.mockResolvedValue(mockUser);
      
      // Execute the method
      const result = await service.refreshToken('valid-refresh-token');

      // Verify the expected method calls
      expect(sessionService.validateSession).toHaveBeenCalledWith('valid-refresh-token');
      expect(tokenService.verifyToken).toHaveBeenCalled();
      expect(userRepository.findById).toHaveBeenCalledWith('12345');
      expect(sessionService.deleteByUserId).toHaveBeenCalledWith('12345');
      expect(sessionService.createSession).toHaveBeenCalled();

      // Verify the result
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('should throw BadRequestException when refresh token is missing', async () => {
      await expect(service.refreshToken('' as string)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnauthorizedException when session is not found', async () => {
      // Mock sessionService.validateSession to throw UnauthorizedException
      sessionService.validateSession.mockRejectedValue(new UnauthorizedException('Session not found'));

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      tokenService.verifyToken.mockImplementationOnce(() => {
        throw new InternalServerErrorException('Token expired');
      });

      await expect(service.refreshToken('expired-token')).rejects.toThrow(
        InternalServerErrorException
      );
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      tokenService.verifyToken.mockImplementationOnce(() => {
        throw new UnauthorizedException('Invalid token');
      });

      await expect(service.refreshToken('malformed-token')).rejects.toThrow(
        'An unexpected error occurred'
      );
    });

    it('should throw InternalServerErrorException for other token verification errors', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementationOnce(() => {
        throw new Error('Unknown error');
      });

      await expect(service.refreshToken('problematic-token')).rejects.toThrow(
        'An unexpected error occurred'
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      // Ensure token verification succeeds but user lookup fails
      jest.spyOn(jwtService, 'verify').mockReturnValueOnce(mockDecodedToken);
      userRepository.findById.mockResolvedValueOnce(null);

      try {
        await service.refreshToken('valid-token-unknown-user');
        fail('Expected error was not thrown');
      } catch (error) {
        expect(error.message).toBe('An unexpected error occurred');
      }
    });
  });
});
