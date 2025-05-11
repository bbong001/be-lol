import { Global, Module } from '@nestjs/common';
import { RiotApiService } from './services/riot-api.service';
import { RedisCacheService } from './services/redis-cache.service';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
    }),
    ConfigModule,
  ],
  providers: [RiotApiService, RedisCacheService],
  exports: [RiotApiService, RedisCacheService],
})
export class CommonModule {}
