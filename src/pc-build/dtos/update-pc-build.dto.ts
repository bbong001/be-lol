import { PartialType } from '@nestjs/swagger';
import { CreatePCBuildDto } from './create-pc-build.dto';

export class UpdatePCBuildDto extends PartialType(CreatePCBuildDto) {}
