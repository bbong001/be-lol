import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class HomeQueryDto {
  @ApiPropertyOptional({
    description: 'Language code for response data',
    enum: ['vi', 'en'],
    example: 'vi',
  })
  @IsOptional()
  @IsIn(['vi', 'en'], { message: 'Language must be either "vi" or "en"' })
  lang?: string = 'vi';
} 