import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Types } from 'mongoose';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiOperation({ summary: 'Get all comments' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of comments to return',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @Get()
  async findAll(@Query('limit') limit: string, @Query('page') page: string) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const pageNumber = page ? parseInt(page, 10) : 1;

    return {
      status: 'success',
      data: await this.commentsService.findAll(limitNumber, pageNumber),
    };
  }

  @ApiOperation({ summary: 'Get comment by ID' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return {
      status: 'success',
      data: await this.commentsService.findById(id),
    };
  }

  @ApiOperation({ summary: 'Get comments for a specific news article' })
  @ApiParam({ name: 'newsId', description: 'News article ID' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of comments to return',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid news ID' })
  @Get('news/:newsId')
  async findByNewsId(
    @Param('newsId') newsId: string,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const pageNumber = page ? parseInt(page, 10) : 1;

    return {
      status: 'success',
      data: await this.commentsService.findByNewsId(
        newsId,
        limitNumber,
        pageNumber,
      ),
    };
  }

  @ApiOperation({ summary: 'Get comments for a specific PC build' })
  @ApiParam({ name: 'pcBuildId', description: 'PC Build ID' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of comments to return',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid PC Build ID' })
  @Get('/pc-build/:pcBuildId')
  async findByPcBuildId(
    @Param('pcBuildId') pcBuildId: string,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const pageNumber = page ? parseInt(page, 10) : 1;
    return {
      status: 'success',
      data: await this.commentsService.findByPcBuildId(
        pcBuildId,
        limitNumber,
        pageNumber,
      ),
    };
  }

  @ApiOperation({ summary: 'Get comments for a specific champion' })
  @ApiParam({ name: 'championId', description: 'Champion ID' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of comments to return',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid Champion ID' })
  @Get('/champion/:championId')
  async findByChampionId(
    @Param('championId') championId: string,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const pageNumber = page ? parseInt(page, 10) : 1;
    return {
      status: 'success',
      data: await this.commentsService.findByChampionId(
        championId,
        limitNumber,
        pageNumber,
      ),
    };
  }

  @ApiOperation({ summary: 'Get comments for a specific TFT champion' })
  @ApiParam({ name: 'tftChampionId', description: 'TFT Champion ID' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of comments to return',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid TFT Champion ID' })
  @Get('/tft-champion/:tftChampionId')
  async findByTftChampionId(
    @Param('tftChampionId') tftChampionId: string,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const pageNumber = page ? parseInt(page, 10) : 1;
    return {
      status: 'success',
      data: await this.commentsService.findByTftChampionId(
        tftChampionId,
        limitNumber,
        pageNumber,
      ),
    };
  }

  @ApiOperation({ summary: 'Get comments for a specific WR champion' })
  @ApiParam({ name: 'wrChampionId', description: 'Wild Rift Champion ID' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of comments to return',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    type: Number,
  })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid WR Champion ID' })
  @Get('/wr-champion/:wrChampionId')
  async findByWrChampionId(
    @Param('wrChampionId') wrChampionId: string,
    @Query('limit') limit: string,
    @Query('page') page: string,
  ) {
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    const pageNumber = page ? parseInt(page, 10) : 1;
    return {
      status: 'success',
      data: await this.commentsService.findByWrChampionId(
        wrChampionId,
        limitNumber,
        pageNumber,
      ),
    };
  }

  @ApiOperation({ summary: 'Create a new comment for a news article' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('/news/:newsId')
  async createForNews(
    @Param('newsId') newsId: string,
    @Body() dto: CreateCommentDto,
    @Request() req,
  ) {
    const commentData: any = {
      ...dto,
      newsId: new Types.ObjectId(newsId),
      pcBuildId: undefined,
      championId: undefined,
      userId: req.user ? req.user.userId : undefined,
      authorName: req.user ? req.user.name : 'Ẩn danh',
    };
    return {
      status: 'success',
      data: await this.commentsService.create(commentData),
    };
  }

  @ApiOperation({ summary: 'Create a new comment for a PC build' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('/pc-build/:pcBuildId')
  async createForPcBuild(
    @Param('pcBuildId') pcBuildId: string,
    @Body() dto: CreateCommentDto,
    @Request() req,
  ) {
    const commentData: any = {
      ...dto,
      pcBuildId: new Types.ObjectId(pcBuildId),
      newsId: undefined,
      championId: undefined,
      userId: req.user ? req.user.userId : undefined,
      authorName: req.user ? req.user.name : 'Ẩn danh',
    };
    return {
      status: 'success',
      data: await this.commentsService.create(commentData),
    };
  }

  @ApiOperation({ summary: 'Create a new comment for a champion' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('/champion/:championId')
  async createForChampion(
    @Param('championId') championId: string,
    @Body() dto: CreateCommentDto,
    @Request() req,
  ) {
    const commentData: any = {
      ...dto,
      championId: new Types.ObjectId(championId),
      newsId: undefined,
      pcBuildId: undefined,
      userId: req.user ? req.user.userId : undefined,
      authorName: req.user ? req.user.name : 'Ẩn danh',
    };
    return {
      status: 'success',
      data: await this.commentsService.create(commentData),
    };
  }

  @ApiOperation({ summary: 'Create a new comment for a TFT champion' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('/tft-champion/:tftChampionId')
  async createForTftChampion(
    @Param('tftChampionId') tftChampionId: string,
    @Body() dto: CreateCommentDto,
    @Request() req,
  ) {
    const commentData: any = {
      ...dto,
      tftChampionId: new Types.ObjectId(tftChampionId),
      newsId: undefined,
      pcBuildId: undefined,
      championId: undefined,
      userId: req.user ? req.user.userId : undefined,
      authorName: req.user ? req.user.name : 'Ẩn danh',
    };
    return {
      status: 'success',
      data: await this.commentsService.create(commentData),
    };
  }

  @ApiOperation({ summary: 'Create a new comment for a WR champion' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post('/wr-champion/:wrChampionId')
  async createForWrChampion(
    @Param('wrChampionId') wrChampionId: string,
    @Body() dto: CreateCommentDto,
    @Request() req,
  ) {
    const commentData: any = {
      ...dto,
      wrChampionId: new Types.ObjectId(wrChampionId),
      newsId: undefined,
      pcBuildId: undefined,
      championId: undefined,
      tftChampionId: undefined,
      userId: req.user ? req.user.userId : undefined,
      authorName: req.user ? req.user.name : 'Ẩn danh',
    };
    return {
      status: 'success',
      data: await this.commentsService.create(commentData),
    };
  }

  @ApiOperation({ summary: 'Delete comment by ID' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.commentsService.deleteById(id);
    return {
      status: 'success',
      message: 'Comment deleted successfully',
    };
  }
}
