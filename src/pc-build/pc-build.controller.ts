import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Put,
  Delete,
  Header,
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
import { CreatePCBuildDto } from './dtos/create-pc-build.dto';
import { UpdatePCBuildDto } from './dtos/update-pc-build.dto';

@ApiTags('pc-builds')
@Controller('pc-build')
export class PcBuildController {
  constructor(private readonly pcBuildService: PcBuildService) {}

  // PC Component endpoints
  // @ApiOperation({ summary: 'Get all PC components' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Components retrieved successfully',
  // })
  // @Get('components')
  // async getAllComponents() {
  //   return {
  //     status: 'success',
  //     data: await this.pcBuildService.findAllComponents(),
  //   };
  // }

  // @ApiOperation({ summary: 'Get PC components by type' })
  // @ApiParam({ name: 'type', description: 'Component type (CPU, GPU, etc.)' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Components retrieved successfully',
  // })
  // @Get('components/type/:type')
  // async getComponentsByType(@Param('type') type: string) {
  //   return {
  //     status: 'success',
  //     data: await this.pcBuildService.findComponentsByType(type),
  //   };
  // }

  // @ApiOperation({ summary: 'Get PC component by ID' })
  // @ApiParam({ name: 'id', description: 'Component ID' })
  // @ApiResponse({ status: 200, description: 'Component retrieved successfully' })
  // @ApiResponse({ status: 404, description: 'Component not found' })
  // @Get('components/:id')
  // async getComponentById(@Param('id') id: string) {
  //   return {
  //     status: 'success',
  //     data: await this.pcBuildService.findComponentById(id),
  //   };
  // }

  // PC Build endpoints
  @ApiOperation({ summary: 'Get all public PC builds' })
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
  @ApiQuery({
    name: 'lang',
    description: 'Language filter (vi or en)',
    required: false,
    enum: ['vi', 'en'],
    example: 'vi',
  })
  @ApiResponse({ status: 200, description: 'Builds retrieved successfully' })
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Get('builds')
  async getAllBuilds(
    @Query('limit') limit: string,
    @Query('page') page: string,
    @Query('lang') lang: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const pageNum = page ? parseInt(page, 10) : 1;
    const language = lang || 'vi';
    return {
      status: 'success',
      data: await this.pcBuildService.findAllBuilds(
        limitNum,
        pageNum,
        language,
      ),
    };
  }

  @ApiOperation({ summary: 'Get PC build by ID' })
  @ApiParam({ name: 'id', description: 'Build ID' })
  @ApiResponse({ status: 200, description: 'Build retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Build not found' })
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Get('builds/:id')
  async getBuildById(@Param('id') id: string) {
    return {
      status: 'success',
      data: await this.pcBuildService.findBuildById(id),
    };
  }

  @ApiOperation({ summary: 'Get PC builds by tag' })
  @ApiParam({ name: 'tag', description: 'Tag name' })
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
  @ApiQuery({
    name: 'lang',
    description: 'Language filter (vi or en)',
    required: false,
    enum: ['vi', 'en'],
    example: 'vi',
  })
  @ApiResponse({
    status: 200,
    description: 'Tagged builds retrieved successfully',
  })
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Get('tag/:tag')
  async getBuildsByTag(
    @Param('tag') tag: string,
    @Query('limit') limit: string,
    @Query('page') page: string,
    @Query('lang') lang: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const pageNum = page ? parseInt(page, 10) : 1;
    const language = lang || 'vi';
    return {
      status: 'success',
      data: await this.pcBuildService.findByTag(
        tag,
        limitNum,
        pageNum,
        language,
      ),
    };
  }

  @ApiOperation({ summary: 'Get PC builds for current user' })
  @ApiQuery({
    name: 'lang',
    description: 'Language filter (vi or en)',
    required: false,
    enum: ['vi', 'en'],
  })
  @ApiResponse({
    status: 200,
    description: 'User builds retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('user/builds')
  async getUserBuilds(@Request() req, @Query('lang') lang: string) {
    return {
      status: 'success',
      data: await this.pcBuildService.findUserBuilds(req.user.userId, lang),
    };
  }

  @ApiOperation({ summary: 'Create a new PC build' })
  @ApiResponse({ status: 201, description: 'Build created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('builds')
  async createBuild(@Body() body: CreatePCBuildDto, @Request() req) {
    const build = await this.pcBuildService.createBuild(body, req.user.userId);
    return {
      status: 'success',
      data: build,
    };
  }

  @ApiOperation({ summary: 'Update a PC build' })
  @ApiParam({ name: 'id', description: 'Build ID' })
  @ApiResponse({ status: 200, description: 'Build updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Build not found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('builds/:id')
  async updateBuild(
    @Param('id') id: string,
    @Body() body: UpdatePCBuildDto,
    @Request() req,
  ) {
    const build = await this.pcBuildService.updateBuild(
      id,
      body,
      req.user.userId,
      req.user.roles,
    );
    return {
      status: 'success',
      data: build,
    };
  }

  @ApiOperation({ summary: 'Delete a PC build' })
  @ApiParam({ name: 'id', description: 'Build ID' })
  @ApiResponse({ status: 200, description: 'Build deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Build not found' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('builds/:id')
  async deleteBuild(@Param('id') id: string, @Request() req) {
    await this.pcBuildService.deleteBuild(id, req.user.userId, req.user.roles);
    return {
      status: 'success',
      message: 'Build deleted successfully',
    };
  }

  // Admin endpoints
  @ApiOperation({
    summary: 'Admin: Get all PC builds (published and unpublished)',
  })
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
  @ApiQuery({
    name: 'lang',
    description: 'Language filter (vi or en)',
    required: false,
    enum: ['vi', 'en'],
  })
  @ApiResponse({
    status: 200,
    description: 'Admin builds retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin')
  async getAllBuildsAdmin(
    @Query('limit') limit: string,
    @Query('page') page: string,
    @Query('lang') lang: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const pageNum = page ? parseInt(page, 10) : 1;
    return {
      status: 'success',
      data: await this.pcBuildService.findAllBuildsAdmin(
        limitNum,
        pageNum,
        lang,
      ),
    };
  }
}
