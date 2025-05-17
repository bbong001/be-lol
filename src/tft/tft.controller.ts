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
import { TftService } from './tft.service';
import { CreateTftChampionDto } from './dto/create-tft-champion.dto';
import { UpdateTftChampionDto } from './dto/update-tft-champion.dto';
import { CreateTftItemDto } from './dto/create-tft-item.dto';
import { UpdateTftItemDto } from './dto/update-tft-item.dto';
import { CreateTftCompDto } from './dto/create-tft-comp.dto';
import { UpdateTftCompDto } from './dto/update-tft-comp.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('tft')
@Controller('tft')
export class TftController {
  constructor(private readonly tftService: TftService) {}

  // Champions endpoints
  @Get('champions')
  @ApiOperation({ summary: 'Get all TFT champions' })
  @ApiResponse({ status: 200, description: 'Return all TFT champions' })
  findAllChampions() {
    return this.tftService.findAllChampions();
  }

  @Get('champions/:id')
  @ApiOperation({ summary: 'Get a TFT champion by ID' })
  @ApiParam({ name: 'id', description: 'Champion ID' })
  @ApiResponse({ status: 200, description: 'Return the TFT champion' })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  findOneChampion(@Param('id') id: string) {
    return this.tftService.findOneChampion(id);
  }

  @Get('champions/name/:name')
  @ApiOperation({ summary: 'Get a TFT champion by name' })
  @ApiParam({ name: 'name', description: 'Champion name' })
  @ApiResponse({ status: 200, description: 'Return the TFT champion' })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  findChampionByName(@Param('name') name: string) {
    return this.tftService.findChampionByName(name);
  }

  @Post('champions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new TFT champion' })
  @ApiResponse({ status: 201, description: 'The champion has been successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  createChampion(@Body() createTftChampionDto: CreateTftChampionDto) {
    return this.tftService.createChampion(createTftChampionDto);
  }

//   @Put('champions/:id')
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles(Role.ADMIN)
//   @ApiBearerAuth()
//   @ApiOperation({ summary: 'Update a TFT champion' })
//   @ApiParam({ name: 'id', description: 'Champion ID' })
//   @ApiResponse({ status: 200, description: 'The champion has been successfully updated' })
//   @ApiResponse({ status: 401, description: 'Unauthorized' })
//   @ApiResponse({ status: 403, description: 'Forbidden' })
//   @ApiResponse({ status: 404, description: 'Champion not found' })
//   updateChampion(
//     @Param('id') id: string,
//     @Body() updateTftChampionDto: UpdateTftChampionDto,
//   ) {
//     return this.tftService.updateChampion(id, updateTftChampionDto);
//   }

  @Delete('champions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a TFT champion' })
  @ApiParam({ name: 'id', description: 'Champion ID' })
  @ApiResponse({ status: 200, description: 'The champion has been successfully deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Champion not found' })
  removeChampion(@Param('id') id: string) {
    return this.tftService.removeChampion(id);
  }

  // Items endpoints
  @Get('items')
  @ApiOperation({ summary: 'Get all TFT items' })
  @ApiResponse({ status: 200, description: 'Return all TFT items' })
  findAllItems() {
    return this.tftService.findAllItems();
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get a TFT item by ID' })
  @ApiParam({ name: 'id', description: 'Item ID' })
  @ApiResponse({ status: 200, description: 'Return the TFT item' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  findOneItem(@Param('id') id: string) {
    return this.tftService.findOneItem(id);
  }

  @Post('items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new TFT item' })
  @ApiResponse({ status: 201, description: 'The item has been successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  createItem(@Body() createTftItemDto: CreateTftItemDto) {
    return this.tftService.createItem(createTftItemDto);
  }

  // Comps endpoints
  @Get('comps')
  @ApiOperation({ summary: 'Get all TFT compositions' })
  @ApiQuery({ name: 'patch', required: false, description: 'Filter by patch version' })
  @ApiResponse({ status: 200, description: 'Return all TFT compositions' })
  findAllComps(@Query('patch') patch?: string) {
    return this.tftService.findAllComps(patch);
  }

  @Get('comps/:id')
  @ApiOperation({ summary: 'Get a TFT composition by ID' })
  @ApiParam({ name: 'id', description: 'Composition ID' })
  @ApiResponse({ status: 200, description: 'Return the TFT composition' })
  @ApiResponse({ status: 404, description: 'Composition not found' })
  findOneComp(@Param('id') id: string) {
    return this.tftService.findOneComp(id);
  }

  @Post('comps')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new TFT composition' })
  @ApiResponse({ status: 201, description: 'The composition has been successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  createComp(@Body() createTftCompDto: CreateTftCompDto) {
    return this.tftService.createComp(createTftCompDto);
  }

  @Put('comps/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a TFT composition' })
  @ApiParam({ name: 'id', description: 'Composition ID' })
  @ApiResponse({ status: 200, description: 'The composition has been successfully updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Composition not found' })
  updateComp(
    @Param('id') id: string,
    @Body() updateTftCompDto: UpdateTftCompDto,
  ) {
    return this.tftService.updateComp(id, updateTftCompDto);
  }
} 