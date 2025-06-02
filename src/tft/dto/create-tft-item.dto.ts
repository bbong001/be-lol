import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsOptional,
  IsObject,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MultilingualText } from '../schemas/tft-item.schema';

class MultilingualTextDto implements MultilingualText {
  @IsString()
  @IsNotEmpty()
  en: string;

  @IsString()
  @IsNotEmpty()
  vi: string;
}

export class CreateTftItemDto {
  @IsObject()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  @IsNotEmpty()
  name: MultilingualText;

  @IsObject()
  @ValidateNested()
  @Type(() => MultilingualTextDto)
  @IsOptional()
  description?: MultilingualText;

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

  @IsString()
  @IsOptional()
  lang?: string;
}
