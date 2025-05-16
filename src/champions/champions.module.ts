import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChampionsController } from './champions.controller';
import { ChampionsService } from './champions.service';
import { Champion, ChampionSchema } from './schemas/champion.schema';
import { ChampionBuildCrawlerService } from './services/champion-build-crawler.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Champion.name, schema: ChampionSchema },
    ]),
    CommonModule,
  ],
  controllers: [ChampionsController],
  providers: [ChampionsService, ChampionBuildCrawlerService],
  exports: [ChampionsService],
})
export class ChampionsModule {}
