import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hash', () => {
    it('should hash a password correctly', async () => {
      const plainPassword = 'secure-password';
      const hashedPassword = 'hashed-password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await service.hash(plainPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 12);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('compare', () => {
    it('should return true when passwords match', async () => {
      const plainPassword = 'secure-password';
      const hashedPassword = 'hashed-password';
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.compare(plainPassword, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false when passwords do not match', async () => {
      const plainPassword = 'wrong-password';
      const hashedPassword = 'hashed-password';
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.compare(plainPassword, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(false);
    });
  });
});
