import Redis, { RedisOptions } from 'ioredis';
import { ENV } from './env';

const parseRedisConfig = (): RedisOptions & { skipVersionCheck?: boolean } => {
  if (ENV.REDIS_URL) {
    try {
      const parsed = new URL(ENV.REDIS_URL);
      const isTls = ENV.REDIS_URL.startsWith('rediss://');
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || '6379', 10),
        username: parsed.username || undefined,
        password: parsed.password || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        skipVersionCheck: true,
        tls: isTls ? { rejectUnauthorized: false } : undefined,
      };
    } catch (e) {
      console.warn('⚠️ Could not parse REDIS_URL, falling back to standard config');
    }
  }

  return {
    host: ENV.REDIS_HOST,
    port: ENV.REDIS_PORT,
    password: ENV.REDIS_PASSWORD,
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
    skipVersionCheck: true,
  };
};

export const redisConfig = parseRedisConfig();

// Global Redis instance for caching, counters, and rate limiting
export const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});
