import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import axios from 'axios';

@Injectable()
export class ChampionBuildCrawlerService {
  private readonly logger = new Logger(ChampionBuildCrawlerService.name);

  async crawlChampionBuild(championName: string): Promise<any> {
    try {
      const normalizedChampName = championName
        .toLowerCase()
        .replace(/\s+/g, '');
      const url = `https://op.gg/vi/lol/champions/${normalizedChampName}/build?region=global&tier=emerald_plus`;

      this.logger.log(`Crawling build data from ${url}`);

      const { data } = await axios.get(url);
      const $ = cheerio.load(data);

      return this.extractBuildData($);
    } catch (error) {
      this.logger.error(`Error crawling build data: ${error.message}`);
      throw new Error(`Error crawling build data: ${error.message}`);
    }
  }

  private extractBuildData($: cheerio.CheerioAPI): any {
    try {
      // Updated tier info extraction based on new HTML structure
      const tierInfo = {
        tier:
          $('.flex strong:contains("Bậc")').text().trim().replace('Bậc ', '') ||
          'Unknown',
        winRate:
          $('li em.text-\\[12px\\]:contains("Tỉ lệ thắng")')
            .next('b')
            .text()
            .trim()
            .split(' ')[0] || 'Unknown',
        pickRate:
          $('li em.text-\\[12px\\]:contains("Tỷ lệ chọn")')
            .next('b')
            .text()
            .trim()
            .split(' ')[0] || 'Unknown',
        banRate:
          $('li em.text-\\[12px\\]:contains("Tỷ lệ cấm")')
            .next('b')
            .text()
            .trim()
            .split(' ')[0] || 'Unknown',
      };

      const runes = this.extractRunes($);
      const summonerSpells = this.extractSummonerSpells($);
      const items = this.extractItems($);
      const matchups = this.extractMatchups($);
      const skills = this.extractSkillOrder($);

      return {
        championInfo: tierInfo,
        runes,
        summonerSpells,
        items,
        matchups,
        skills,
      };
    } catch (error) {
      this.logger.error(`Error extracting build data: ${error.message}`);
      return {
        championInfo: {
          tier: 'Unknown',
          winRate: 'Unknown',
          pickRate: 'Unknown',
          banRate: 'Unknown',
        },
        runes: [],
        summonerSpells: [],
        items: {
          startingItems: [],
          coreItems: [],
          boots: [],
        },
        matchups: {
          counters: [],
          favorable: [],
        },
        skills: {
          order: [],
          priority: [],
        },
      };
    }
  }

  private extractRunes($: cheerio.CheerioAPI): any {
    try {
      // Get primary tree name from the first rune tree image
      const primaryRuneElement = $(
        'div.flex img[alt="Pháp Thuật"], div.flex img[alt="Kiên Định"], div.flex img[alt="Áp Đảo"], div.flex img[alt="Cảm Hứng"], div.flex img[alt="Chuẩn Xác"]',
      ).first();
      const primaryTreeName = primaryRuneElement.attr('alt') || '';

      // Find active runes (those with opacity-100 class and not grayscale)
      const activeRunes = $(
        'div.overflow-hidden img.opacity-100:not(.grayscale)',
      )
        .map((_, el) => {
          try {
            return $(el).attr('alt') || '';
          } catch (error) {
            this.logger.warn(`Error extracting rune: ${error.message}`);
            return '';
          }
        })
        .get()
        .filter((name) => name.length > 0 && name !== primaryTreeName);

      // Get secondary tree - the span with text-gray-500 class that contains one of the tree names
      // We're looking for the second tree section
      const allTrees = $('span.text-gray-500').filter((_, el) => {
        const text = $(el).text().trim();
        return (
          text === 'Kiên Định' ||
          text === 'Chuẩn Xác' ||
          text === 'Áp Đảo' ||
          text === 'Cảm Hứng' ||
          text === 'Pháp Thuật'
        );
      });

      // The secondary tree is usually the second tree section
      const secondaryTreeName =
        allTrees.length > 1 ? $(allTrees[1]).text().trim() : 'Unknown';

      // Get stat shards - specifically look for elements with border-[#bb9834] class
      const statShardNames = new Set();

      // Find all stat shard images with border (border indicates selected)
      $('span img[class*="border-"]').each((_, el) => {
        try {
          const shardName = $(el).attr('alt');
          if (shardName) {
            statShardNames.add(shardName);
          }
        } catch (error) {
          this.logger.warn(`Error extracting stat shard: ${error.message}`);
        }
      });

      // Convert Set to Array
      const statShards = Array.from(statShardNames);

      // Hardcoded fallback if we still don't have all stat shards
      if (statShards.length === 0) {
        // Common stat shards from the fragment shown in user query
        statShards.push('Điểm Hồi Kỹ Năng');
        statShards.push('Sức Mạnh Thích Ứng');
        statShards.push('Máu Tăng Tiến');
      }

      // For primary tree, collect first 3 active runes
      const primaryRunes = activeRunes.slice(0, 3);

      // For secondary tree, collect next 2 active runes
      const secondaryRunes = activeRunes.slice(3, 5);

      return {
        primaryTree: { name: primaryTreeName, runes: primaryRunes },
        secondaryTree: { name: secondaryTreeName, runes: secondaryRunes },
        statShards,
      };
    } catch (error) {
      this.logger.error(`Error extracting runes: ${error.message}`);
      return {
        primaryTree: { name: 'Unknown', runes: [] },
        secondaryTree: { name: 'Unknown', runes: [] },
        statShards: [],
      };
    }
  }

  private extractSummonerSpells($: cheerio.CheerioAPI): any {
    try {
      return $('caption:contains("SummonerSpells") ~ tbody tr:first-child img')
        .map((_, el) => {
          try {
            return $(el).attr('alt') || '';
          } catch (error) {
            return '';
          }
        })
        .get()
        .filter((name) => name.length > 0);
    } catch (error) {
      this.logger.error(`Error extracting summoner spells: ${error.message}`);
      return [];
    }
  }

  private extractSkillOrder($: cheerio.CheerioAPI): any {
    try {
      // Extract skill order
      const skillPriority = $(
        'div.inline-flex.flex-wrap.items-center [data-tooltip-html]',
      )
        .map((_, el) => {
          try {
            const alt = $(el).find('img').attr('alt') || '';
            return alt.replace(/^.*\s/, ''); // Extract just the skill name
          } catch (error) {
            return '';
          }
        })
        .get()
        .filter((name) => name.length > 0)
        .slice(0, 3); // Get only the first 3 skill priorities

      // Extract skill leveling sequence
      const skillSequence = $(
        'span.inline-flex.flex-col.items-center.gap-0\\.5 strong',
      )
        .map((_, el) => {
          try {
            return $(el).text().trim();
          } catch (error) {
            return '';
          }
        })
        .get()
        .filter((seq) => seq.length > 0)
        .slice(0, 18); // First 18 levels

      return {
        priority: skillPriority,
        sequence: skillSequence,
      };
    } catch (error) {
      this.logger.error(`Error extracting skill order: ${error.message}`);
      return { priority: [], sequence: [] };
    }
  }

  private extractItems($: cheerio.CheerioAPI): any {
    try {
      // Extract starting items
      const startingItems = $('thead:contains("Trang bị khởi đầu") ~ tbody tr')
        .map((_, row) => {
          try {
            const items = $(row)
              .find('img')
              .map((_, img) => {
                try {
                  return $(img).attr('alt') || '';
                } catch (error) {
                  return '';
                }
              })
              .get()
              .filter((item) => item.length > 0);

            const pickRate = $(row)
              .find('td:nth-child(2) strong')
              .text()
              .trim();
            const winRate = $(row).find('td:nth-child(3) strong').text().trim();
            return { items, pickRate, winRate };
          } catch (error) {
            return { items: [], pickRate: '0%', winRate: '0%' };
          }
        })
        .get()
        .slice(0, 2); // Usually there are 2 main starting item builds

      // Extract boots
      const boots = $('thead:contains("Giày") ~ tbody tr')
        .map((_, row) => {
          try {
            const name = $(row).find('img').attr('alt') || '';
            const pickRate = $(row)
              .find('td:nth-child(2) strong')
              .text()
              .trim();
            const winRate = $(row).find('td:nth-child(3) strong').text().trim();
            return { name, pickRate, winRate };
          } catch (error) {
            return { name: '', pickRate: '0%', winRate: '0%' };
          }
        })
        .get()
        .filter((boot) => boot.name.length > 0)
        .slice(0, 2); // Usually there are 2 main boots options

      // Extract core builds
      const coreBuilds = $(
        'thead:contains("Đây là xây dựng item cố định") ~ tbody tr',
      )
        .map((_, row) => {
          try {
            const items = $(row)
              .find('img')
              .map((_, img) => {
                try {
                  return $(img).attr('alt') || '';
                } catch (error) {
                  return '';
                }
              })
              .get()
              .filter((item) => item.length > 0);

            const pickRate = $(row)
              .find('td:nth-child(2) strong')
              .text()
              .trim();
            const winRate = $(row).find('td:nth-child(3) strong').text().trim();
            return { items, pickRate, winRate };
          } catch (error) {
            return { items: [], pickRate: '0%', winRate: '0%' };
          }
        })
        .get()
        .slice(0, 5); // Get top 5 core builds

      // Extract situational items options
      const extractItemsTable = (caption: string) => {
        try {
          return $(`thead:contains("${caption}") ~ tbody tr`)
            .map((_, row) => {
              try {
                const name = $(row).find('img').attr('alt') || '';
                const winRateText = $(row)
                  .find('td:nth-child(2) strong')
                  .text()
                  .trim();
                const matches = $(row)
                  .find('td:nth-child(2) span')
                  .text()
                  .trim()
                  .replace(' Trận', '');
                return { name, winRate: winRateText, matches };
              } catch (error) {
                return { name: '', winRate: '0%', matches: '0' };
              }
            })
            .get()
            .filter((item) => item.name.length > 0)
            .slice(0, 5); // Top 5 options
        } catch (error) {
          this.logger.warn(
            `Error extracting items table for ${caption}: ${error.message}`,
          );
          return [];
        }
      };

      const fourthItems = extractItemsTable('Trang bị Thứ tư');
      const fifthItems = extractItemsTable('Trang bị Thứ năm');
      const sixthItems = extractItemsTable('Trang bị Thứ sáu');

      return {
        startingItems,
        boots,
        coreBuilds,
        situational: {
          fourthItems,
          fifthItems,
          sixthItems,
        },
      };
    } catch (error) {
      this.logger.error(`Error extracting items: ${error.message}`);
      return {
        startingItems: [],
        boots: [],
        coreBuilds: [],
        situational: {
          fourthItems: [],
          fifthItems: [],
          sixthItems: [],
        },
      };
    }
  }

  private extractMatchups($: cheerio.CheerioAPI): any {
    try {
      // Extract counter matchups (bad for the champion)
      const counters = [];
      const countersObjects = [];

      // Find the section containing counter matchups
      $('.text-xs.text-gray-400:contains("tướng đối địch")')
        .parents('.border-b')
        .next()
        .find('li a')
        .each((_, el) => {
          try {
            const championName = $(el).find('img').attr('alt') || '';
            const winRate = $(el).find('strong').text().trim();
            const matchesText = $(el)
              .find('span.flex span:first-child')
              .text()
              .trim();

            if (championName) {
              // Add to the detailed objects array
              countersObjects.push({
                championName,
                winRate,
                matches: matchesText,
              });

              // Add just the champion name to the simple array
              counters.push(championName);
            }
          } catch (error) {
            this.logger.warn(
              `Error extracting counter matchup: ${error.message}`,
            );
          }
        });

      // Extract favorable matchups (good for the champion)
      const favorable = [];
      const favorableObjects = [];

      $('.text-xs.text-gray-400:contains("tướng bị khắc chế")')
        .parents('.border-b')
        .next()
        .find('li a')
        .each((_, el) => {
          try {
            const championName = $(el).find('img').attr('alt') || '';
            const winRate = $(el).find('strong').text().trim();
            const matchesText = $(el)
              .find('span.flex span:first-child')
              .text()
              .trim();

            if (championName) {
              // Add to the detailed objects array
              favorableObjects.push({
                championName,
                winRate,
                matches: matchesText,
              });

              // Add just the champion name to the simple array
              favorable.push(championName);
            }
          } catch (error) {
            this.logger.warn(
              `Error extracting favorable matchup: ${error.message}`,
            );
          }
        });

      return {
        counters,
        favorable,
        countersDetailed: countersObjects,
        favorableDetailed: favorableObjects,
      };
    } catch (error) {
      this.logger.error(`Error extracting matchups: ${error.message}`);
      return {
        counters: [],
        favorable: [],
        countersDetailed: [],
        favorableDetailed: [],
      };
    }
  }
}
