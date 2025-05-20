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
} from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateArticleDto } from './dtos/create-article.dto';
import { UpdateArticleDto } from './dtos/update-article.dto';
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

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @ApiOperation({ summary: 'Get all news articles' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of articles to return',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Articles retrieved successfully' })
  @Get()
  async findAll(@Query('limit') limit: string, @Query('page') page: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const pageNumber = page ? parseInt(page, 10) : 1;

    return {
      status: 'success',
      data: await this.newsService.findAll(limitNumber, pageNumber),
    };
  }

  @ApiOperation({ summary: 'Get articles by tag' })
  @ApiParam({ name: 'tag', description: 'Tag to filter articles by' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of articles to return',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Articles retrieved successfully' })
  @Get('tag/:tag')
  async findByTag(
    @Param('tag') tag: string,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const pageNumber = page ? parseInt(page, 10) : 1;

    return {
      status: 'success',
      data: await this.newsService.findByTag(tag, limitNumber, pageNumber),
    };
  }

  @ApiOperation({ summary: 'Get article by slug' })
  @ApiParam({ name: 'slug', description: 'Article slug' })
  @ApiResponse({ status: 200, description: 'Article retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    return {
      status: 'success',
      data: await this.newsService.findBySlug(slug),
    };
  }

  @ApiOperation({ summary: 'Create a new article (Admin only)' })
  @ApiResponse({ status: 201, description: 'Article created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiBearerAuth()
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() createArticleDto: CreateArticleDto, @Request() req) {
    return {
      status: 'success',
      data: await this.newsService.create(createArticleDto, req.user.userId),
    };
  }

  @ApiOperation({ summary: 'Update an article (Admin only)' })
  @ApiParam({ name: 'slug', description: 'Article slug' })
  @ApiResponse({ status: 200, description: 'Article updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiBearerAuth()
  @Put(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('slug') slug: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return {
      status: 'success',
      data: await this.newsService.update(slug, updateArticleDto),
    };
  }

  @ApiOperation({ summary: 'Delete an article (Admin only)' })
  @ApiParam({ name: 'slug', description: 'Article slug' })
  @ApiResponse({ status: 200, description: 'Article deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiBearerAuth()
  @Delete(':slug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async delete(@Param('slug') slug: string) {
    await this.newsService.delete(slug);
    return {
      status: 'success',
      message: 'Article deleted successfully',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin')
  async findAllAdmin(
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const pageNumber = page ? parseInt(page, 10) : 1;
    return {
      status: 'success',
      data: await this.newsService.findAllAdmin(limitNumber, pageNumber),
    };
  }
}
