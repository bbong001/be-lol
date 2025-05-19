import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PcBuildController } from './pc-build.controller';
import { PcBuildService } from './pc-build.service';
import { PCComponent, PCComponentSchema } from './schemas/pc-component.schema';
import { PCBuild, PCBuildSchema } from './schemas/pc-build.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PCComponent.name, schema: PCComponentSchema },
      { name: PCBuild.name, schema: PCBuildSchema },
    ]),
  ],
  controllers: [PcBuildController],
  providers: [PcBuildService],
  exports: [PcBuildService],
})
export class PcBuildModule {}
