import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: any = null;
  private readonly logger = new Logger(RedisService.name);
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const Redis = await import('ioredis');
      const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
      
      this.client = new Redis.default(redisUrl, {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis connected successfully');
      });

      this.client.on('error', (err: Error) => {
        this.isConnected = false;
        this.logger.warn(`Redis connection error (running in memory mode): ${err.message}`);
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis connection closed');
      });

      await this.client.connect().catch(() => {
        this.logger.warn('Redis not available, running in memory mode');
      });
    } catch (error) {
      this.logger.warn('Redis module not available, running in memory mode');
    }
  }

  onModuleDestroy() {
    if (this.client && this.isConnected) {
      this.client.disconnect();
    }
  }

  getClient(): any {
    return this.client;
  }

  isRedisAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  async get(key: string): Promise<string | null> {
    if (this.isRedisAvailable()) {
      try {
        return await this.client.get(key);
      } catch {
        return null;
      }
    }
    return null;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (this.isRedisAvailable()) {
      try {
        if (ttl) {
          await this.client.set(key, value, 'EX', ttl);
        } else {
          await this.client.set(key, value);
        }
      } catch {
        // Ignore errors
      }
    }
  }

  async del(key: string): Promise<void> {
    if (this.isRedisAvailable()) {
      try {
        await this.client.del(key);
      } catch {
        // Ignore errors
      }
    }
  }
}
