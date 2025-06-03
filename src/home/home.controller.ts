import { Controller, Get, Header, Query } from '@nestjs/common';
import { HomeService } from './home.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HomeQueryDto } from './dto/home-query.dto';

@ApiTags('Home')
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOperation({
    summary: 'Get aggregated home page data with language support',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns aggregated data for the home page including latest news, PC builds, and random champions',
  })
  async getHomePageData(@Query() query: HomeQueryDto) {
    return this.homeService.getHomePageData(query.lang);
  }
}
