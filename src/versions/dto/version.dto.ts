import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum GameType {
  LOL = 'lol',
  TFT = 'tft',
  WILDRIFT = 'wildrift',
}

export class CreateVersionDto {
  @ApiProperty({
    description: 'The game type',
    enum: GameType,
    example: GameType.LOL,
  })
  @IsNotEmpty()
  @IsEnum(GameType)
  game: GameType;

  @ApiProperty({
    description: 'The version number',
    example: '14.15.1',
  })
  @IsNotEmpty()
  @IsString()
  version: string;

  @ApiProperty({
    description: 'When the version was released',
    required: false,
  })
  @IsOptional()
  @IsDate()
  releasedAt?: Date;
}

export class VersionResponseDto {
  @ApiProperty({ example: 'lol' })
  game: string;

  @ApiProperty({ example: '14.15.1' })
  version: string;

  @ApiProperty({ example: '2023-08-15T12:00:00Z' })
  releasedAt?: Date;
}
