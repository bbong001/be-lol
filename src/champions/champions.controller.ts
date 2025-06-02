import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ChampionsService } from './champions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateChampionDto } from './dto/create-champion.dto';
import { UpdateChampionDto } from './dto/update-champion.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { ChampionBuildCrawlerService } from './services/champion-build-crawler.service';
import { validateLanguage, SupportedLanguage } from './utils/i18n.util';

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
  @ApiQuery({
    name: 'lang',
    required: false,
    type: String,
    description: 'Language code (en|vi, default: en)',
    enum: ['en', 'vi'],
  })
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('lang') lang?: string,
  ) {
    const language: SupportedLanguage = validateLanguage(lang);
    return this.championsService.findAll(page, limit, language);
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
  @ApiQuery({
    name: 'lang',
    required: false,
    type: String,
    description: 'Language code (en|vi, default: en)',
    enum: ['en', 'vi'],
  })
  @ApiResponse({ status: 200, description: 'Champion details' })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  @Get('name/:name')
  async findByName(@Param('name') name: string, @Query('lang') lang?: string) {
    const language: SupportedLanguage = validateLanguage(lang);
    return this.championsService.findByName(name, language);
  }

  @ApiOperation({ summary: 'Get champion details by name from Data Dragon' })
  @ApiParam({
    name: 'name',
    description: 'Champion name or partial name to search',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    type: String,
    description: 'Language code (en|vi, default: en)',
    enum: ['en', 'vi'],
  })
  @ApiResponse({
    status: 200,
    description: 'Champion details from Data Dragon',
  })
  @ApiResponse({ status: 404, description: 'No champions found' })
  @Get('details/:name')
  async getChampionDetails(
    @Param('name') name: string,
    @Query('lang') lang?: string,
  ) {
    const language: SupportedLanguage = validateLanguage(lang);
    return this.championsService.findDetailsByName(name, language);
  }

  @ApiOperation({ summary: 'Get champion by ID' })
  @ApiParam({ name: 'id', description: 'Champion ID' })
  @ApiQuery({
    name: 'lang',
    required: false,
    type: String,
    description: 'Language code (en|vi, default: en)',
    enum: ['en', 'vi'],
  })
  @ApiResponse({ status: 200, description: 'Champion details' })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  @Get(':id')
  async findOne(@Param('id') id: string, @Query('lang') lang?: string) {
    const language: SupportedLanguage = validateLanguage(lang);
    return this.championsService.findById(id, language);
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
  @ApiQuery({
    name: 'lang',
    required: false,
    type: String,
    description: 'Language code (en|vi, default: en)',
    enum: ['en', 'vi'],
  })
  @Get('search/:query')
  async searchChampion(
    @Param('query') query: string,
    @Query('lang') lang?: string,
  ) {
    const language: SupportedLanguage = validateLanguage(lang);
    const champion = await this.championsService.findByName(query, language);
    if (!champion) {
      throw new NotFoundException(
        `No champion found with name or ID '${query}'`,
      );
    }
    // Get detailed information with builds using champion ID instead of name
    return this.championsService.findDetailsByName(query, language);
  }

  @ApiOperation({ summary: 'Create a new champion' })
  @ApiResponse({ status: 201, description: 'Champion created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 409, description: 'Champion already exists' })
  @ApiBody({ type: CreateChampionDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(@Body() createChampionDto: CreateChampionDto) {
    try {
      const champion = await this.championsService.create(createChampionDto);
      return {
        status: 'success',
        data: champion,
        message: 'Champion created successfully',
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  @ApiOperation({ summary: 'Update an existing champion' })
  @ApiResponse({ status: 200, description: 'Champion updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  @ApiResponse({ status: 409, description: 'Champion ID/name conflict' })
  @ApiParam({ name: 'id', description: 'Champion ID' })
  @ApiBody({ type: UpdateChampionDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateChampionDto: UpdateChampionDto,
  ) {
    try {
      const champion = await this.championsService.update(
        id,
        updateChampionDto,
      );
      return {
        status: 'success',
        data: champion,
        message: 'Champion updated successfully',
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw new Error(error.message);
    }
  }

  @ApiOperation({ summary: 'Delete a champion' })
  @ApiResponse({ status: 200, description: 'Champion deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  @ApiParam({ name: 'id', description: 'Champion ID' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const result = await this.championsService.remove(id);
      return {
        status: 'success',
        message: result.message,
      };
    } catch (error) {
      if (error.message.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw new Error(error.message);
    }
  }
}
