import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PcBuildService } from './pc-build.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('pc-builds')
@Controller('pc-build')
export class PcBuildController {
  constructor(private readonly pcBuildService: PcBuildService) {}

  // PC Component endpoints
  @ApiOperation({ summary: 'Get all PC components' })
  @ApiResponse({
    status: 200,
    description: 'Components retrieved successfully',
  })
  @Get('components')
  async getAllComponents() {
    return {
      status: 'success',
      data: await this.pcBuildService.findAllComponents(),
    };
  }

  @ApiOperation({ summary: 'Get PC components by type' })
  @ApiParam({ name: 'type', description: 'Component type (CPU, GPU, etc.)' })
  @ApiResponse({
    status: 200,
    description: 'Components retrieved successfully',
  })
  @Get('components/type/:type')
  async getComponentsByType(@Param('type') type: string) {
    return {
      status: 'success',
      data: await this.pcBuildService.findComponentsByType(type),
    };
  }

  @ApiOperation({ summary: 'Get PC component by ID' })
  @ApiParam({ name: 'id', description: 'Component ID' })
  @ApiResponse({ status: 200, description: 'Component retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Component not found' })
  @Get('components/:id')
  async getComponentById(@Param('id') id: string) {
    return {
      status: 'success',
      data: await this.pcBuildService.findComponentById(id),
    };
  }

  // PC Build endpoints
  @ApiOperation({ summary: 'Get all PC builds' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of builds to return',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Builds retrieved successfully' })
  @Get('builds')
  async getAllBuilds(
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const pageNum = page ? parseInt(page, 10) : 1;
    return {
      status: 'success',
      data: await this.pcBuildService.findAllBuilds(limitNum, pageNum),
    };
  }

  @ApiOperation({ summary: 'Get PC build by ID' })
  @ApiParam({ name: 'id', description: 'Build ID' })
  @ApiResponse({ status: 200, description: 'Build retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Build not found' })
  @Get('builds/:id')
  async getBuildById(@Param('id') id: string) {
    return {
      status: 'success',
      data: await this.pcBuildService.findBuildById(id),
    };
  }

  @ApiOperation({ summary: 'Get PC builds for current user' })
  @ApiResponse({
    status: 200,
    description: 'User builds retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('user/builds')
  async getUserBuilds(@Request() req) {
    return {
      status: 'success',
      data: await this.pcBuildService.findUserBuilds(req.user.userId),
    };
  }
}
