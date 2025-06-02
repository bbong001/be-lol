import { Controller, Get, Header } from '@nestjs/common';
import { HomeService } from './home.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Home')
@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @ApiOperation({ summary: 'Get aggregated home page data' })
  @ApiResponse({
    status: 200,
    description:
      'Returns aggregated data for the home page including latest news, PC builds, and random champions',
  })
  async getHomePageData() {
    return this.homeService.getHomePageData();
  }
}
