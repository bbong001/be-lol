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
import {
  RecommendedItemData,
  MultilingualText,
  ChampionAbility,
  ChampionStats,
} from '../schemas/tft-champion.schema';

class MultilingualTextDto implements MultilingualText {
  @IsString()
  @IsNotEmpty()
  en: string;

  @IsString()
  @IsNotEmpty()
  vi: string;
}

class ChampionStatsDto implements ChampionStats {
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

class AbilityDto implements ChampionAbility {
  @IsObject()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  @IsOptional()
  name?: MultilingualText;

  @IsObject()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  @IsOptional()
  description?: MultilingualText;

  @IsString()
  @IsOptional()
  mana?: string;
}

class RecommendedItemDataDto implements RecommendedItemData {
  @IsObject()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  @IsNotEmpty()
  name: MultilingualText;

  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}

export class CreateTftChampionDto {
  @IsObject()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  @IsNotEmpty()
  name: MultilingualText;

  @IsNumber()
  @IsNotEmpty()
  cost: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MultilingualTextDto)
  @IsNotEmpty()
  traits: MultilingualText[];

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
  @ValidateNested({ each: true })
  @Type(() => MultilingualTextDto)
  @IsOptional()
  recommendedItems?: MultilingualTextDto[];

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

  @IsString()
  @IsOptional()
  lang?: string;
}
