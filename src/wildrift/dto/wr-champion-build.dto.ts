import { ApiProperty } from '@nestjs/swagger';

export class WrBuildItemDto {
  @ApiProperty({ description: 'Item name' })
  name: string;

  @ApiProperty({ description: 'Item image URL' })
  imageUrl: string;
}

export class WrBuildSpellDto {
  @ApiProperty({ description: 'Spell name' })
  name: string;

  @ApiProperty({ description: 'Spell image URL' })
  imageUrl: string;
}

export class WrBuildRuneDto {
  @ApiProperty({ description: 'Rune name' })
  name: string;

  @ApiProperty({ description: 'Rune image URL' })
  imageUrl: string;
}

export class WrChampionBuildDto {
  @ApiProperty({ description: 'Champion ID' })
  championId: string;

  @ApiProperty({ description: 'Starting items' })
  startingItems: WrBuildItemDto[];

  @ApiProperty({ description: 'Core items for the build' })
  coreItems: WrBuildItemDto[];

  @ApiProperty({ description: 'Final build items' })
  finalBuildItems: WrBuildItemDto[];

  @ApiProperty({ description: 'Boot options' })
  boots: WrBuildItemDto[];

  @ApiProperty({ description: 'Boot enchantments' })
  enchantments: WrBuildItemDto[];

  @ApiProperty({ description: 'Situational items' })
  situationalItems: WrBuildItemDto[];

  @ApiProperty({ description: 'Summoner spells' })
  spells: WrBuildSpellDto[];

  @ApiProperty({ description: 'Selected runes' })
  runes: WrBuildRuneDto[];

  @ApiProperty({ description: 'Situational runes' })
  situationalRunes: WrBuildRuneDto[];

  @ApiProperty({ description: 'Skill order' })
  skillOrder: string[];

  @ApiProperty({ description: 'Build title or type (e.g. "Solo Lane Build")' })
  buildType: string;

  @ApiProperty({ description: 'Build source URL' })
  sourceUrl: string;
}
