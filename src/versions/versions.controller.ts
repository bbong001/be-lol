import { Controller, Get, Post, Body } from '@nestjs/common';
import { VersionsService } from './versions.service';
import { CreateVersionDto } from './dto/version.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('versions')
@Controller('api/versions')
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Get('latest')
  @ApiOperation({
    summary: 'Get the latest versions for LoL, TFT, and Wild Rift',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the latest versions for all games',
    schema: {
      example: {
        status: 'success',
        data: {
          lol: '15.10.1',
          tft: '14.4',
          wildrift: '6.1b',
        },
      },
    },
  })
  getLatestVersions() {
    return this.versionsService.getLatestVersions();
  }

  // For admin use - manually update a version
  @Post()
  @ApiOperation({ summary: 'Create a new version record (Admin only)' })
  createVersion(@Body() createVersionDto: CreateVersionDto) {
    return this.versionsService.createVersion(createVersionDto);
  }
}
