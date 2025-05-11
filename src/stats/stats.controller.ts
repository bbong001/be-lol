import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @ApiOperation({ summary: 'Get statistics for all champions' })
  @ApiResponse({
    status: 200,
    description: 'Champion statistics retrieved successfully',
  })
  @Get('champions')
  async getAllChampionStats() {
    return {
      status: 'success',
      data: await this.statsService.getAllChampionStats(),
    };
  }

  @ApiOperation({ summary: 'Get statistics for a specific champion' })
  @ApiParam({ name: 'id', description: 'Champion ID' })
  @ApiResponse({
    status: 200,
    description: 'Champion statistics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  @Get('champions/:id')
  async getChampionStats(@Param('id') id: string) {
    return {
      status: 'success',
      data: await this.statsService.getChampionStats(id),
    };
  }

  @ApiOperation({ summary: 'Get champions with highest pick rates' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of champions to return',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Top pick rate champions retrieved successfully',
  })
  @Get('top/pickrate')
  async getTopPickRateChampions(@Query('limit') limit: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return {
      status: 'success',
      data: await this.statsService.getTopPickRateChampions(limitNumber),
    };
  }

  @ApiOperation({ summary: 'Get champions with highest win rates' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of champions to return',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Top win rate champions retrieved successfully',
  })
  @Get('top/winrate')
  async getTopWinRateChampions(@Query('limit') limit: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return {
      status: 'success',
      data: await this.statsService.getTopWinRateChampions(limitNumber),
    };
  }

  @ApiOperation({ summary: 'Get champions with highest ban rates' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of champions to return',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Top ban rate champions retrieved successfully',
  })
  @Get('top/banrate')
  async getTopBanRateChampions(@Query('limit') limit: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return {
      status: 'success',
      data: await this.statsService.getTopBanRateChampions(limitNumber),
    };
  }

  @ApiOperation({ summary: 'Generate demo statistics for champions' })
  @ApiResponse({
    status: 200,
    description: 'Demo statistics generated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('generate-demo')
  async generateDemoStats() {
    await this.statsService.generateDemoStats();
    return {
      status: 'success',
      message: 'Demo champion statistics generated successfully',
    };
  }
}
