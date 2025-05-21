import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from './schemas/comment.schema';
import { CreateCommentDto } from './dtos/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async findAll(
    limit = 10,
    page = 1,
    newsId?: string,
    pcBuildId?: string,
    championId?: string,
    tftChampionId?: string,
    wrChampionId?: string,
  ): Promise<{ comments: Comment[]; total: number }> {
    const filter: any = {};
    if (newsId) filter.newsId = newsId;
    if (pcBuildId) filter.pcBuildId = pcBuildId;
    if (championId) filter.championId = championId;
    if (tftChampionId) filter.tftChampionId = tftChampionId;
    if (wrChampionId) filter.wrChampionId = wrChampionId;
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.commentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.commentModel.countDocuments(filter),
    ]);

    return { comments, total };
  }

  async findById(id: string): Promise<Comment> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid comment ID');
    }

    const comment = await this.commentModel.findById(id).lean();
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }

    return comment;
  }

  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    const comment = new this.commentModel(createCommentDto);
    return comment.save();
  }

  async findByNewsId(
    newsId: string,
    limit = 10,
    page = 1,
  ): Promise<{ comments: Comment[]; total: number }> {
    return this.findAll(limit, page, newsId, undefined, undefined);
  }

  async findByPcBuildId(
    pcBuildId: string,
    limit = 10,
    page = 1,
  ): Promise<{ comments: Comment[]; total: number }> {
    return this.findAll(limit, page, undefined, pcBuildId, undefined);
  }

  async findByChampionId(
    championId: string,
    limit = 10,
    page = 1,
  ): Promise<{ comments: Comment[]; total: number }> {
    return this.findAll(limit, page, undefined, undefined, championId);
  }

  async findByTftChampionId(
    tftChampionId: string,
    limit = 10,
    page = 1,
  ): Promise<{ comments: Comment[]; total: number }> {
    return this.findAll(
      limit,
      page,
      undefined,
      undefined,
      undefined,
      tftChampionId,
    );
  }

  async findByWrChampionId(
    wrChampionId: string,
    limit = 10,
    page = 1,
  ): Promise<{ comments: Comment[]; total: number }> {
    return this.findAll(
      limit,
      page,
      undefined,
      undefined,
      undefined,
      undefined,
      wrChampionId,
    );
  }

  async deleteById(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid comment ID');
    }

    const result = await this.commentModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
  }
}
