import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChampionsController } from './champions.controller';
import { ChampionsService } from './champions.service';
import { Champion, ChampionSchema } from './schemas/champion.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Champion.name, schema: ChampionSchema },
    ]),
  ],
  controllers: [ChampionsController],
  providers: [ChampionsService],
  exports: [ChampionsService],
})
export class ChampionsModule {}
