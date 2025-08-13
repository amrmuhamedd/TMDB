import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn().mockReturnValue({ id: 'user-123' }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'JWT_SECRET') return 'test-access-secret';
              if (key === 'RT_SECRET') return 'test-refresh-secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAccessToken', () => {
    it('should generate an access token with correct parameters', () => {
      const userId = 'user-123';
      
      const result = service.generateAccessToken(userId);
      
      expect(jwtService.sign).toHaveBeenCalledWith(
        { id: userId },
        { 
          secret: 'test-access-secret',
          expiresIn: '1h'
        }
      );
      expect(result).toBe('mock-token');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token with correct parameters', () => {
      const userId = 'user-123';
      
      const result = service.generateRefreshToken(userId);
      
      expect(jwtService.sign).toHaveBeenCalledWith(
        { id: userId },
        { 
          secret: 'test-refresh-secret',
          expiresIn: '7d'
        }
      );
      expect(result).toBe('mock-token');
    });
  });

  describe('verifyToken', () => {
    it('should verify an access token correctly', () => {
      const token = 'valid-access-token';
      
      const result = service.verifyToken(token);
      
      expect(jwtService.verify).toHaveBeenCalledWith(token, { 
        secret: 'test-access-secret' 
      });
      expect(result).toEqual({ id: 'user-123' });
    });

    it('should verify a refresh token correctly', () => {
      const token = 'valid-refresh-token';
      
      const result = service.verifyToken(token, true);
      
      expect(jwtService.verify).toHaveBeenCalledWith(token, { 
        secret: 'test-refresh-secret' 
      });
      expect(result).toEqual({ id: 'user-123' });
    });

    it('should propagate verification errors', () => {
      const token = 'invalid-token';
      const error = new Error('Token verification failed');
      
      jwtService.verify.mockImplementationOnce(() => {
        throw error;
      });
      
      expect(() => service.verifyToken(token)).toThrow(error);
    });
  });
});
