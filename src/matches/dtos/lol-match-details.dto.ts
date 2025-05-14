import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LolMatchDetailsParamDto {
  @ApiProperty({
    description: 'Match path (e.g., /vn/match/vn/876142021#participant4)',
    example: '/vn/match/vn/876142021#participant4',
  })
  @IsString()
  @IsNotEmpty()
  matchPath: string;
}
