import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { NewsModule } from '../news/news.module';
import { PcBuildModule } from '../pc-build/pc-build.module';
import { ChampionsModule } from '../champions/champions.module';
import { TftModule } from '../tft/tft.module';
import { WildriftModule } from '../wildrift/wildrift.module';

@Module({
  imports: [
    NewsModule,
    PcBuildModule,
    ChampionsModule,
    TftModule,
    WildriftModule,
  ],
  controllers: [HomeController],
  providers: [HomeService],
  exports: [HomeService],
})
export class HomeModule {}
