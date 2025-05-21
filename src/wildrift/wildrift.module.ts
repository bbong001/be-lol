import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WildriftController } from './wildrift.controller';
import { WildriftService } from './wildrift.service';
import { WrChampion, WrChampionSchema } from './schemas/wr-champion.schema';
import { WrItem, WrItemSchema } from './schemas/wr-item.schema';
import { WrRune, WrRuneSchema } from './schemas/wr-rune.schema';
import { WrGuide, WrGuideSchema } from './schemas/wr-guide.schema';
import {
  WrChampionBuild,
  WrChampionBuildSchema,
} from './schemas/wr-champion-build.schema';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WrChampion.name, schema: WrChampionSchema },
      { name: WrItem.name, schema: WrItemSchema },
      { name: WrRune.name, schema: WrRuneSchema },
      { name: WrGuide.name, schema: WrGuideSchema },
      { name: WrChampionBuild.name, schema: WrChampionBuildSchema },
    ]),
    CommentsModule,
  ],
  controllers: [WildriftController],
  providers: [WildriftService],
  exports: [WildriftService],
})
export class WildriftModule {}
