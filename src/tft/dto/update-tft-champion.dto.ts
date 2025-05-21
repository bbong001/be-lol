import { PartialType } from '@nestjs/mapped-types';
import { CreateTftChampionDto } from './create-tft-champion.dto';

export class UpdateTftChampionDto extends PartialType(CreateTftChampionDto) {}
