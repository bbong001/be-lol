import { IsNotEmpty, IsString, IsArray, IsOptional, IsObject, IsMongoId, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SkillOrderDto {
  @IsString()
  @IsNotEmpty()
  first: string;

  @IsString()
  @IsNotEmpty()
  second: string;

  @IsString()
  @IsNotEmpty()
  third: string;

  @IsString()
  @IsNotEmpty()
  ultimate: string;
}

export class CreateWrGuideDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsMongoId()
  @IsNotEmpty()
  championId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  recommendedItems: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  recommendedRunes: string[];

  @IsObject()
  @ValidateNested()
  @Type(() => SkillOrderDto)
  skillOrder: SkillOrderDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  counters?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  synergies?: string[];

  @IsString()
  @IsOptional()
  difficulty?: string;

  @IsString()
  @IsNotEmpty()
  authorName: string;

  @IsString()
  @IsNotEmpty()
  patch: string;
} 