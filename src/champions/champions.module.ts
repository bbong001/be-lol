import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChampionsController } from './champions.controller';
import { ChampionsService } from './champions.service';
import { Champion, ChampionSchema } from './schemas/champion.schema';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { ChampionBuildCrawlerService } from './services/champion-build-crawler.service';
import { CounterService } from './services/counter.service';
import { CounterCrawlerService } from './services/counter-crawler.service';
import { CounterController } from './controllers/counter.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Champion.name, schema: ChampionSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
    CommonModule,
  ],
  controllers: [ChampionsController, CounterController],
  providers: [
    ChampionsService,
    ChampionBuildCrawlerService,
    CounterService,
    CounterCrawlerService,
  ],
  exports: [ChampionsService, CounterService, CounterCrawlerService],
})
export class ChampionsModule {}
