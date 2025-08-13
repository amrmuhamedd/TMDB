import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationService } from './registration.service';
import { UserRepository } from '../repository/user.repository';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { SessionsRepository } from '../repository/sessions.repository';
import { RegisterDto } from '../dto/register.dto';
import { User } from '../entities/users.entity';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Session } from '../entities/sessions.entity';

describe('RegistrationService', () => {
  let service: RegistrationService;
  let userRepository: jest.Mocked<UserRepository>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;
  let sessionRepository: jest.Mocked<SessionsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: PasswordService,
          useValue: {
            hash: jest.fn().mockResolvedValue('hashed-password'),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
            generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
          },
        },
        {
          provide: SessionsRepository,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RegistrationService>(RegistrationService);
    userRepository = module.get(UserRepository);
    passwordService = module.get(PasswordService);
    tokenService = module.get(TokenService);
    sessionRepository = module.get(SessionsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const mockRegisterDto: RegisterDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'P@ssword123',
    };

    it('should register a new user and return JWT tokens', async () => {
      const mockUser = {
        id: '12345',
        name: mockRegisterDto.name,
        email: mockRegisterDto.email,
        password: 'hashed-password',
      } as User;
      
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);
      sessionRepository.create.mockResolvedValue({} as Session);

      const result = await service.register(mockRegisterDto);

      expect(userRepository.findByEmail).toHaveBeenCalledWith(mockRegisterDto.email);
      expect(passwordService.hash).toHaveBeenCalledWith(mockRegisterDto.password);
      expect(userRepository.create).toHaveBeenCalledWith({
        name: mockRegisterDto.name,
        email: mockRegisterDto.email,
        password: 'hashed-password',
      });
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith(mockUser.id);
      expect(tokenService.generateRefreshToken).toHaveBeenCalledWith(mockUser.id);
      expect(sessionRepository.create).toHaveBeenCalledWith({
        user: mockUser,
        token: 'mock-refresh-token',
      });

      expect(result).toEqual({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
      });
    });

    it('should throw BadRequestException if user already exists', async () => {
      const existingUser = {
        id: 'existing-id',
        name: 'Existing User',
        email: mockRegisterDto.email,
      } as User;
      
      userRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException on database error', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockRejectedValue(new Error('DB Error'));

      await expect(service.register(mockRegisterDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
