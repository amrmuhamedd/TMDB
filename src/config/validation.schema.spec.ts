import { validationSchema } from './validation.schema';

describe('Config Validation Schema', () => {
  it('should validate correct config values', () => {
    const validConfig = {
      DATABASE_URL: 'mongodb://localhost:27017/test',
      PORT: 3000,
      JWT_SECRET: 'test-jwt-secret',
      RT_SECRET: 'test-refresh-token-secret',
      TMDB_API_KEY: 'test-api-key',
    };

    const result = validationSchema.validate(validConfig);
    expect(result.error).toBeUndefined();
    expect(result.value).toEqual(validConfig);
  });

  it('should use default PORT if not provided', () => {
    const configWithoutPort = {
      DATABASE_URL: 'mongodb://localhost:27017/test',
      JWT_SECRET: 'test-jwt-secret',
      RT_SECRET: 'test-refresh-token-secret',
      TMDB_API_KEY: 'test-api-key',
    };

    const result = validationSchema.validate(configWithoutPort);
    expect(result.error).toBeUndefined();
    expect(result.value.PORT).toBe(3000);
  });

  it('should fail if DATABASE_URL is missing', () => {
    const invalidConfig = {
      PORT: 3000,
      JWT_SECRET: 'test-jwt-secret',
      RT_SECRET: 'test-refresh-token-secret',
      TMDB_API_KEY: 'test-api-key',
    };

    const result = validationSchema.validate(invalidConfig);
    expect(result.error).toBeDefined();
    expect(result.error?.details[0].message).toContain('"DATABASE_URL" is required');
  });

  it('should fail if DATABASE_URL is not a valid URI', () => {
    const invalidConfig = {
      DATABASE_URL: 'invalid-uri',
      PORT: 3000,
      JWT_SECRET: 'test-jwt-secret',
      RT_SECRET: 'test-refresh-token-secret',
      TMDB_API_KEY: 'test-api-key',
    };

    const result = validationSchema.validate(invalidConfig);
    expect(result.error).toBeDefined();
    expect(result.error?.details[0].message).toContain('"DATABASE_URL" must be a valid uri');
  });

  it('should fail if JWT_SECRET is missing', () => {
    const invalidConfig = {
      DATABASE_URL: 'mongodb://localhost:27017/test',
      PORT: 3000,
      RT_SECRET: 'test-refresh-token-secret',
      TMDB_API_KEY: 'test-api-key',
    };

    const result = validationSchema.validate(invalidConfig);
    expect(result.error).toBeDefined();
    expect(result.error?.details[0].message).toContain('"JWT_SECRET" is required');
  });

  it('should fail if RT_SECRET is missing', () => {
    const invalidConfig = {
      DATABASE_URL: 'mongodb://localhost:27017/test',
      PORT: 3000,
      JWT_SECRET: 'test-jwt-secret',
      TMDB_API_KEY: 'test-api-key',
    };

    const result = validationSchema.validate(invalidConfig);
    expect(result.error).toBeDefined();
    expect(result.error?.details[0].message).toContain('"RT_SECRET" is required');
  });

  it('should fail if TMDB_API_KEY is missing', () => {
    const invalidConfig = {
      DATABASE_URL: 'mongodb://localhost:27017/test',
      PORT: 3000,
      JWT_SECRET: 'test-jwt-secret',
      RT_SECRET: 'test-refresh-token-secret',
    };

    const result = validationSchema.validate(invalidConfig);
    expect(result.error).toBeDefined();
    expect(result.error?.details[0].message).toContain('"TMDB_API_KEY" is required');
  });

  it('should fail if PORT is not a number', () => {
    const invalidConfig = {
      DATABASE_URL: 'mongodb://localhost:27017/test',
      PORT: 'not-a-number',
      JWT_SECRET: 'test-jwt-secret',
      RT_SECRET: 'test-refresh-token-secret',
      TMDB_API_KEY: 'test-api-key',
    };

    const result = validationSchema.validate(invalidConfig);
    expect(result.error).toBeDefined();
    expect(result.error?.details[0].message).toContain('"PORT" must be a number');
  });
});
