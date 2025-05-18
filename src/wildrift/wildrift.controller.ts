import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { WildriftService } from './wildrift.service';
import { CreateWrChampionDto } from './dto/create-wr-champion.dto';
import { UpdateWrChampionDto } from './dto/update-wr-champion.dto';
import { CreateWrItemDto } from './dto/create-wr-item.dto';
import { CreateWrGuideDto } from './dto/create-wr-guide.dto';
import { UpdateWrGuideDto } from './dto/update-wr-guide.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PaginationDto } from '../common/dto/pagination.dto';
import { WrChampionBuildDto } from './dto/wr-champion-build.dto';

@ApiTags('wildrift')
@Controller('wildrift')
export class WildriftController {
  constructor(private readonly wildriftService: WildriftService) {}

  // Champions endpoints
  @Get('champions')
  @ApiOperation({ summary: 'Get all Wild Rift champions' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter champions by role' })
  @ApiResponse({ status: 200, description: 'Return all Wild Rift champions' })
  findAllChampions(
    @Query() paginationDto: PaginationDto,
    @Query('role') role?: string
  ) {
    return this.wildriftService.findAllChampions(paginationDto, role);
  }

  @Get('champions/with-builds')
  @ApiOperation({ summary: 'Get all Wild Rift champions with their builds' })
  @ApiResponse({ status: 200, description: 'Return all Wild Rift champions with their builds' })
  async getAllChampionsWithBuilds(@Query() paginationDto: PaginationDto) {
    return this.wildriftService.getAllChampionsWithBuilds(paginationDto);
  }

  @Get('champions/:id')
  @ApiOperation({ summary: 'Get a Wild Rift champion by ID' })
  @ApiParam({ name: 'id', description: 'Champion ID' })
  @ApiResponse({ status: 200, description: 'Return the Wild Rift champion' })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  findOneChampion(@Param('id') id: string) {
    return this.wildriftService.findOneChampion(id);
  }

  @Get('champions/:id/with-builds')
  @ApiOperation({ summary: 'Get a Wild Rift champion by ID with its builds' })
  @ApiParam({ name: 'id', description: 'Champion ID' })
  @ApiResponse({ status: 200, description: 'Return the Wild Rift champion with its builds' })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  async getChampionWithBuilds(@Param('id') id: string) {
    return this.wildriftService.getChampionWithBuilds(id);
  }

  @Post('champions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new Wild Rift champion' })
  @ApiResponse({ status: 201, description: 'The champion has been successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  createChampion(@Body() createWrChampionDto: CreateWrChampionDto) {
    return this.wildriftService.createChampion(createWrChampionDto);
  }

  @Put('champions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a Wild Rift champion' })
  @ApiParam({ name: 'id', description: 'Champion ID' })
  @ApiResponse({ status: 200, description: 'The champion has been successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  updateChampion(
    @Param('id') id: string,
    @Body() updateWrChampionDto: UpdateWrChampionDto,
  ) {
    return this.wildriftService.updateChampion(id, updateWrChampionDto);
  }

  @Delete('champions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a Wild Rift champion' })
  @ApiParam({ name: 'id', description: 'Champion ID' })
  @ApiResponse({ status: 200, description: 'The champion has been successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  removeChampion(@Param('id') id: string) {
    return this.wildriftService.removeChampion(id);
  }

  // Champion Builds endpoints
  @Get('champions/:championId/builds')
  @ApiOperation({ summary: 'Get builds for a specific Wild Rift champion' })
  @ApiParam({ name: 'championId', description: 'Champion ID' })
  @ApiResponse({ status: 200, description: 'Return the champion builds' })
  findChampionBuilds(
    @Param('championId') championId: string,
    @Query() paginationDto: PaginationDto
  ) {
    return this.wildriftService.findChampionBuilds(championId, paginationDto);
  }

  @Get('builds/:id')
  @ApiOperation({ summary: 'Get a specific champion build by ID' })
  @ApiParam({ name: 'id', description: 'Build ID' })
  @ApiResponse({ status: 200, description: 'Return the champion build' })
  @ApiResponse({ status: 404, description: 'Build not found' })
  findChampionBuildById(@Param('id') id: string) {
    return this.wildriftService.findChampionBuildById(id);
  }

  @Post('builds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new champion build' })
  @ApiResponse({ status: 201, description: 'The build has been successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  createChampionBuild(@Body() championBuildDto: WrChampionBuildDto) {
    return this.wildriftService.createChampionBuild(championBuildDto);
  }

  @Put('builds/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a champion build' })
  @ApiParam({ name: 'id', description: 'Build ID' })
  @ApiResponse({ status: 200, description: 'The build has been successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Build not found' })
  updateChampionBuild(
    @Param('id') id: string,
    @Body() championBuildDto: WrChampionBuildDto
  ) {
    return this.wildriftService.updateChampionBuild(id, championBuildDto);
  }

  @Delete('builds/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a champion build' })
  @ApiParam({ name: 'id', description: 'Build ID' })
  @ApiResponse({ status: 200, description: 'The build has been successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Build not found' })
  removeChampionBuild(@Param('id') id: string) {
    return this.wildriftService.removeChampionBuild(id);
  }

  // Items endpoints
  @Get('items')
  @ApiOperation({ summary: 'Get all Wild Rift items' })
  @ApiResponse({ status: 200, description: 'Return all Wild Rift items' })
  findAllItems(@Query() paginationDto: PaginationDto) {
    return this.wildriftService.findAllItems(paginationDto);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get a Wild Rift item by ID' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiResponse({ status: 200, description: 'Return the Wild Rift item' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  findOneItem(@Param('id') id: string) {
    return this.wildriftService.findOneItem(id);
  }

  @Post('items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new Wild Rift item' })
  @ApiResponse({ status: 201, description: 'The item has been successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  createItem(@Body() createWrItemDto: CreateWrItemDto) {
    return this.wildriftService.createItem(createWrItemDto);
  }

  // Guides endpoints
  @Get('guides')
  @ApiOperation({ summary: 'Get all Wild Rift guides' })
  @ApiQuery({ name: 'championId', required: false, description: 'Filter guides by champion ID' })
  @ApiResponse({ status: 200, description: 'Return all Wild Rift guides' })
  findAllGuides(
    @Query() paginationDto: PaginationDto,
    @Query('championId') championId?: string
  ) {
    return this.wildriftService.findAllGuides(paginationDto, championId);
  }

  @Get('guides/:id')
  @ApiOperation({ summary: 'Get a Wild Rift guide by ID' })
  @ApiParam({ name: 'id', description: 'Guide ID' })
  @ApiResponse({ status: 200, description: 'Return the Wild Rift guide' })
  @ApiResponse({ status: 404, description: 'Guide not found' })
  findOneGuide(@Param('id') id: string) {
    return this.wildriftService.findOneGuide(id);
  }

  @Post('guides')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new Wild Rift guide' })
  @ApiResponse({ status: 201, description: 'The guide has been successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  createGuide(@Body() createWrGuideDto: CreateWrGuideDto) {
    return this.wildriftService.createGuide(createWrGuideDto);
  }

  @Put('guides/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a Wild Rift guide' })
  @ApiParam({ name: 'id', description: 'Guide ID' })
  @ApiResponse({ status: 200, description: 'The guide has been successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Guide not found' })
  updateGuide(
    @Param('id') id: string,
    @Body() updateWrGuideDto: UpdateWrGuideDto,
  ) {
    return this.wildriftService.updateGuide(id, updateWrGuideDto);
  }
} 