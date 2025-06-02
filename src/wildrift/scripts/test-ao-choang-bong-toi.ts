import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { getModelToken } from '@nestjs/mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    console.log('Testing crawl for "ÁO CHOÀNG BÓNG TỐI"...');

    const testUrl = 'https://tocchien.net/trang-bi/ao-choang-bong-toi/';
    const itemName = 'ÁO CHOÀNG BÓNG TỐI';

    console.log(`Fetching: ${testUrl}`);

    const response = await axios.get(testUrl, {
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

    console.log('\n=== PAGE ANALYSIS ===');

    // Extract page title
    const pageTitle = $('h1').first().text().trim() || $('title').text().trim();
    console.log(`Page title: ${pageTitle}`);

    // Extract all text content
    const pageText = $('body').text();
    console.log(`Page text length: ${pageText.length}`);

    // Look for stats patterns
    console.log('\n=== STATS EXTRACTION ===');
    const statPatterns = [
      { pattern: /\+(\d+)\s*Máu\s*Tối\s*Đa/gi, name: 'health' },
      { pattern: /\+(\d+)\s*Sức\s*Mạnh\s*Công\s*Kích/gi, name: 'attackDamage' },
      { pattern: /\+(\d+)\s*Sức\s*Mạnh\s*Phép/gi, name: 'abilityPower' },
      { pattern: /\+(\d+)\s*Giáp/gi, name: 'armor' },
      { pattern: /\+(\d+)\s*Kháng\s*Phép/gi, name: 'magicResist' },
      { pattern: /\+(\d+)\s*Xuyên\s*Giáp/gi, name: 'armorPenetration' },
    ];

    const extractedStats: Record<string, number> = {};

    statPatterns.forEach(({ pattern, name }) => {
      const matches = pageText.match(pattern);
      if (matches && matches.length > 0) {
        const value = parseInt(matches[0].match(/\d+/)?.[0] || '0');
        if (value > 0) {
          extractedStats[name] = value;
          console.log(`Found ${name}: +${value} (from: ${matches[0].trim()})`);
        }
      }
    });

    // Look for special effects
    console.log('\n=== SPECIAL EFFECTS ===');
    const effectPatterns = [
      /Đục\s*Thủng[^.]*\./gi,
      /Hóa\s*Giải[^.]*\./gi,
      /Chủ\s*Động[^.]*\./gi,
      /Bị\s*Động[^.]*\./gi,
    ];

    const specialEffects: string[] = [];
    effectPatterns.forEach((pattern) => {
      const matches = pageText.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          specialEffects.push(match.trim());
          console.log(`Found effect: ${match.trim()}`);
        });
      }
    });

    // Look for images
    console.log('\n=== IMAGE EXTRACTION ===');
    const imageSelectors = [
      'img[alt*="ÁO CHOÀNG BÓNG TỐI"]',
      'img[title*="ÁO CHOÀNG BÓNG TỐI"]',
      '.item-image img',
      '.equipment-image img',
      'img[src*="item"]',
      'img[src*="equipment"]',
      'img[src*="icon"]',
      '.content img',
      'article img',
    ];

    let foundImage = false;
    for (const selector of imageSelectors) {
      const $img = $(selector);
      if ($img.length > 0) {
        $img.each((i, el) => {
          const $element = $(el);
          let imageUrl =
            $element.attr('src') || $element.attr('data-src') || '';

          if (imageUrl) {
            // Fix relative URLs
            if (imageUrl.startsWith('//')) {
              imageUrl = 'https:' + imageUrl;
            } else if (imageUrl.startsWith('/')) {
              imageUrl = 'https://tocchien.net' + imageUrl;
            }

            console.log(`Found image with selector "${selector}": ${imageUrl}`);
            foundImage = true;
          }
        });
      }
    }

    if (!foundImage) {
      console.log(
        'No images found with specific selectors, checking all images...',
      );
      $('img').each((i, el) => {
        const $img = $(el);
        let imageUrl = $img.attr('src') || $img.attr('data-src') || '';
        const alt = $img.attr('alt') || '';
        const title = $img.attr('title') || '';

        if (imageUrl) {
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          } else if (imageUrl.startsWith('/')) {
            imageUrl = 'https://tocchien.net' + imageUrl;
          }

          console.log(
            `Image ${i + 1}: ${imageUrl} (alt: "${alt}", title: "${title}")`,
          );
        }
      });
    }

    // Check if item exists in database
    console.log('\n=== DATABASE CHECK ===');
    const existingItem = await itemModel.findOne({ name: itemName });

    if (existingItem) {
      console.log('Item exists in database:');
      console.log(`- Name: ${existingItem.name}`);
      console.log(`- Category: ${existingItem.category}`);
      console.log(`- Current imageUrl: ${existingItem.imageUrl || 'None'}`);
      console.log(
        `- Current stats: ${JSON.stringify(existingItem.stats || {}, null, 2)}`,
      );
      console.log(
        `- Current description: ${existingItem.description || 'None'}`,
      );
      console.log(
        `- Current activeDescription: ${existingItem.activeDescription || 'None'}`,
      );
    } else {
      console.log('Item not found in database');
    }

    // Prepare update data
    console.log('\n=== PROPOSED UPDATE ===');
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (Object.keys(extractedStats).length > 0) {
      updateData.stats = extractedStats;
      console.log(
        `Stats to update: ${JSON.stringify(extractedStats, null, 2)}`,
      );
    }

    if (specialEffects.length > 0) {
      updateData.activeDescription = specialEffects.join(' ');
      updateData.isActive = true;
      console.log(`Active description: ${updateData.activeDescription}`);
    }

    // Create description from stats
    const statDescriptions = Object.entries(extractedStats)
      .map(([key, value]) => {
        const statMap: Record<string, string> = {
          health: 'Máu Tối Đa',
          attackDamage: 'Sức Mạnh Công Kích',
          abilityPower: 'Sức Mạnh Phép',
          armor: 'Giáp',
          magicResist: 'Kháng Phép',
          armorPenetration: 'Xuyên Giáp',
        };
        return `+${value} ${statMap[key] || key}`;
      })
      .join(', ');

    if (statDescriptions) {
      updateData.description = `${itemName} - ${statDescriptions}`;
      console.log(`Description: ${updateData.description}`);
    }

    // Apply update if item exists
    if (existingItem && Object.keys(updateData).length > 1) {
      await itemModel.updateOne({ name: itemName }, { $set: updateData });
      console.log('\n✅ Item updated successfully!');
    } else if (!existingItem) {
      console.log('\n❌ Item not found in database - cannot update');
    } else {
      console.log('\n⚠️ No new data to update');
    }
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
