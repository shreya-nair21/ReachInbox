import Redis, { RedisOptions } from 'ioredis';
import { ENV } from './env';

export const redisConfig: RedisOptions & { skipVersionCheck?: boolean } = {
  host: ENV.REDIS_HOST,
  port: ENV.REDIS_PORT,
  password: ENV.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  skipVersionCheck: true,
};

// Global Redis instance for caching, counters, and rate limiting
export const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message);
});
