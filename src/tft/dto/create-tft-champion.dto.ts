import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecommendedItemData } from '../schemas/tft-champion.schema';

class ChampionStatsDto {
  @IsString()
  @IsOptional()
  health?: string;

  @IsString()
  @IsOptional()
  mana?: string;

  @IsString()
  @IsOptional()
  armor?: string;

  @IsString()
  @IsOptional()
  magicResist?: string;

  @IsString()
  @IsOptional()
  dps?: string;

  @IsString()
  @IsOptional()
  damage?: string;

  @IsString()
  @IsOptional()
  attackSpeed?: string;

  @IsString()
  @IsOptional()
  critRate?: string;

  @IsString()
  @IsOptional()
  range?: string;
}

class AbilityDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  mana?: string;
}

class RecommendedItemDataDto implements RecommendedItemData {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}

export class CreateTftChampionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  cost: number;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  traits: string[];

  @IsObject()
  @ValidateNested()
  @Type(() => AbilityDto)
  @IsOptional()
  ability?: AbilityDto;

  @IsObject()
  @ValidateNested()
  @Type(() => ChampionStatsDto)
  @IsOptional()
  stats?: ChampionStatsDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  recommendedItems?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecommendedItemDataDto)
  @IsOptional()
  recommendedItemsData?: RecommendedItemDataDto[];

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsNotEmpty()
  patch: string;

  @IsNumber()
  @IsOptional()
  setNumber?: number;
}
