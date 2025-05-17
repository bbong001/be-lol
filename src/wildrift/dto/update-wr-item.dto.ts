import { PartialType } from '@nestjs/mapped-types';
import { CreateWrItemDto } from './create-wr-item.dto';

export class UpdateWrItemDto extends PartialType(CreateWrItemDto) {} 