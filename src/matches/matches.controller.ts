import { Controller, Get, Param, Query } from '@nestjs/common';
import { MatchesService } from './matches.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LolHistoryQueryDto } from './dtos/lol-history.dto';
import { LolHistoryService } from './lol-history.service';
import { LolMatchDetailsService } from './lol-match-details.service';

@ApiTags('matches')
@Controller('matches')
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly lolHistoryService: LolHistoryService,
    private readonly lolMatchDetailsService: LolMatchDetailsService,
  ) {}

  // @Get('summoner/:region/:name')
  // async getSummonerByName(
  //   @Param('name') name: string,
  //   @Param('region') region: string,
  // ) {
  //   return {
  //     status: 'success',
  //     data: await this.matchesService.getSummonerByName(name, region),
  //   };
  // }

  @ApiOperation({ summary: 'Get match history for a summoner by Riot ID' })
  @ApiParam({
    name: 'gameName',
    description: 'Game name (e.g., Hide on bush)',
  })
  @ApiParam({
    name: 'tagLine',
    description: 'Tag line (e.g., KR1)',
  })
  @ApiQuery({
    name: 'count',
    description: 'Number of matches to return (default: 10)',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'region',
    description: 'Region (default: EUROPE)',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Match history retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Player not found' })
  @Get('riot-id/:gameName/:tagLine')
  async getMatchHistoryByRiotId(
    @Param('gameName') gameName: string,
    @Param('tagLine') tagLine: string,
    @Query('count') count: string,
    @Query('region') region: string,
  ) {
    const matchCount = count ? parseInt(count, 10) : 10;
    const regionValue = region || 'EUROPE';

    return {
      status: 'success',
      data: await this.matchesService.getMatchHistoryByRiotId(
        gameName,
        tagLine,
        matchCount,
        regionValue,
      ),
    };
  }

  @ApiOperation({ summary: 'Get match history for a summoner' })
  @ApiParam({
    name: 'summonerId',
    description: 'Summoner ID to get match history for',
  })
  @ApiQuery({
    name: 'count',
    description: 'Number of matches to return',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Match history retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Summoner not found' })
  @Get('history/:summonerId')
  async getMatchHistory(
    @Param('summonerId') summonerId: string,
    @Query('count') count: string,
  ) {
    const matchCount = count ? parseInt(count, 10) : 10;
    return {
      status: 'success',
      data: await this.matchesService.getMatchesBySummonerId(
        summonerId,
        matchCount,
      ),
    };
  }

  @ApiOperation({ summary: 'Lấy lịch sử đấu từ LeagueOfGraphs' })
  @ApiResponse({ status: 200, description: 'Lịch sử đấu trả về thành công' })
  @Get('/lol-history')
  async getLolHistory(@Query() query: LolHistoryQueryDto) {
    return {
      status: 'success',
      data: await this.lolHistoryService.getHistory(query.name, query.tag),
    };
  }

  @ApiOperation({ summary: 'Lấy chi tiết trận đấu từ LeagueOfGraphs' })
  @ApiParam({
    name: 'matchPath',
    description: 'Đường dẫn trận đấu (ví dụ: /vn/match/vn/876142021#participant4)',
  })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết trận đấu trả về thành công',
  })
  @Get('/lol-match-details/:matchPath(*)')
  async getLolMatchDetails(@Param('matchPath') matchPath: string) {
    return await this.lolMatchDetailsService.getMatchDetails(matchPath);
  }
}
