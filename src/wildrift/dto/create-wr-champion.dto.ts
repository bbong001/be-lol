import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  ValidateNested,
  IsObject,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

class AbilityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

class SkillDto extends AbilityDto {
  @IsArray()
  @IsNumber({}, { each: true })
  cooldown: number[];

  @IsArray()
  @IsNumber({}, { each: true })
  cost: number[];
}

class AbilitiesDto {
  @IsObject()
  @ValidateNested()
  @Type(() => AbilityDto)
  passive: AbilityDto;

  @IsObject()
  @ValidateNested()
  @Type(() => SkillDto)
  q: SkillDto;

  @IsObject()
  @ValidateNested()
  @Type(() => SkillDto)
  w: SkillDto;

  @IsObject()
  @ValidateNested()
  @Type(() => SkillDto)
  e: SkillDto;

  @IsObject()
  @ValidateNested()
  @Type(() => SkillDto)
  ultimate: SkillDto;
}

class StatsDto {
  @IsNumber()
  @IsNotEmpty()
  health: number;

  @IsNumber()
  @IsNotEmpty()
  healthPerLevel: number;

  @IsNumber()
  @IsNotEmpty()
  mana: number;

  @IsNumber()
  @IsNotEmpty()
  manaPerLevel: number;

  @IsNumber()
  @IsNotEmpty()
  armor: number;

  @IsNumber()
  @IsNotEmpty()
  armorPerLevel: number;

  @IsNumber()
  @IsNotEmpty()
  magicResist: number;

  @IsNumber()
  @IsNotEmpty()
  magicResistPerLevel: number;

  @IsNumber()
  @IsNotEmpty()
  attackDamage: number;

  @IsNumber()
  @IsNotEmpty()
  attackDamagePerLevel: number;

  @IsNumber()
  @IsNotEmpty()
  attackSpeed: number;

  @IsNumber()
  @IsNotEmpty()
  attackSpeedPerLevel: number;

  @IsNumber()
  @IsNotEmpty()
  moveSpeed: number;
}

export class CreateWrChampionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  roles: string[];

  @IsObject()
  @ValidateNested()
  @Type(() => AbilitiesDto)
  abilities: AbilitiesDto;

  @IsObject()
  @ValidateNested()
  @Type(() => StatsDto)
  stats: StatsDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  recommendedItems?: string[];

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  splashUrl?: string;

  @IsString()
  @IsNotEmpty()
  patch: string;
}
