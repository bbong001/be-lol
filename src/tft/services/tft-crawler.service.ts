import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TftChampion } from '../schemas/tft-champion.schema';
import { TftItem } from '../schemas/tft-item.schema';
import * as cheerio from 'cheerio';
import axios from 'axios';

@Injectable()
export class TftCrawlerService {
  private readonly logger = new Logger(TftCrawlerService.name);

  constructor(
    @InjectModel(TftChampion.name) private tftChampionModel: Model<TftChampion>,
    @InjectModel(TftItem.name) private tftItemModel: Model<TftItem>,
  ) {}

  /**
   * Crawls TFT champions data from tftactics.gg
   */
  async crawlChampions(): Promise<any[]> {
    try {
      const url = 'https://tftactics.gg/champions/';
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const champions = [];

      // Select all champion items from the characters list
      $('.characters-list .characters-item').each((i, el) => {
        const name = $(el).find('.character-name').text().trim();
        const imageUrl = $(el).find('.character-icon').attr('src');
        const cost = this.getCostFromClass($(el).attr('class'));
        const set = this.getSetFromClass($(el).attr('class'));
        
        champions.push({
          name,
          imageUrl,
          cost,
          setNumber: set,
          traits: [], // Will be populated in a separate crawl if needed
          patch: `Set ${set}`,
        });
      });

      this.logger.log(`Crawled ${champions.length} TFT champions`);
      return champions;
    } catch (error) {
      this.logger.error(`Error crawling TFT champions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse champions from provided HTML string
   */
  parseChampionsFromHtml(html: string): any[] {
    try {
      const $ = cheerio.load(html);
      const champions = [];

      // Select all champion items from the characters list
      $('.characters-list .characters-item').each((i, el) => {
        const name = $(el).find('.character-name').text().trim();
        const imageUrl = $(el).find('.character-icon').attr('src');
        const cost = this.getCostFromClass($(el).attr('class'));
        const set = this.getSetFromClass($(el).attr('class'));
        
        champions.push({
          name,
          imageUrl,
          cost,
          setNumber: set,
          traits: [], // Will be populated in a separate crawl if needed
          patch: `Set ${set}`,
        });
      });

      this.logger.log(`Parsed ${champions.length} TFT champions from HTML`);
      return champions;
    } catch (error) {
      this.logger.error(`Error parsing TFT champions from HTML: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crawl detailed information for a specific champion
   */
  async crawlChampionDetails(championName: string): Promise<any> {
    try {
      // Convert champion name to URL format (lowercase, no spaces)
      const formattedName = championName.toLowerCase().replace(/\s+/g, '-');
      const url = `https://tftactics.gg/champions/${formattedName}/`;
      
      this.logger.log(`Crawling details for ${championName} from ${url}`);
      
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      
      // Extract cost from the stats list
      const costText = $('.stats-list li:contains("Cost:")').text();
      const costMatch = costText.match(/Cost:\s*(\d+)/);
      const cost = costMatch ? parseInt(costMatch[1]) : 1;
      
      // Extract recommended items with their images
      const recommendedItems: string[] = [];
      const recommendedItemsData: Array<{ name: string; imageUrl: string }> = [];
      
      $('.items-list img, .champion-build-items img').each((i, el) => {
        const itemName = $(el).attr('alt');
        const itemImageUrl = $(el).attr('src');
        
        if (itemName) {
          recommendedItems.push(itemName);
          
          if (itemImageUrl) {
            recommendedItemsData.push({
              name: itemName,
              imageUrl: itemImageUrl,
            });
            
            // Save or update item in database
            this.saveItemData(itemName, itemImageUrl);
          }
        }
      });
      
      // Extract stats
      const statsMap: Record<string, string> = {};
      
      // Process each stat item in the stats list
      $('.stats-list li').each((i, el) => {
        const text = $(el).text().trim();
        
        if (text.includes('Health:')) {
          statsMap['health'] = text.replace('Health:', '').trim();
        } else if (text.includes('Mana:')) {
          statsMap['mana'] = text.replace('Mana:', '').trim();
        } else if (text.includes('Armor:')) {
          statsMap['armor'] = text.replace('Armor:', '').trim();
        } else if (text.includes('MR:')) {
          statsMap['mr'] = text.replace('MR:', '').trim();
        } else if (text.includes('DPS:')) {
          statsMap['dps'] = text.replace('DPS:', '').trim();
        } else if (text.includes('Damage:')) {
          statsMap['damage'] = text.replace('Damage:', '').trim();
        } else if (text.includes('Atk Spd:')) {
          statsMap['atk spd'] = text.replace('Atk Spd:', '').trim();
        } else if (text.includes('Crit Rate:')) {
          statsMap['crit rate'] = text.replace('Crit Rate:', '').trim();
        } else if (text.includes('Range:')) {
          statsMap['range'] = text.replace('Range:', '').trim();
        }
      });
      
      // Extract ability details
      const abilityName = $('.ability-description-name h2').first().text().trim();
      const abilityMana = $('.ability-description-cost span').text().trim();
      const abilityDescription = $('.ability-bonus').first().text().trim();
      
      // Extract traits
      const traits: string[] = [];
      $('.character-ability .ability-description-name h2').each((i, el) => {
        const trait = $(el).text().trim();
        // Skip the ability name which is also in an h2
        if (trait !== abilityName && trait) {
          traits.push(trait);
        }
      });
      
      // Extract image URL
      const imageUrl = $('.character-portrait .character-image').attr('src') || '';
      
      const championDetail = {
        name: championName,
        imageUrl,
        cost,
        recommendedItems,
        recommendedItemsData,
        stats: {
          health: statsMap['health'] || '',
          mana: statsMap['mana'] || '',
          armor: statsMap['armor'] || '',
          magicResist: statsMap['mr'] || '',
          dps: statsMap['dps'] || '',
          damage: statsMap['damage'] || '',
          attackSpeed: statsMap['atk spd'] || '',
          critRate: statsMap['crit rate'] || '',
          range: statsMap['range'] || '',
        },
        ability: {
          name: abilityName,
          description: abilityDescription,
          mana: abilityMana,
        },
        traits,
        setNumber: 14, // Current set
        patch: `Set ${14}`,
      };
      
      return championDetail;
    } catch (error) {
      this.logger.error(`Error crawling details for ${championName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save or update item data in the database
   */
  private async saveItemData(itemName: string, imageUrl: string): Promise<void> {
    try {
      await this.tftItemModel.findOneAndUpdate(
        { name: itemName },
        { 
          $set: { 
            imageUrl,
            patch: `Set ${14}`, // Current set
          },
          $setOnInsert: {
            name: itemName,
            isBasic: false,
          }
        },
        { upsert: true, new: true },
      );
    } catch (error) {
      this.logger.error(`Error saving item data for ${itemName}: ${error.message}`);
    }
  }

  /**
   * Crawl all TFT items
   */
  async crawlItems(): Promise<any[]> {
    try {
      const url = 'https://tftactics.gg/items';
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const items = [];

      // Select all items
      $('.characters-list .characters-item').each((i, el) => {
        const name = $(el).find('.character-name').text().trim();
        const imageUrl = $(el).find('.character-icon').attr('src');
        const isBasic = $(el).hasClass('basic-item');
        
        items.push({
          name,
          imageUrl,
          isBasic,
          patch: `Set ${14}`,
        });
      });

      this.logger.log(`Crawled ${items.length} TFT items`);
      return items;
    } catch (error) {
      this.logger.error(`Error crawling TFT items: ${error.message}`);
      throw error;
    }
  }

  /**
   * Save crawled items to the database
   */
  async saveCrawledItems(): Promise<void> {
    try {
      const items = await this.crawlItems();
      
      for (const item of items) {
        await this.tftItemModel.findOneAndUpdate(
          { name: item.name },
          item,
          { upsert: true, new: true },
        );
      }
      
      this.logger.log(`Saved ${items.length} TFT items to database`);
    } catch (error) {
      this.logger.error(`Error saving TFT items: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update champion details in the database
   */
  async updateChampionDetails(championName: string): Promise<TftChampion> {
    try {
      const championDetail = await this.crawlChampionDetails(championName);
      
      // Find the champion by name and update with new details
      const updatedChampion = await this.tftChampionModel.findOneAndUpdate(
        { name: championName },
        {
          $set: {
            cost: championDetail.cost,
            imageUrl: championDetail.imageUrl,
            recommendedItems: championDetail.recommendedItems,
            recommendedItemsData: championDetail.recommendedItemsData,
            stats: championDetail.stats,
            ability: championDetail.ability,
            traits: championDetail.traits,
            setNumber: championDetail.setNumber,
            patch: championDetail.patch,
          },
        },
        { new: true, upsert: true },
      );
      
      this.logger.log(`Updated champion details for ${championName}`);
      return updatedChampion;
    } catch (error) {
      this.logger.error(`Error updating champion details for ${championName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update details for all champions in the database
   */
  async updateAllChampionDetails(): Promise<{ updated: number; failed: number }> {
    try {
      const champions = await this.tftChampionModel.find({});
      this.logger.log(`Found ${champions.length} champions to update`);
      
      let updated = 0;
      let failed = 0;
      
      for (const champion of champions) {
        try {
          await this.updateChampionDetails(champion.name);
          updated++;
          
          // Wait a bit to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          this.logger.error(`Failed to update ${champion.name}: ${error.message}`);
          failed++;
        }
      }
      
      return { updated, failed };
    } catch (error) {
      this.logger.error(`Error updating all champion details: ${error.message}`);
      throw error;
    }
  }

  /**
   * Saves crawled champions to the database
   */
  async saveCrawledChampions(): Promise<void> {
    try {
      const champions = await this.crawlChampions();
      this.logger.log(`Got ${champions.length} champions to save`);
      
      let savedCount = 0;
      let errorCount = 0;
      
      for (const champion of champions) {
        try {
          // Make sure we have the required fields according to the schema
          const championToSave = {
            ...champion,
            traits: champion.traits || [],
            stats: {
              health: '',
              mana: '',
              armor: '',
              magicResist: '',
              dps: '',
              damage: '',
              attackSpeed: '',
              critRate: '',
              range: '',
            },
            ability: {
              name: '',
              description: '',
              mana: '',
            },
            recommendedItems: [],
            recommendedItemsData: [],
          };
          
          const result = await this.tftChampionModel.findOneAndUpdate(
            { name: champion.name, patch: champion.patch },
            championToSave,
            { upsert: true, new: true },
          );
          
          this.logger.log(`Saved champion: ${result.name} with ID: ${result._id}`);
          savedCount++;
        } catch (error) {
          this.logger.error(`Error saving champion ${champion.name}: ${error.message}`);
          errorCount++;
        }
      }
      
      this.logger.log(`Saved ${savedCount} TFT champions to database, ${errorCount} errors`);
    } catch (error) {
      this.logger.error(`Error saving TFT champions: ${error.message}`);
      throw error;
    }
  }

  /**
   * Saves champions parsed from HTML to the database
   */
  async saveChampionsFromHtml(html: string): Promise<void> {
    try {
      const champions = this.parseChampionsFromHtml(html);
      
      for (const champion of champions) {
        await this.tftChampionModel.findOneAndUpdate(
          { name: champion.name, patch: champion.patch },
          champion,
          { upsert: true, new: true },
        );
      }
      
      this.logger.log(`Saved ${champions.length} TFT champions from HTML to database`);
    } catch (error) {
      this.logger.error(`Error saving TFT champions from HTML: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extracts cost value from the class attribute
   * Example: "characters-item c3 s14" -> cost: 3
   */
  private getCostFromClass(classAttr: string): number {
    if (!classAttr) return 0;
    
    const costMatch = classAttr.match(/c(\d+)/);
    if (costMatch && costMatch[1]) {
      return parseInt(costMatch[1], 10);
    }
    return 0;
  }

  /**
   * Extracts set value from the class attribute
   * Example: "characters-item c3 s14" -> set: 14
   */
  private getSetFromClass(classAttr: string): number {
    if (!classAttr) return 0;
    
    const setMatch = classAttr.match(/s(\d+)/);
    if (setMatch && setMatch[1]) {
      return parseInt(setMatch[1], 10);
    }
    return 0;
  }
} 