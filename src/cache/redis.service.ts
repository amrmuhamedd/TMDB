import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

type HashValue = Record<string, any>;

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  /**
   * Set a value in Redis cache
   * @param key Cache key
   * @param value Value to store
   * @param ttl Time to live in seconds (optional)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redisClient.set(key, JSON.stringify(value), 'EX', ttl);
    } else {
      await this.redisClient.set(key, JSON.stringify(value));
    }
  }

  /**
   * Get a value from Redis cache
   * @param key Cache key
   * @returns Cached value or undefined if not found
   */
  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.redisClient.get(key);
    return value ? (JSON.parse(value) as T) : undefined;
  }

  /**
   * Delete a value from Redis cache
   * @param key Cache key
   */
  async delete(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  /**
   * Check if a key exists in Redis cache
   * @param key Cache key
   * @returns Boolean indicating if key exists
   */
  async has(key: string): Promise<boolean> {
    return (await this.redisClient.exists(key)) === 1;
  }

  /**
   * Set a hash field in Redis
   * @param key Hash key
   * @param field Field to set
   * @param value Value to store
   */
  async hset(key: string, field: string, value: any): Promise<void> {
    await this.redisClient.hset(key, field, JSON.stringify(value));
  }

  /**
   * Set multiple hash fields in Redis
   * @param key Hash key
   * @param values Object with field-value pairs
   */
  async hmset(key: string, values: HashValue): Promise<void> {
    const serializedValues: Record<string, string> = {};

    // Serialize each value to JSON string
    for (const field in values) {
      serializedValues[field] = JSON.stringify(values[field]);
    }

    await this.redisClient.hmset(key, serializedValues);
  }

  /**
   * Get all fields and values from a hash
   * @param key Hash key
   * @returns Object with all hash field-value pairs
   */
  async hgetall<T extends HashValue>(key: string): Promise<T | null> {
    const hash = await this.redisClient.hgetall(key);

    if (Object.keys(hash).length === 0) {
      return null;
    }

    // Parse JSON string values back to their original form
    const result: Record<string, any> = {};
    for (const field in hash) {
      try {
        result[field] = JSON.parse(hash[field]);
      } catch (e) {
        result[field] = hash[field]; // Use as-is if not valid JSON
      }
    }

    return result as T;
  }

  /**
   * Get a specific field from a hash
   * @param key Hash key
   * @param field Field to get
   * @returns Field value or null if not found
   */
  async hget<T>(key: string, field: string): Promise<T | null> {
    const value = await this.redisClient.hget(key, field);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (e) {
      return value as unknown as T; // Return as-is if not valid JSON
    }
  }

  /**
   * Delete a field from a hash
   * @param key Hash key
   * @param field Field to delete
   * @returns Number of fields removed
   */
  async hdel(key: string, field: string): Promise<number> {
    return await this.redisClient.hdel(key, field);
  }
}
