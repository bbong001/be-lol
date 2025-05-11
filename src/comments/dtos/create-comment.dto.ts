import { IsNotEmpty, IsString, IsMongoId, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class CreateCommentDto {
  @ApiProperty({
    description: 'ID of the news article this comment belongs to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty()
  @IsMongoId()
  newsId: Types.ObjectId;

  @ApiProperty({
    description: 'Name of the author',
    example: 'John Doe',
  })
  @IsNotEmpty()
  @IsString()
  authorName: string;

  @ApiProperty({
    description: 'Content of the comment',
    example: 'Great article, thanks for sharing!',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({
    description: 'User ID if the comment is by a registered user',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsMongoId()
  userId?: Types.ObjectId;
}
