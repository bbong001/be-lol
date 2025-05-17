import { IsNotEmpty, IsString, IsArray, IsOptional, IsObject, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTftCompDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsMongoId({ each: true })
  champions: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  traits: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  earlyGame?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  midGame?: string[];

  @IsObject()
  @IsOptional()
  itemPriority?: Record<string, string[]>;

  @IsString()
  @IsOptional()
  difficulty?: string;

  @IsString()
  @IsOptional()
  tier?: string;

  @IsString()
  @IsNotEmpty()
  patch: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
} 