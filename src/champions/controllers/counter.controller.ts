import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CounterService } from '../services/counter.service';
import {
  CreateCounterDto,
  UpdateCounterDto,
  CounterQueryDto,
} from '../dto/counter.dto';
import { Counter } from '../schemas/counter.schema';

@ApiTags('counters')
@Controller('counters')
export class CounterController {
  constructor(private readonly counterService: CounterService) {}

  @Post()
  @ApiOperation({ summary: 'Create new counter data for a champion' })
  @ApiResponse({
    status: 201,
    description: 'Counter data created successfully',
    type: Counter,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Counter data already exists',
  })
  async create(@Body() createCounterDto: CreateCounterDto): Promise<Counter> {
    return this.counterService.create(createCounterDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all counter data with filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Counter data retrieved successfully',
  })
  async findAll(@Query() query: CounterQueryDto): Promise<any> {
    return this.counterService.findAll(query);
  }

  @Get('name/:championName')
  @ApiOperation({
    summary: 'Get counter data for a specific champion name',
  })
  @ApiParam({
    name: 'championName',
    description: 'Champion name (case insensitive)',
    example: 'Yasuo',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    description: 'Champion role (optional filter)',
    enum: ['jungle', 'top', 'mid', 'adc', 'support'],
  })
  @ApiQuery({
    name: 'patch',
    required: false,
    description: 'Patch version',
  })
  @ApiQuery({
    name: 'rank',
    required: false,
    description: 'Rank tier',
  })
  @ApiQuery({
    name: 'region',
    required: false,
    description: 'Region',
  })
  @ApiResponse({
    status: 200,
    description: 'Counter data found',
    type: [Counter],
  })
  @ApiResponse({
    status: 404,
    description: 'Counter data not found',
  })
  async findByChampionName(
    @Param('championName') championName: string,
    @Query('role') role?: string,
    @Query('patch') patch?: string,
    @Query('rank') rank?: string,
    @Query('region') region?: string,
  ): Promise<Counter[]> {
    return this.counterService.findByChampionName(
      championName,
      role,
      patch,
      rank,
      region,
    );
  }

  @Get(':championId/:role')
  @ApiOperation({
    summary: 'Get counter data for a specific champion and role',
  })
  @ApiParam({
    name: 'championId',
    description: 'Champion ID',
  })
  @ApiParam({
    name: 'role',
    description: 'Champion role',
    enum: ['jungle', 'top', 'mid', 'adc', 'support'],
  })
  @ApiQuery({
    name: 'patch',
    required: false,
    description: 'Patch version',
  })
  @ApiQuery({
    name: 'rank',
    required: false,
    description: 'Rank tier',
  })
  @ApiQuery({
    name: 'region',
    required: false,
    description: 'Region',
  })
  @ApiResponse({
    status: 200,
    description: 'Counter data found',
    type: Counter,
  })
  @ApiResponse({
    status: 404,
    description: 'Counter data not found',
  })
  async findByChampionAndRole(
    @Param('championId') championId: string,
    @Param('role') role: string,
    @Query('patch') patch?: string,
    @Query('rank') rank?: string,
    @Query('region') region?: string,
  ): Promise<Counter> {
    return this.counterService.findByChampionAndRole(
      championId,
      role,
      patch,
      rank,
      region,
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update counter data by ID' })
  @ApiParam({
    name: 'id',
    description: 'Counter data ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Counter data updated successfully',
    type: Counter,
  })
  @ApiResponse({
    status: 404,
    description: 'Counter data not found',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCounterDto: UpdateCounterDto,
  ): Promise<Counter> {
    return this.counterService.update(id, updateCounterDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete counter data by ID' })
  @ApiParam({
    name: 'id',
    description: 'Counter data ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Counter data deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Counter data not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.counterService.remove(id);
  }
}
