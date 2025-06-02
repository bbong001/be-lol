import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CounterRelationDto {
  @ApiProperty({
    description: 'Champion ID',
  })
  @IsString()
  championId: string;

  @ApiProperty({
    description: 'Champion name',
  })
  @IsString()
  championName: string;

  @ApiProperty({
    description: 'Win rate percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  winRate: number;

  @ApiProperty({
    description: 'Counter rating (0-10)',
    minimum: 0,
    maximum: 10,
  })
  @IsNumber()
  @Min(0)
  @Max(10)
  counterRating: number;

  @ApiProperty({
    description: 'Number of games played',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  gameCount: number;

  @ApiPropertyOptional({
    description: 'Gold differential at 15 minutes (can be negative)',
  })
  @IsNumber()
  @IsOptional()
  goldDifferentialAt15?: number;

  @ApiPropertyOptional({
    description: 'Difficulty level',
    enum: ['Easy', 'Medium', 'Hard'],
  })
  @IsString()
  @IsOptional()
  difficulty?: string;

  @ApiPropertyOptional({
    description: 'Tips for playing against this champion',
  })
  @IsString()
  @IsOptional()
  tips?: string;

  @ApiPropertyOptional({
    description: 'Patch version',
    example: '15.10',
  })
  @IsString()
  @IsOptional()
  patch?: string;

  @ApiPropertyOptional({
    description: 'Rank tier',
    example: 'Emerald+',
  })
  @IsString()
  @IsOptional()
  rank?: string;

  @ApiPropertyOptional({
    description: 'Champion image URL',
    example: 'https://kicdo.com/images/champions/aatrox.jpg',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class CreateCounterDto {
  @ApiProperty({
    description: 'Champion ID',
  })
  @IsString()
  championId: string;

  @ApiProperty({
    description: 'Champion name',
  })
  @IsString()
  championName: string;

  @ApiProperty({
    description: 'Role',
    enum: ['jungle', 'top', 'mid', 'adc', 'support'],
  })
  @IsString()
  role: string;

  @ApiPropertyOptional({
    description: 'Overall win rate percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  overallWinRate?: number;

  @ApiPropertyOptional({
    description: 'Pick rate percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  pickRate?: number;

  @ApiPropertyOptional({
    description: 'Ban rate percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  banRate?: number;

  @ApiPropertyOptional({
    description: 'Champions that this champion is strong against',
    type: [CounterRelationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CounterRelationDto)
  @IsOptional()
  strongAgainst?: CounterRelationDto[];

  @ApiPropertyOptional({
    description: 'Champions that are strong against this champion',
    type: [CounterRelationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CounterRelationDto)
  @IsOptional()
  weakAgainst?: CounterRelationDto[];

  @ApiPropertyOptional({
    description: 'Best early game counters (based on GD@15)',
    type: [CounterRelationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CounterRelationDto)
  @IsOptional()
  bestLaneCounters?: CounterRelationDto[];

  @ApiPropertyOptional({
    description: 'Worst early game matchups',
    type: [CounterRelationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CounterRelationDto)
  @IsOptional()
  worstLaneCounters?: CounterRelationDto[];

  @ApiPropertyOptional({
    description: 'Patch version',
    example: '15.10',
  })
  @IsString()
  @IsOptional()
  patch?: string;

  @ApiPropertyOptional({
    description: 'Rank tier',
    example: 'Emerald+',
  })
  @IsString()
  @IsOptional()
  rank?: string;

  @ApiPropertyOptional({
    description: 'Region',
    example: 'World',
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({
    description:
      'Formatted HTML content for display (champion weaknesses, strategies, detailed tips)',
    example:
      '<h3>Điểm yếu chí mạng của Briar?</h3><p>Dù sở hữu lượng hồi phục "trâu bò", Briar vẫn có những điểm yếu cố hữu...</p>',
  })
  @IsString()
  @IsOptional()
  formattedContent?: string;

  @ApiPropertyOptional({
    description: 'Điểm yếu chí mạng của champion',
    example:
      '<p>Dù sở hữu lượng hồi phục "trâu bò", Briar vẫn có những điểm yếu cố hữu:</p><ul><li>Dễ bị thả diều...</li></ul>',
  })
  @IsString()
  @IsOptional()
  weaknessesContent?: string;

  @ApiPropertyOptional({
    description: 'Trang bị khắc chế "cứng" champion',
    example:
      '<ul><li><strong>Giáp Gai:</strong> Hiệu ứng phản sát thương...</li></ul>',
  })
  @IsString()
  @IsOptional()
  counterItemsContent?: string;

  @ApiPropertyOptional({
    description: 'Chiến thuật đối đầu "cao tay"',
    example:
      '<ul><li><strong>Chọn tướng cơ động:</strong> Hãy ưu tiên các vị tướng như Vayne...</li></ul>',
  })
  @IsString()
  @IsOptional()
  strategiesContent?: string;

  @ApiPropertyOptional({
    description: 'Các lời khuyên bổ sung',
    example:
      '<ul><li>Tập trung hạ gục Briar trước khi cô ta kịp hồi phục với nội tại.</li></ul>',
  })
  @IsString()
  @IsOptional()
  additionalTipsContent?: string;

  @ApiPropertyOptional({
    description: 'Additional structured data (item builds, runes, etc.)',
    type: 'object',
  })
  @IsOptional()
  additionalData?: {
    matchupDetails?: any;
    itemBuildRecommendations?: any;
    runeRecommendations?: any;
    skillOrder?: any;
    playStyle?: string;
    lanePhase?: any;
    teamFight?: any;
  };
}

export class UpdateCounterDto {
  @ApiPropertyOptional({
    description: 'Overall win rate percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  overallWinRate?: number;

  @ApiPropertyOptional({
    description: 'Pick rate percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  pickRate?: number;

  @ApiPropertyOptional({
    description: 'Ban rate percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  banRate?: number;

  @ApiPropertyOptional({
    description: 'Champions that this champion is strong against',
    type: [CounterRelationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CounterRelationDto)
  @IsOptional()
  strongAgainst?: CounterRelationDto[];

  @ApiPropertyOptional({
    description: 'Champions that are strong against this champion',
    type: [CounterRelationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CounterRelationDto)
  @IsOptional()
  weakAgainst?: CounterRelationDto[];

  @ApiPropertyOptional({
    description: 'Best early game counters (based on GD@15)',
    type: [CounterRelationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CounterRelationDto)
  @IsOptional()
  bestLaneCounters?: CounterRelationDto[];

  @ApiPropertyOptional({
    description: 'Worst early game matchups',
    type: [CounterRelationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CounterRelationDto)
  @IsOptional()
  worstLaneCounters?: CounterRelationDto[];

  @ApiPropertyOptional({
    description: 'Patch version',
    example: '15.10',
  })
  @IsString()
  @IsOptional()
  patch?: string;

  @ApiPropertyOptional({
    description: 'Rank tier',
    example: 'Emerald+',
  })
  @IsString()
  @IsOptional()
  rank?: string;

  @ApiPropertyOptional({
    description: 'Region',
    example: 'World',
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({
    description:
      'Formatted HTML content for display (champion weaknesses, strategies, detailed tips)',
    example:
      '<h3>Điểm yếu chí mạng của Briar?</h3><p>Dù sở hữu lượng hồi phục "trâu bò", Briar vẫn có những điểm yếu cố hữu...</p>',
  })
  @IsString()
  @IsOptional()
  formattedContent?: string;

  @ApiPropertyOptional({
    description: 'Điểm yếu chí mạng của champion',
    example:
      '<p>Dù sở hữu lượng hồi phục "trâu bò", Briar vẫn có những điểm yếu cố hữu:</p><ul><li>Dễ bị thả diều...</li></ul>',
  })
  @IsString()
  @IsOptional()
  weaknessesContent?: string;

  @ApiPropertyOptional({
    description: 'Trang bị khắc chế "cứng" champion',
    example:
      '<ul><li><strong>Giáp Gai:</strong> Hiệu ứng phản sát thương...</li></ul>',
  })
  @IsString()
  @IsOptional()
  counterItemsContent?: string;

  @ApiPropertyOptional({
    description: 'Chiến thuật đối đầu "cao tay"',
    example:
      '<ul><li><strong>Chọn tướng cơ động:</strong> Hãy ưu tiên các vị tướng như Vayne...</li></ul>',
  })
  @IsString()
  @IsOptional()
  strategiesContent?: string;

  @ApiPropertyOptional({
    description: 'Các lời khuyên bổ sung',
    example:
      '<ul><li>Tập trung hạ gục Briar trước khi cô ta kịp hồi phục với nội tại.</li></ul>',
  })
  @IsString()
  @IsOptional()
  additionalTipsContent?: string;

  @ApiPropertyOptional({
    description: 'Additional structured data (item builds, runes, etc.)',
    type: 'object',
  })
  @IsOptional()
  additionalData?: {
    matchupDetails?: any;
    itemBuildRecommendations?: any;
    runeRecommendations?: any;
    skillOrder?: any;
    playStyle?: string;
    lanePhase?: any;
    teamFight?: any;
  };
}

export class CounterQueryDto {
  @ApiPropertyOptional({
    description: 'Champion ID to get counters for',
  })
  @IsString()
  @IsOptional()
  championId?: string;

  @ApiPropertyOptional({
    description: 'Champion name to get counters for',
  })
  @IsString()
  @IsOptional()
  championName?: string;

  @ApiPropertyOptional({
    description: 'Role to filter by',
    enum: ['jungle', 'top', 'mid', 'adc', 'support'],
  })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({
    description: 'Patch version to filter by',
    example: '15.10',
  })
  @IsString()
  @IsOptional()
  patch?: string;

  @ApiPropertyOptional({
    description: 'Rank tier to filter by',
    example: 'Emerald+',
  })
  @IsString()
  @IsOptional()
  rank?: string;

  @ApiPropertyOptional({
    description: 'Region to filter by',
    example: 'World',
  })
  @IsString()
  @IsOptional()
  region?: string;

  @ApiPropertyOptional({
    description: 'Limit number of results',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Skip number of results for pagination',
    minimum: 0,
    default: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  skip?: number = 0;
}
