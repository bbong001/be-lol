import { PartialType } from '@nestjs/mapped-types';
import { CreateWrChampionDto } from './create-wr-champion.dto';

export class UpdateWrChampionDto extends PartialType(CreateWrChampionDto) {} 