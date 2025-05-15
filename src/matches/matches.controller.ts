import { Controller, Get, Param, Query } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
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
    description:
      'Đường dẫn trận đấu (ví dụ: /vn/match/vn/876142021#participant4)',
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
