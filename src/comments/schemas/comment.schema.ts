import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  @ApiProperty({
    description: 'Comment ID',
    example: '507f1f77bcf86cd799439011',
  })
  _id: MongooseSchema.Types.ObjectId;

  @ApiProperty({
    description: 'ID of the news article this comment belongs to',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Article', default: null })
  newsId: MongooseSchema.Types.ObjectId | null;

  @ApiProperty({
    description: 'ID of the PC build this comment belongs to',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'PCBuild', default: null })
  pcBuildId: MongooseSchema.Types.ObjectId | null;

  @ApiProperty({
    description: 'ID of the champion this comment belongs to',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Champion', default: null })
  championId: MongooseSchema.Types.ObjectId | null;

  @ApiProperty({ description: 'Name of the author', example: 'John Doe' })
  @Prop({ required: true })
  authorName: string;

  @ApiProperty({
    description: 'Content of the comment',
    example: 'Great article, thanks for sharing!',
  })
  @Prop({ required: true })
  content: string;

  @ApiProperty({
    description: 'User ID if the comment is by a registered user',
    example: '507f1f77bcf86cd799439011',
  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  userId: MongooseSchema.Types.ObjectId;

  @ApiProperty({
    description: 'Date when the comment was created',
    example: '2023-05-25T18:00:00.000Z',
  })
  @Prop({ default: Date.now })
  createdAt: Date;

  @ApiProperty({
    description: 'Whether the comment is approved',
    example: true,
  })
  @Prop({ default: true })
  isApproved: boolean;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
