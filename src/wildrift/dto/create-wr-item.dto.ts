import { IsNotEmpty, IsString, IsArray, IsOptional, IsObject, IsNumber, IsBoolean } from 'class-validator';

export class CreateWrItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  stats?: Record<string, any>;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  buildsFrom?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  buildsInto?: string[];

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  activeDescription?: string;

  @IsNumber()
  @IsOptional()
  cooldown?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsNotEmpty()
  patch: string;
} 