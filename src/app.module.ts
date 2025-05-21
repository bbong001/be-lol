import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ChampionsModule } from './champions/champions.module';
import { MatchesModule } from './matches/matches.module';
import { StatsModule } from './stats/stats.module';
import { NewsModule } from './news/news.module';
import { PcBuildModule } from './pc-build/pc-build.module';
import { CommonModule } from './common/common.module';
import { CommentsModule } from './comments/comments.module';
import { TftModule } from './tft/tft.module';
import { WildriftModule } from './wildrift/wildrift.module';
import { HomeModule } from './home/home.module';

@Module({
  imports: [
    // Configuration for environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['config.env', '.env'],
    }),

    // MongoDB connection
    MongooseModule.forRoot(process.env.MONGODB_URI),

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
    TftModule,
    WildriftModule,
    HomeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
