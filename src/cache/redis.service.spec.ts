import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';
import Redis from 'ioredis';

// Mock Redis implementation
const mockRedisClient = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  hset: jest.fn(),
  hmset: jest.fn(),
  hgetall: jest.fn(),
  hget: jest.fn(),
  hdel: jest.fn(),
};

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedisClient,
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set', () => {
    it('should set a value without TTL', async () => {
      await service.set('test-key', { data: 'value' });

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ data: 'value' })
      );
    });

    it('should set a value with TTL', async () => {
      const ttl = 3600; // 1 hour
      await service.set('test-key', { data: 'value' }, ttl);

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ data: 'value' }),
        'EX',
        ttl
      );
    });
  });

  describe('get', () => {
    it('should get a value that exists', async () => {
      const mockData = { data: 'test value' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(mockData));

      const result = await service.get('test-key');

      expect(mockRedisClient.get).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(mockData);
    });

    it('should return undefined when key does not exist', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await service.get('non-existent-key');

      expect(mockRedisClient.get).toHaveBeenCalledWith('non-existent-key');
      expect(result).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete a key', async () => {
      await service.delete('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('has', () => {
    it('should return true when key exists', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const result = await service.has('test-key');

      expect(mockRedisClient.exists).toHaveBeenCalledWith('test-key');
      expect(result).toBe(true);
    });

    it('should return false when key does not exist', async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const result = await service.has('non-existent-key');

      expect(mockRedisClient.exists).toHaveBeenCalledWith('non-existent-key');
      expect(result).toBe(false);
    });
  });

  describe('hset', () => {
    it('should set a hash field value', async () => {
      const value = { name: 'test' };
      await service.hset('hash-key', 'field1', value);

      expect(mockRedisClient.hset).toHaveBeenCalledWith(
        'hash-key',
        'field1',
        JSON.stringify(value)
      );
    });
  });

  describe('hmset', () => {
    it('should set multiple hash field values', async () => {
      const values = {
        field1: { name: 'test1' },
        field2: { name: 'test2' },
      };

      const serializedValues = {
        field1: JSON.stringify(values.field1),
        field2: JSON.stringify(values.field2),
      };

      await service.hmset('hash-key', values);

      expect(mockRedisClient.hmset).toHaveBeenCalledWith(
        'hash-key',
        serializedValues
      );
    });
  });

  describe('hgetall', () => {
    it('should get all hash fields', async () => {
      const mockHashData = {
        field1: JSON.stringify({ name: 'test1' }),
        field2: JSON.stringify({ name: 'test2' }),
      };

      const expectedResult = {
        field1: { name: 'test1' },
        field2: { name: 'test2' },
      };

      mockRedisClient.hgetall.mockResolvedValue(mockHashData);

      const result = await service.hgetall('hash-key');

      expect(mockRedisClient.hgetall).toHaveBeenCalledWith('hash-key');
      expect(result).toEqual(expectedResult);
    });

    it('should return null when hash does not exist', async () => {
      mockRedisClient.hgetall.mockResolvedValue({});

      const result = await service.hgetall('non-existent-hash');

      expect(mockRedisClient.hgetall).toHaveBeenCalledWith('non-existent-hash');
      expect(result).toBeNull();
    });

    it('should handle non-JSON values', async () => {
      const mockHashData = {
        field1: JSON.stringify({ name: 'test1' }),
        field2: 'not-json-data',
      };

      const expectedResult = {
        field1: { name: 'test1' },
        field2: 'not-json-data',
      };

      mockRedisClient.hgetall.mockResolvedValue(mockHashData);

      const result = await service.hgetall('hash-key');

      expect(result).toEqual(expectedResult);
    });
  });

  describe('hget', () => {
    it('should get a specific hash field', async () => {
      const mockFieldValue = JSON.stringify({ name: 'test1' });
      mockRedisClient.hget.mockResolvedValue(mockFieldValue);

      const result = await service.hget('hash-key', 'field1');

      expect(mockRedisClient.hget).toHaveBeenCalledWith('hash-key', 'field1');
      expect(result).toEqual({ name: 'test1' });
    });

    it('should return null when field does not exist', async () => {
      mockRedisClient.hget.mockResolvedValue(null);

      const result = await service.hget('hash-key', 'non-existent-field');

      expect(mockRedisClient.hget).toHaveBeenCalledWith('hash-key', 'non-existent-field');
      expect(result).toBeNull();
    });

    it('should handle non-JSON values', async () => {
      mockRedisClient.hget.mockResolvedValue('not-json-data');

      const result = await service.hget('hash-key', 'field2');

      expect(mockRedisClient.hget).toHaveBeenCalledWith('hash-key', 'field2');
      expect(result).toBe('not-json-data');
    });
  });

  describe('hdel', () => {
    it('should delete a hash field', async () => {
      mockRedisClient.hdel.mockResolvedValue(1);

      const result = await service.hdel('hash-key', 'field1');

      expect(mockRedisClient.hdel).toHaveBeenCalledWith('hash-key', 'field1');
      expect(result).toBe(1);
    });

    it('should return 0 when field does not exist', async () => {
      mockRedisClient.hdel.mockResolvedValue(0);

      const result = await service.hdel('hash-key', 'non-existent-field');

      expect(mockRedisClient.hdel).toHaveBeenCalledWith('hash-key', 'non-existent-field');
      expect(result).toBe(0);
    });
  });
});
