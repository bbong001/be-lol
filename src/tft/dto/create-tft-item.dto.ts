import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsObject,
  IsBoolean,
} from 'class-validator';

export class CreateTftItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  stats?: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  components?: string[];

  @IsBoolean()
  @IsOptional()
  isBasic?: boolean;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsNotEmpty()
  patch: string;
}
