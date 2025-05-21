import { PartialType } from '@nestjs/mapped-types';
import { CreateTftItemDto } from './create-tft-item.dto';

export class UpdateTftItemDto extends PartialType(CreateTftItemDto) {}
