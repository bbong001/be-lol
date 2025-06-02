import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  // private redisClient: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // Temporary disabled Redis connection
    console.log('Redis is temporarily disabled');

    /* 
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
    */
  }

  onModuleDestroy() {
    // Disabled Redis disconnect
    /*
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
    */
  }

  async get<T>(key: string): Promise<T | null> {
    // Redis get method disabled - returning null
    console.log(`Redis GET disabled for key: ${key}`);
    return null;

    /*
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
    */
  }

  async set(_key: string, _value: any, _expiry?: number): Promise<void> {
    // Redis set method disabled
    console.log(`Redis SET disabled for key: ${_key}`);
    return;

    /*
    const stringValue =
      typeof value === 'object' ? JSON.stringify(value) : value;

    if (expiry) {
      await this.redisClient.set(key, stringValue, 'EX', expiry);
    } else {
      await this.redisClient.set(key, stringValue);
    }
    */
  }

  async del(key: string): Promise<void> {
    // Redis del method disabled
    console.log(`Redis DEL disabled for key: ${key}`);
    return;

    /*
    await this.redisClient.del(key);
    */
  }

  async keys(pattern: string): Promise<string[]> {
    // Redis keys method disabled - returning empty array
    console.log(`Redis KEYS disabled for pattern: ${pattern}`);
    return [];

    /*
    return this.redisClient.keys(pattern);
    */
  }

  async flushAll(): Promise<void> {
    // Redis flushAll method disabled
    console.log('Redis FLUSHALL disabled');
    return;

    /*
    await this.redisClient.flushall();
    */
  }
}
