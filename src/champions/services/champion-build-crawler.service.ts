import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { Element } from 'domhandler'
@Injectable()
export class ChampionBuildCrawlerService {
  private readonly logger = new Logger(ChampionBuildCrawlerService.name);

  async crawlChampionBuild(championName: string, position: string = 'top'): Promise<any> {
    try {
      const normalizedChampName = championName.toLowerCase().replace(/\s+/g, '');
      const url = `https://u.gg/lol/champions/${normalizedChampName}/build/${position}`;

      this.logger.log(`Crawling build data from ${url}`);

      const { data } = await axios.get(url);
      const $ = cheerio.load(data);

      return this.extractBuildData($);
    } catch (error) {
      this.logger.error(`Error crawling build data: ${error.message}`);
      throw new Error(`Failed to crawl build data: ${error.message}`);
    }
  }

  private extractBuildData($: cheerio.CheerioAPI): any {
    const tierInfo = {
      tier: $('.volxd-tier').first().text().trim() || 'Unknown',
      winRate: $('.okay-tier').first().text().trim() || 'Unknown',
      rank: $('.champion-recommended-build .flex-1 > div:nth-child(3)').text().trim() || 'Unknown',
      pickRate: $('.champion-recommended-build .flex-1 > div:nth-child(4)').text().trim() || 'Unknown',
      banRate: $('.champion-recommended-build .flex-1 > div:nth-child(5)').text().trim() || 'Unknown',
      matches: $('.champion-recommended-build .flex-1 > div:nth-child(6)').text().trim() || 'Unknown',
    };

    const runes = this.extractRunes($);
    const summonerSpells = $('.summoner-spells img').map((_, el) => $(el).attr('alt')?.replace('Summoner Spell ', '') || '').get();
    const skillOrder = this.extractSkillOrder($);
    const items = this.extractItems($);
    const toughestMatchups = $('#toughest-matchups .champion-matchup').map((_, el) => ({
      championName: $(el).find('.champion-name').text().trim(),
      winRate: $(el).find('.win-rate strong').text().trim(),
      matches: $(el).find('.total-matches').text().trim(),
    })).get();

    return { championInfo: tierInfo, runes, summonerSpells, skillOrder, items, toughestMatchups };
  }

  private extractRunes($: cheerio.CheerioAPI): any {
    const primaryTreeName = $('.rune-tree.primary-tree .perk-style-title .pointer').text().trim();
    const primaryRunesActive = $('.rune-tree.primary-tree .perk-active img').map((_, el) => $(el).attr('alt')?.replace('The Keystone ', '').replace('The Rune ', '') || '').get();

    const secondaryTreeName = $('.secondary-tree .perk-style-title .pointer').text().trim();
    const secondaryRunesActive = $('.secondary-tree .perk-active img').map((_, el) => $(el).attr('alt')?.replace('The Rune ', '') || '').get();

    const statShards = $('.stat-shards-container .shard-active img').map((_, el) => $(el).attr('alt')?.replace('The ', '') || '').get();

    return {
      primaryTree: { name: primaryTreeName, runes: primaryRunesActive },
      secondaryTree: { name: secondaryTreeName, runes: secondaryRunesActive },
      statShards,
    };
  }

  private extractSkillOrder($: cheerio.CheerioAPI): any {
    const skillPriority = $('.skill-priority-path .skill-label').map((_, el) => $(el).text().trim()).get();
    const skillPath: Record<string, string[]> = {};

    $('.skill-order-row').each((_, row) => {
      const skillKey = $(row).find('.skill-label').first().text().trim();
      const levels = $(row).find('.skill-up div').map((_, level) => $(level).text().trim()).get();
      if (skillKey) skillPath[skillKey] = levels;
    });

    return { priority: skillPriority, path: skillPath };
  }

  private extractItems($: cheerio.CheerioAPI): any {
    const parseSpriteItem = (el: Element) => {
      const name = $(el).attr('alt') || 'Unknown item';
      const imageUrl = $(el).attr('src') || '';
      return { name, imageUrl };
    };

    const startingItems = $('.starting-items .item-img img').map((_, el) => parseSpriteItem(el)).get();
    const startingItemsWinRate = $('.starting-items .winrate').text().trim();
    const startingItemsMatches = $('.starting-items .matches').text().trim();

    const coreItems = $('.core-items .sprite').map((_, el) => {
      const bg = $(el).find('div').first().attr('style') || '';
      return { name: 'Sprite Item', imageUrl: bg };
    }).get();
    const coreItemsWinRate = $('.core-items .winrate').text().trim();
    const coreItemsMatches = $('.core-items .matches').text().trim();

    const extractItemOptions = (selector: string) => $(selector).map((_, el) => ({
      name: $(el).find('img').attr('alt') || 'Unknown item',
      imageUrl: $(el).find('img').attr('src') || '',
      winRate: $(el).find('.winrate').text().trim(),
      matches: $(el).find('.matches').text().trim(),
    })).get();

    const fourthItems = extractItemOptions('.item-options-1 .item-option');
    const fifthItems = extractItemOptions('.item-options-2 .item-option');
    const sixthItems = extractItemOptions('.item-options-3 .item-option');

    return {
      starting: { items: startingItems, winRate: startingItemsWinRate, matches: startingItemsMatches },
      core: { items: coreItems, winRate: coreItemsWinRate, matches: coreItemsMatches },
      fourthOptions: fourthItems,
      fifthOptions: fifthItems,
      sixthOptions: sixthItems,
    };
  }
}
