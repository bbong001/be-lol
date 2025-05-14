import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { ChampionsService } from './champions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('champions')
@Controller('champions')
export class ChampionsController {
  constructor(private readonly championsService: ChampionsService) {}

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
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return {
      status: 'success',
      data: await this.championsService.findAll(
        page ? +page : 1,
        limit ? +limit : 20,
      ),
    };
  }

  @ApiOperation({ summary: 'Sync champions from Riot API' })
  @ApiResponse({ status: 200, description: 'Champions synced successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('sync/riot-api')
  async syncFromRiotApi() {
    await this.championsService.syncFromRiotApi();
    return {
      status: 'success',
      message: 'Champions synced successfully',
    };
  }

  @ApiOperation({ summary: 'Search champion by name' })
  @ApiParam({ name: 'name', description: 'Champion name (case insensitive)' })
  @ApiResponse({ status: 200, description: 'Champion details' })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  @Get('search/:name')
  async findByName(@Param('name') name: string) {
    return {
      status: 'success',
      data: await this.championsService.findByName(name),
    };
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
  async getDetailsByName(@Param('name') name: string) {
    return {
      status: 'success',
      data: await this.championsService.findDetailsByName(name),
    };
  }

  @ApiOperation({ summary: 'Get champion by ID' })
  @ApiParam({ name: 'id', description: 'Champion ID' })
  @ApiResponse({ status: 200, description: 'Champion details' })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return {
      status: 'success',
      data: await this.championsService.findById(id),
    };
  }
}
