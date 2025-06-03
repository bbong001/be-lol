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
  @ApiQuery({
    name: 'lang',
    description: 'Language (vi or en)',
    required: false,
    type: String,
    enum: ['vi', 'en'],
  })
  @ApiResponse({ status: 200, description: 'Articles retrieved successfully' })
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Get()
  async findAll(
    @Query('limit') limit: string,
    @Query('page') page: string,
    @Query('lang') lang: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const pageNumber = page ? parseInt(page, 10) : 1;
    const language = lang || 'vi';

    return {
      status: 'success',
      data: await this.newsService.findAll(limitNumber, pageNumber, language),
    };
  }

  @ApiOperation({ summary: 'Get all news articles for admin' })
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
  @ApiQuery({
    name: 'lang',
    description: 'Language filter (vi or en), leave empty for all',
    required: false,
    type: String,
    enum: ['vi', 'en'],
  })
  @ApiResponse({ status: 200, description: 'Articles retrieved successfully' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Get('admin')
  async findAllAdmin(
    @Query('limit') limit: string,
    @Query('page') page: string,
    @Query('lang') lang: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const pageNumber = page ? parseInt(page, 10) : 1;

    return {
      status: 'success',
      data: await this.newsService.findAllAdmin(limitNumber, pageNumber, lang),
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
  @ApiQuery({
    name: 'lang',
    description: 'Language (vi or en)',
    required: false,
    type: String,
    enum: ['vi', 'en'],
  })
  @ApiResponse({ status: 200, description: 'Articles retrieved successfully' })
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Get('tag/:tag')
  async findByTag(
    @Param('tag') tag: string,
    @Query('limit') limit: string,
    @Query('page') page: string,
    @Query('lang') lang: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const pageNumber = page ? parseInt(page, 10) : 1;
    const language = lang || 'vi';

    return {
      status: 'success',
      data: await this.newsService.findByTag(
        tag,
        limitNumber,
        pageNumber,
        language,
      ),
    };
  }

  @ApiOperation({ summary: 'Get article by slug' })
  @ApiParam({ name: 'slug', description: 'Article slug' })
  @ApiQuery({
    name: 'lang',
    description: 'Language (vi or en)',
    required: false,
    type: String,
    enum: ['vi', 'en'],
  })
  @ApiResponse({ status: 200, description: 'Article retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Get(':slug')
  async findOne(@Param('slug') slug: string, @Query('lang') lang: string) {
    const language = lang || 'vi';
    return {
      status: 'success',
      data: await this.newsService.findBySlug(slug, language),
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
}
