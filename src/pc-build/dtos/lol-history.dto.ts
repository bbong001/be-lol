import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LolHistoryQueryDto {
  @ApiProperty({ example: 'Hỗn độn ma thần', description: 'Tên người chơi' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'vn2', description: 'Tag server hoặc mã định danh' })
  @IsString()
  tag: string;
} 