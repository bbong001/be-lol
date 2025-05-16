import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ChampionsService } from './champions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ChampionBuildCrawlerService } from './services/champion-build-crawler.service';

@ApiTags('champions')
@Controller('champions')
export class ChampionsController {
  constructor(
    private readonly championsService: ChampionsService,
    private readonly championBuildCrawlerService: ChampionBuildCrawlerService,
  ) {}

  @ApiOperation({ summary: 'Get all champions with pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of champions with pagination',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 20)',
  })
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.championsService.findAll(page, limit);
  }

  @ApiOperation({ summary: 'Sync champions from Riot API' })
  @ApiResponse({ status: 200, description: 'Champions synced successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('sync')
  async syncChampions() {
    await this.championsService.syncFromRiotApi();
    return { success: true, message: 'Champions synced from Riot API' };
  }

  @ApiOperation({ summary: 'Search champion by name' })
  @ApiParam({ name: 'name', description: 'Champion name (case insensitive)' })
  @ApiResponse({ status: 200, description: 'Champion details' })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  @Get('name/:name')
  async findByName(@Param('name') name: string) {
    return this.championsService.findByName(name);
  }

  @ApiOperation({ summary: 'Get champion details by name from Data Dragon' })
  @ApiParam({
    name: 'name',
    description: 'Champion name or partial name to search',
  })
  @ApiResponse({
    status: 200,
    description: 'Champion details from Data Dragon',
  })
  @ApiResponse({ status: 404, description: 'No champions found' })
  @Get('details/:name')
  async getChampionDetails(@Param('name') name: string) {
    return this.championsService.findDetailsByName(name);
  }

  @ApiOperation({ summary: 'Get champion by ID' })
  @ApiParam({ name: 'id', description: 'Champion ID' })
  @ApiResponse({ status: 200, description: 'Champion details' })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.championsService.findById(id);
  }

  @ApiOperation({ summary: 'Get champion build data for a specific champion' })
  @ApiParam({ name: 'name', description: 'Champion name' })
  @Get('build/:name')
  getChampionBuild(@Param('name') name: string) {
    return this.championsService.getChampionBuild(name);
  }

  /**
   * Update build data for all champions
   * Admin only endpoint
   */
  @Post('builds/update-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateAllChampionBuilds() {
    return this.championsService.updateAllChampionBuilds();
  }

  @ApiOperation({ summary: 'Find champion by name or ID' })
  @ApiParam({ name: 'query', description: 'Champion name or ID' })
  @Get('search/:query')
  async searchChampion(@Param('query') query: string) {
    const champion = await this.championsService.findByName(query);
    if (!champion) {
      throw new NotFoundException(
        `No champion found with name or ID '${query}'`,
      );
    }
    // Get detailed information with builds
    return this.championsService.findDetailsByName(champion.name);
  }
}
