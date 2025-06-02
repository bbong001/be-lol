import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { WildriftService } from '../wildrift.service';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { getModelToken } from '@nestjs/mongoose';

interface ItemDetailData {
  name: string;
  description: string;
  stats: Record<string, any>;
  price: number;
  buildsFrom: string[];
  buildsInto: string[];
  category: string;
  isActive: boolean;
  activeDescription: string;
  cooldown: number;
  imageUrl: string;
  patch: string;
  detailUrl: string;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const wildriftService = app.get(WildriftService);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    console.log('Starting improved crawl of item details from tocchien.net...');

    // Get all items from database that need detailed information
    const items = await itemModel
      .find({
        $or: [
          { imageUrl: { $exists: false } },
          { imageUrl: '' },
          { imageUrl: null },
          { stats: { $exists: false } },
          { stats: {} },
          { 'stats.health': { $exists: false } },
        ],
      })
      .lean();

    console.log(`Found ${items.length} items that need detailed information`);

    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Function to generate possible URLs for an item
    const generateItemUrls = (itemName: string): string[] => {
      const urls: string[] = [];

      // Method 1: Convert Vietnamese to slug format
      const slug1 = itemName
        .toLowerCase()
        .replace(/á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/g, 'a')
        .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/g, 'e')
        .replace(/í|ì|ỉ|ĩ|ị/g, 'i')
        .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/g, 'o')
        .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/g, 'u')
        .replace(/ý|ỳ|ỷ|ỹ|ỵ/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .trim();

      urls.push(`https://tocchien.net/trang-bi/${slug1}/`);

      // Method 2: Keep some special characters
      const slug2 = itemName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(
          /[^a-z0-9\-àáảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]/g,
          '',
        );

      urls.push(`https://tocchien.net/trang-bi/${slug2}/`);

      // Method 3: Alternative patterns
      const slug3 = itemName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]/g, '');

      urls.push(`https://tocchien.net/trang-bi/${slug3}/`);

      return [...new Set(urls)]; // Remove duplicates
    };

    // Function to extract detailed information from item page
    const extractItemDetails = async (
      url: string,
      itemName: string,
    ): Promise<Partial<ItemDetailData> | null> => {
      try {
        console.log(`Fetching details from: ${url}`);

        const response = await axios.get(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          timeout: 15000,
        });

        const $ = cheerio.load(response.data);
        const details: Partial<ItemDetailData> = {};

        // Extract item name from page
        const pageName =
          $('h1').first().text().trim() ||
          $('title').text().replace('Trang bị:', '').trim() ||
          itemName;

        details.name = pageName;
        details.detailUrl = url;

        // Extract image URL
        const imageSelectors = [
          'img[alt*="' + itemName + '"]',
          'img[title*="' + itemName + '"]',
          '.item-image img',
          '.equipment-image img',
          '.main-image img',
          '.hero-image img',
          'img[src*="item"]',
          'img[src*="equipment"]',
          'img[src*="icon"]',
          '.content img:first',
          'article img:first',
        ];

        for (const selector of imageSelectors) {
          const $img = $(selector).first();
          if ($img.length > 0) {
            let imageUrl = $img.attr('src') || $img.attr('data-src') || '';

            if (imageUrl) {
              // Fix relative URLs
              if (imageUrl.startsWith('//')) {
                imageUrl = 'https:' + imageUrl;
              } else if (imageUrl.startsWith('/')) {
                imageUrl = 'https://tocchien.net' + imageUrl;
              }

              if (imageUrl.includes('http')) {
                details.imageUrl = imageUrl;
                console.log(`Found image: ${imageUrl}`);
                break;
              }
            }
          }
        }

        // Extract stats and description from page content
        const pageText = $('body').text();
        const stats: Record<string, any> = {};

        // Parse stats patterns like "+250 Máu Tối Đa", "+50 Sức Mạnh Công Kích"
        const statPatterns = [
          /\+(\d+)\s*Máu\s*Tối\s*Đa/gi,
          /\+(\d+)\s*Sức\s*Mạnh\s*Công\s*Kích/gi,
          /\+(\d+)\s*Sức\s*Mạnh\s*Phép/gi,
          /\+(\d+)\s*Giáp/gi,
          /\+(\d+)\s*Kháng\s*Phép/gi,
          /\+(\d+)\s*Tốc\s*Độ\s*Đánh/gi,
          /\+(\d+)\s*Tốc\s*Độ\s*Di\s*Chuyển/gi,
          /\+(\d+)\s*Hút\s*Máu/gi,
          /\+(\d+)\s*Xuyên\s*Giáp/gi,
          /\+(\d+)\s*Chí\s*Mạng/gi,
          /\+(\d+)%\s*Tốc\s*Độ\s*Đánh/gi,
          /\+(\d+)%\s*Chí\s*Mạng/gi,
          /\+(\d+)%\s*Hút\s*Máu/gi,
        ];

        const statNames = [
          'health',
          'attackDamage',
          'abilityPower',
          'armor',
          'magicResist',
          'attackSpeed',
          'movementSpeed',
          'lifeSteal',
          'armorPenetration',
          'criticalStrike',
          'attackSpeedPercent',
          'criticalStrikePercent',
          'lifeStealPercent',
        ];

        statPatterns.forEach((pattern, index) => {
          const matches = pageText.match(pattern);
          if (matches && matches.length > 0) {
            const value = parseInt(matches[0].match(/\d+/)?.[0] || '0');
            if (value > 0) {
              stats[statNames[index]] = value;
            }
          }
        });

        details.stats = stats;

        // Extract special effects and descriptions
        const specialEffects: string[] = [];

        // Look for passive effects like "Đục Thủng", "Hóa Giải"
        const effectPatterns = [
          /Đục\s*Thủng[^.]*\./gi,
          /Hóa\s*Giải[^.]*\./gi,
          /Chủ\s*Động[^.]*\./gi,
          /Bị\s*Động[^.]*\./gi,
          /Duy\s*Nhất[^.]*\./gi,
        ];

        effectPatterns.forEach((pattern) => {
          const matches = pageText.match(pattern);
          if (matches) {
            matches.forEach((match) => {
              specialEffects.push(match.trim());
            });
          }
        });

        if (specialEffects.length > 0) {
          details.activeDescription = specialEffects.join(' ');
          details.isActive = true;
        }

        // Extract description
        const descriptionSelectors = [
          '.item-description',
          '.equipment-description',
          '.content p',
          'article p',
          '.description',
        ];

        for (const selector of descriptionSelectors) {
          const desc = $(selector).first().text().trim();
          if (desc && desc.length > 10) {
            details.description = desc;
            break;
          }
        }

        // If no description found, create one from stats
        if (!details.description) {
          const statDescriptions = Object.entries(stats)
            .map(([key, value]) => {
              const statMap: Record<string, string> = {
                health: 'Máu',
                attackDamage: 'Sức Mạnh Công Kích',
                abilityPower: 'Sức Mạnh Phép',
                armor: 'Giáp',
                magicResist: 'Kháng Phép',
                attackSpeed: 'Tốc Độ Đánh',
                movementSpeed: 'Tốc Độ Di Chuyển',
                lifeSteal: 'Hút Máu',
                armorPenetration: 'Xuyên Giáp',
                criticalStrike: 'Chí Mạng',
              };
              return `+${value} ${statMap[key] || key}`;
            })
            .join(', ');

          details.description = `${itemName} - ${statDescriptions}`;
        }

        console.log(`Extracted details for ${itemName}:`, {
          imageUrl: details.imageUrl ? 'Found' : 'Not found',
          statsCount: Object.keys(stats).length,
          hasDescription: !!details.description,
          hasActiveDescription: !!details.activeDescription,
        });

        return details;
      } catch (error) {
        console.log(`Failed to fetch ${url}: ${error.message}`);
        return null;
      }
    };

    // Process each item
    for (const item of items) {
      try {
        console.log(`\nProcessing item: ${item.name}`);

        const possibleUrls = generateItemUrls(item.name);
        let itemDetails: Partial<ItemDetailData> | null = null;

        // Try each possible URL
        for (const url of possibleUrls) {
          itemDetails = await extractItemDetails(url, item.name);
          if (
            itemDetails &&
            (itemDetails.imageUrl ||
              Object.keys(itemDetails.stats || {}).length > 0)
          ) {
            console.log(`Successfully found details at: ${url}`);
            break;
          }
          // Add delay between requests
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Update item in database if details found
        if (itemDetails) {
          const updateData: any = {
            updatedAt: new Date(),
          };

          if (itemDetails.imageUrl) {
            updateData.imageUrl = itemDetails.imageUrl;
          }

          if (itemDetails.stats && Object.keys(itemDetails.stats).length > 0) {
            updateData.stats = { ...item.stats, ...itemDetails.stats };
          }

          if (itemDetails.description) {
            updateData.description = itemDetails.description;
          }

          if (itemDetails.activeDescription) {
            updateData.activeDescription = itemDetails.activeDescription;
            updateData.isActive = true;
          }

          if (itemDetails.detailUrl) {
            updateData.detailUrl = itemDetails.detailUrl;
          }

          await itemModel.updateOne({ _id: item._id }, { $set: updateData });

          updatedCount++;
          console.log(`Updated: ${item.name}`);
        } else {
          console.log(`No details found for: ${item.name}`);
        }

        processedCount++;

        // Add delay to avoid overwhelming servers
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error processing ${item.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== IMPROVED ITEM DETAILS CRAWL SUMMARY ===');
    console.log(`Total items processed: ${processedCount}`);
    console.log(`Items updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error('Error during improved item details crawling:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
