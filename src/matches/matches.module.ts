import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { Match, MatchSchema } from './schemas/match.schema';
import { Summoner, SummonerSchema } from './schemas/summoner.schema';
import { LolHistoryService } from './lol-history.service';
import { LolMatchDetailsService } from './lol-match-details.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Match.name, schema: MatchSchema },
      { name: Summoner.name, schema: SummonerSchema },
    ]),
  ],
  controllers: [MatchesController],
  providers: [MatchesService, LolHistoryService, LolMatchDetailsService],
  exports: [MatchesService],
})
export class MatchesModule {}
