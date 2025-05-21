import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TftController } from './tft.controller';
import { TftService } from './tft.service';
import { TftChampion, TftChampionSchema } from './schemas/tft-champion.schema';
import { TftItem, TftItemSchema } from './schemas/tft-item.schema';
import { TftComp, TftCompSchema } from './schemas/tft-comp.schema';
import { TftAugment, TftAugmentSchema } from './schemas/tft-augment.schema';
import { TftCrawlerService } from './services/tft-crawler.service';
// import { TftCrawlerController } from './controllers/tft-crawler.controller';
import { HttpModule } from '@nestjs/axios';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TftChampion.name, schema: TftChampionSchema },
      { name: TftItem.name, schema: TftItemSchema },
      { name: TftComp.name, schema: TftCompSchema },
      { name: TftAugment.name, schema: TftAugmentSchema },
    ]),
    HttpModule,
    CommentsModule,
  ],
  controllers: [TftController],
  providers: [TftService, TftCrawlerService],
  exports: [TftService, TftCrawlerService],
})
export class TftModule {}
