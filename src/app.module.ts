import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ChampionsModule } from './champions/champions.module';
import { MatchesModule } from './matches/matches.module';
import { StatsModule } from './stats/stats.module';
import { NewsModule } from './news/news.module';
import { PcBuildModule } from './pc-build/pc-build.module';
import { CommonModule } from './common/common.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    // Configuration for environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'config.env',
    }),

    // MongoDB connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/lol-check',
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    }),

    // Feature modules
    AuthModule,
    UserModule,
    ChampionsModule,
    MatchesModule,
    StatsModule,
    NewsModule,
    CommentsModule,
    PcBuildModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
