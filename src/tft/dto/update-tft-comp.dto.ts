import { PartialType } from '@nestjs/mapped-types';
import { CreateTftCompDto } from './create-tft-comp.dto';

export class UpdateTftCompDto extends PartialType(CreateTftCompDto) {}
