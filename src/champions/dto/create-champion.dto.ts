import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAbilityDto {
  @ApiProperty({ description: 'Ability name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Ability description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Ability image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateChampionDto {
  @ApiProperty({ description: 'Champion name', example: 'Yasuo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Champion ID', example: 'Yasuo' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({
    description: 'Champion title',
    example: 'the Unforgiven',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Champion image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Champion splash image URL' })
  @IsOptional()
  @IsString()
  splashUrl?: string;

  @ApiPropertyOptional({ description: 'Champion stats object' })
  @IsOptional()
  @IsObject()
  stats?: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Champion abilities',
    type: [CreateAbilityDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAbilityDto)
  abilities?: CreateAbilityDto[];

  @ApiPropertyOptional({
    description: 'Champion tags',
    example: ['Fighter', 'Assassin'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Champion counters',
    example: ['Malphite', 'Rammus'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  counters?: string[];

  @ApiPropertyOptional({
    description: 'Champions this champion is strong against',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strongAgainst?: string[];

  @ApiPropertyOptional({ description: 'Recommended runes' })
  @IsOptional()
  @IsArray()
  recommendedRunes?: any[];

  @ApiPropertyOptional({ description: 'Recommended items' })
  @IsOptional()
  @IsArray()
  recommendedItems?: any[];
}
