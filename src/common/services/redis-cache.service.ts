import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST') || 'localhost',
      port: this.configService.get<number>('REDIS_PORT') || 6379,
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      db: this.configService.get<number>('REDIS_DB') || 0,
    });

    this.redisClient.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.redisClient.on('connect', () => {
      console.log('Redis client connected successfully');
    });
  }

  onModuleDestroy() {
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return value as unknown as T;
    }
  }

  async set(key: string, value: any, expiry?: number): Promise<void> {
    const stringValue =
      typeof value === 'object' ? JSON.stringify(value) : value;

    if (expiry) {
      await this.redisClient.set(key, stringValue, 'EX', expiry);
    } else {
      await this.redisClient.set(key, stringValue);
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.redisClient.keys(pattern);
  }

  async flushAll(): Promise<void> {
    await this.redisClient.flushall();
  }
}
