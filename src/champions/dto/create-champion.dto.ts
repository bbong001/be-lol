import {
  IsString,
  IsOptional,
  IsArray,
  IsObject,
  IsNotEmpty,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AbilityDto {
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

class ItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  en?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vi?: string;

  // Nếu không phải là object đa ngôn ngữ thì là string đơn
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;
}

class ItemSetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  items: (string | ItemDto)[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickRate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  winRate?: string;
}

class BootsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ItemDto)
  name: ItemDto | string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickRate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  winRate: string;
}

class SituationalItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => ItemDto)
  name: ItemDto | string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  winRate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  matches: string;
}

class SituationalItemsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SituationalItemDto)
  fourthItems?: SituationalItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SituationalItemDto)
  fifthItems?: SituationalItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SituationalItemDto)
  sixthItems?: SituationalItemDto[];
}

class RecommendedItemsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemSetDto)
  startingItems?: ItemSetDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BootsDto)
  boots?: BootsDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemSetDto)
  coreBuilds?: ItemSetDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => SituationalItemsDto)
  situational?: SituationalItemsDto;
}

class RuneSetDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keystone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  runes?: string[];
}

class RecommendedItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pickRate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  winRate?: string;
}

export class CreateChampionDto {
  @ApiProperty({ description: 'Champion name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Champion unique ID' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({ description: 'Champion title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Champion image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Champion splash art URL' })
  @IsOptional()
  @IsString()
  splashUrl?: string;

  @ApiPropertyOptional({ description: 'Champion stats' })
  @IsOptional()
  @IsObject()
  stats?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Champion abilities' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AbilityDto)
  abilities?: AbilityDto[];

  @ApiPropertyOptional({ description: 'Champion tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Champion counters' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  counters?: string[];

  @ApiPropertyOptional({ description: 'Champions this champion is strong against', })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  strongAgainst?: string[];

  @ApiPropertyOptional({ description: 'Language' })
  @IsOptional()
  @IsString()
  lang?: string;

  @ApiPropertyOptional({ description: 'Recommended runes' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuneSetDto)
  recommendedRunes?: RuneSetDto[];

  @ApiPropertyOptional({ description: 'Recommended items' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecommendedItemDto)
  recommendedItems?: RecommendedItemDto[];
}
