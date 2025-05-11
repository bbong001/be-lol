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

  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  async create(@Body() createCommentDto: CreateCommentDto, @Request() req) {
    // If user is authenticated, add userId to the comment
    if (req.user) {
      createCommentDto.userId = req.user.userId;
    }

    return {
      status: 'success',
      data: await this.commentsService.create(createCommentDto),
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
