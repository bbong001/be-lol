import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePCBuildDto {
  @ApiProperty({
    example: 'Sens Converter là gì? Công cụ chuyển đổi độ nhạy của chuột',
    description: 'Tiêu đề cấu hình/bài viết',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example:
      'Công cụ giúp chuyển đổi độ nhạy chuột giữa các tựa game FPS khác nhau.',
    description: 'Mô tả ngắn',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: '# Nội dung chi tiết bài viết...',
    description: 'Nội dung chi tiết, hỗ trợ markdown hoặc HTML',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
