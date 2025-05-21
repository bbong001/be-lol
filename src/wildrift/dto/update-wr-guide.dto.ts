import { PartialType } from '@nestjs/mapped-types';
import { CreateWrGuideDto } from './create-wr-guide.dto';

export class UpdateWrGuideDto extends PartialType(CreateWrGuideDto) {}
