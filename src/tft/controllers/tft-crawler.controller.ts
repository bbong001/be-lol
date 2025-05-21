import { Controller, Get, Post, UseGuards, Body, Param } from '@nestjs/common';
import { TftCrawlerService } from '../services/tft-crawler.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { TftService } from '../tft.service';
import { RecommendedItemData } from '../schemas/tft-champion.schema';

@ApiTags('tft-crawler')
@Controller('tft/crawler')
export class TftCrawlerController {
  constructor(
    private readonly tftCrawlerService: TftCrawlerService,
    private readonly tftService: TftService,
  ) {}

  @Get('champions')
  @ApiOperation({ summary: 'Crawl TFT champions data from tftactics.gg' })
  @ApiResponse({
    status: 200,
    description: 'Return crawled TFT champions data',
  })
  async getChampions() {
    return this.tftCrawlerService.crawlChampions();
  }

  @Post('champions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crawl and save TFT champions to database' })
  @ApiResponse({
    status: 201,
    description: 'TFT champions crawled and saved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async saveChampions() {
    await this.tftCrawlerService.saveCrawledChampions();
    return { message: 'TFT champions crawled and saved successfully' };
  }

  @Post('champions/parse-html')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Parse TFT champions from provided HTML' })
  @ApiBody({ description: 'HTML content to parse', type: Object })
  @ApiResponse({
    status: 201,
    description: 'TFT champions parsed from HTML and saved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async parseChampionsFromHtml(@Body() body: { html: string }) {
    return this.tftCrawlerService.parseChampionsFromHtml(body.html);
  }

  @Post('champions/save-from-html')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Parse and save TFT champions from provided HTML' })
  @ApiBody({ description: 'HTML content to parse and save', type: Object })
  @ApiResponse({
    status: 201,
    description: 'TFT champions parsed from HTML and saved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async saveChampionsFromHtml(@Body() body: { html: string }) {
    await this.tftCrawlerService.saveChampionsFromHtml(body.html);
    return { message: 'TFT champions parsed from HTML and saved successfully' };
  }

  @Get('champions/:name/details')
  @ApiOperation({
    summary: 'Crawl detailed information for a specific TFT champion',
  })
  @ApiParam({ name: 'name', description: 'Champion name' })
  @ApiResponse({
    status: 200,
    description: 'Return detailed champion information',
  })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  async getChampionDetails(@Param('name') name: string) {
    return this.tftCrawlerService.crawlChampionDetails(name);
  }

  @Post('champions/:name/details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Crawl and update details for a specific TFT champion',
  })
  @ApiParam({ name: 'name', description: 'Champion name' })
  @ApiResponse({
    status: 200,
    description: 'Champion details updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  async updateChampionDetails(@Param('name') name: string) {
    const updatedChampion =
      await this.tftCrawlerService.updateChampionDetails(name);

    return {
      message: `Champion ${name} details updated successfully`,
      champion: updatedChampion,
    };
  }

  @Post('champions/details/update-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update details for all TFT champions' })
  @ApiResponse({ status: 200, description: 'All champion details updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateAllChampionDetails() {
    const result = await this.tftCrawlerService.updateAllChampionDetails();
    return {
      message: 'Champion details update completed',
      updated: result.updated,
      failed: result.failed,
    };
  }

  @Get('items')
  @ApiOperation({ summary: 'Crawl TFT items data from tftactics.gg' })
  @ApiResponse({ status: 200, description: 'Return crawled TFT items data' })
  async getItems() {
    return this.tftCrawlerService.crawlItems();
  }

  @Post('items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crawl and save TFT items to database' })
  @ApiResponse({
    status: 201,
    description: 'TFT items crawled and saved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async saveItems() {
    await this.tftCrawlerService.saveCrawledItems();
    return { message: 'TFT items crawled and saved successfully' };
  }

  @Get('champions/:name/items')
  @ApiOperation({
    summary: 'Get recommended items for a specific TFT champion with images',
  })
  @ApiParam({ name: 'name', description: 'Champion name' })
  @ApiResponse({
    status: 200,
    description: 'Return champion recommended items with images',
  })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  async getChampionItems(@Param('name') name: string) {
    const championDetail =
      await this.tftCrawlerService.crawlChampionDetails(name);

    return {
      name: championDetail.name,
      recommendedItems: championDetail.recommendedItemsData || [],
    };
  }

  @Get('champions/:name/recommended-items')
  @ApiOperation({
    summary:
      'Get recommended items with images for a specific champion from database',
  })
  @ApiParam({ name: 'name', description: 'Champion name' })
  @ApiResponse({
    status: 200,
    description: 'Return champion recommended items with images',
  })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  async getChampionRecommendedItems(@Param('name') name: string): Promise<{
    name: string;
    recommendedItems: RecommendedItemData[];
  }> {
    const champion = await this.tftService.findChampionByName(name);
    return {
      name: champion.name,
      recommendedItems: champion.recommendedItemsData || [],
    };
  }

  @Get('champions/items/all')
  @ApiOperation({
    summary: 'Get all champions with their recommended items and images',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all champions with their recommended items and images',
  })
  async getAllChampionsWithItems() {
    const champions = await this.tftService.findAllChampions();

    return champions.map((champion) => ({
      name: champion.name,
      cost: champion.cost,
      imageUrl: champion.imageUrl,
      traits: champion.traits,
      recommendedItems: champion.recommendedItemsData || [],
    }));
  }

  @Get('items/all')
  @ApiOperation({
    summary: 'Get all TFT items with images from database',
  })
  @ApiResponse({
    status: 200,
    description: 'Return all TFT items with images',
  })
  async getAllItems() {
    const items = await this.tftService.findAllItems();
    return items;
  }
}
