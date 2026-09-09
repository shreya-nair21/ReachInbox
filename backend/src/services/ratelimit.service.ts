import { redisClient } from '../config/redis';
import { ENV } from '../config/env';

export interface RateLimitCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  nextWindowDelayMs: number;
  windowKey: string;
  shouldNotifySlack: boolean;
}

export class RateLimitService {
  /**
   * Generates a date-hour window string in UTC, e.g., "2026-09-09-13"
   */
  public getHourWindow(date: Date = new Date()): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    const h = String(date.getUTCHours()).padStart(2, '0');
    return `${y}-${m}-${d}-${h}`;
  }

  /**
   * Calculates milliseconds until the beginning of the next hour window,
   * adding a small random jitter (0-3000ms) to avoid thundering herd / stampedes.
   */
  public getNextWindowDelayMs(): number {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setUTCHours(nextHour.getUTCHours() + 1, 0, 0, 0);
    const msUntilNextHour = nextHour.getTime() - now.getTime();
    const jitter = Math.floor(Math.random() * 3000);
    return msUntilNextHour + jitter;
  }

  /**
   * Atomically checks and increments the hourly sending counter for a sender.
   * Safe across multiple worker processes and server instances.
   */
  public async checkAndIncrement(
    senderEmail: string,
    customLimit?: number
  ): Promise<RateLimitCheckResult> {
    const limit = customLimit && customLimit > 0 ? customLimit : ENV.MAX_EMAILS_PER_HOUR_PER_SENDER;
    const window = this.getHourWindow();
    const key = `rate_limit:${senderEmail.toLowerCase()}:${window}`;

    // Atomic Lua script to increment counter and set 2-hour expiration if new
    const luaScript = `
      local current = redis.call('INCR', KEYS[1])
      if current == 1 then
        redis.call('EXPIRE', KEYS[1], 7200)
      end
      return current
    `;

    const currentCount = (await redisClient.eval(luaScript, 1, key)) as number;

    if (currentCount <= limit) {
      return {
        allowed: true,
        currentCount,
        limit,
        nextWindowDelayMs: 0,
        windowKey: window,
        shouldNotifySlack: false,
      };
    }

    // Rate limit exceeded: roll back the speculative increment so counter doesn't artificially inflate
    await redisClient.decr(key);

    // Determine if Slack alert has already been fired for this sender in this hour window
    const alertKey = `rate_limit_alert_sent:${senderEmail.toLowerCase()}:${window}`;
    const alreadyAlerted = await redisClient.set(alertKey, '1', 'EX', 7200, 'NX');
    const shouldNotifySlack = alreadyAlerted === 'OK';

    const nextWindowDelayMs = this.getNextWindowDelayMs();

    return {
      allowed: false,
      currentCount: limit,
      limit,
      nextWindowDelayMs,
      windowKey: window,
      shouldNotifySlack,
    };
  }

  /**
   * Helper to retrieve current usage count for a sender in the current hour window.
   */
  public async getCurrentUsage(senderEmail: string): Promise<{ count: number; limit: number }> {
    const window = this.getHourWindow();
    const key = `rate_limit:${senderEmail.toLowerCase()}:${window}`;
    const raw = await redisClient.get(key);
    return {
      count: raw ? parseInt(raw, 10) : 0,
      limit: ENV.MAX_EMAILS_PER_HOUR_PER_SENDER,
    };
  }
}

export const rateLimitService = new RateLimitService();
