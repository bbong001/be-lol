import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import {
  ChampionStats,
  ChampionStatsSchema,
} from './schemas/champion-stats.schema';
import { MatchesModule } from '../matches/matches.module';
import { ChampionsModule } from '../champions/champions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChampionStats.name, schema: ChampionStatsSchema },
    ]),
    MatchesModule,
    ChampionsModule,
  ],
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
