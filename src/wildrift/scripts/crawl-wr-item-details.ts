import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { WildriftService } from '../wildrift.service';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { getModelToken } from '@nestjs/mongoose';

interface ItemDetails {
  name: string;
  cost?: number;
  stats?: Record<string, any>;
  description?: string;
  itemDescription?: string;
  category?: string;
  imageUrl?: string;
}

// Delay function to avoid being blocked
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function crawlItemDetails(itemUrl: string): Promise<ItemDetails | null> {
  try {
    console.log(`Crawling item details from: ${itemUrl}`);

    // Add delay to be polite to the server
    await delay(2000);

    const response = await axios.get(itemUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);
    const itemDetails: ItemDetails = { name: '' };

    // Get item name from h1 title
    const title = $('h1').first().text().trim();
    if (title) {
      itemDetails.name = title;
    }

    // Get cost from Cost section
    const costElement = $('h3:contains("Cost")').next().text().trim();
    if (costElement) {
      const cost = parseInt(costElement.replace(/[^\d]/g, ''));
      if (!isNaN(cost)) {
        itemDetails.cost = cost;
      }
    }

    // Get stats from Stats section
    const statsSection = $('h3:contains("Stats")').next();
    if (statsSection.length) {
      const stats: Record<string, any> = {};
      const statsText = statsSection.text();

      // Parse different stat patterns
      const statPatterns = [
        /\+(\d+)\s+Max health/gi,
        /\+(\d+)\s+Attack Damage/gi,
        /\+(\d+)\s+Ability Power/gi,
        /\+(\d+)\s+Ability Haste/gi,
        /\+(\d+)\s+Armor/gi,
        /\+(\d+)\s+Magic Resist/gi,
        /\+(\d+)%\s+Attack Speed/gi,
        /\+(\d+)%\s+Critical Strike Chance/gi,
        /\+(\d+)\s+Movement Speed/gi,
        /\+(\d+)\s+Mana/gi,
        /\+(\d+)\s+Health Regen/gi,
        /\+(\d+)\s+Mana Regen/gi,
        /\+(\d+)%\s+Life Steal/gi,
        /\+(\d+)%\s+Spell Vamp/gi,
        /\+(\d+)\s+Lethality/gi,
        /\+(\d+)\s+Magic Penetration/gi,
        /\+(\d+)%\s+Magic Penetration/gi,
        /\+(\d+)\s+Armor Penetration/gi,
        /\+(\d+)%\s+Armor Penetration/gi,
      ];

      statPatterns.forEach((pattern) => {
        const matches = statsText.match(pattern);
        if (matches) {
          matches.forEach((match) => {
            const value = parseInt(match.replace(/[^\d]/g, ''));
            const statName = match.replace(/\+\d+%?\s*/, '').trim();
            if (statName && !isNaN(value)) {
              stats[statName] = match.includes('%') ? `${value}%` : value;
            }
          });
        }
      });

      if (Object.keys(stats).length > 0) {
        itemDetails.stats = stats;
      }
    }

    // Get item description from Item Description section
    const descriptionSection = $('h3:contains("Item Description")').next();
    if (descriptionSection.length) {
      const description = descriptionSection.text().trim();
      if (description) {
        itemDetails.itemDescription = description;
      }
    }

    // Try to get description from any p tag that contains item abilities
    if (!itemDetails.itemDescription) {
      const paragraphs = $('p').toArray();
      for (const p of paragraphs) {
        const text = $(p).text().trim();
        if (
          text.length > 20 &&
          (text.includes(':') ||
            text.includes('Dealing') ||
            text.includes('Grants'))
        ) {
          itemDetails.itemDescription = text;
          break;
        }
      }
    }

    // Get category from breadcrumb or page context
    const categoryElement = $('.breadcrumb').find('a').last().text().trim();
    if (categoryElement) {
      itemDetails.category = categoryElement;
    }

    // Get image URL
    const imageElement = $(
      'img[alt*="' + itemDetails.name + '"], img[src*="item"]',
    ).first();
    if (imageElement.length) {
      let imageUrl =
        imageElement.attr('src') || imageElement.attr('data-src') || '';
      if (imageUrl) {
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl;
        } else if (imageUrl.startsWith('/')) {
          imageUrl = 'https://lolwildriftbuild.com' + imageUrl;
        }
        itemDetails.imageUrl = imageUrl;
      }
    }

    console.log(`✅ Successfully crawled: ${itemDetails.name}`);
    console.log(`   Cost: ${itemDetails.cost || 'N/A'}`);
    console.log(
      `   Stats: ${Object.keys(itemDetails.stats || {}).length} stats found`,
    );
    console.log(
      `   Description: ${itemDetails.itemDescription ? 'Found' : 'Not found'}`,
    );

    return itemDetails;
  } catch (error) {
    console.error(
      `❌ Error crawling item details from ${itemUrl}:`,
      error.message,
    );
    return null;
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const wildriftService = app.get(WildriftService);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    console.log(
      'Starting to update Wild Rift items with detailed information...',
    );

    // Get all items from database that need details
    const allItems = await itemModel
      .find({
        $or: [
          { price: { $lte: 0 } },
          { stats: { $exists: false } },
          { stats: {} },
          { description: { $regex: /item$/ } },
        ],
      })
      .lean();

    console.log(
      `Found ${allItems.length} items that need detailed information`,
    );

    // Known item URLs from lolwildriftbuild.com
    const knownItemUrls = [
      'https://lolwildriftbuild.com/item/chempunk-chainsword/',
      'https://lolwildriftbuild.com/item/blade-of-the-ruined-king/',
      'https://lolwildriftbuild.com/item/infinity-edge/',
      'https://lolwildriftbuild.com/item/rabadon-deathcap/',
      'https://lolwildriftbuild.com/item/guardian-angel/',
      'https://lolwildriftbuild.com/item/mortal-reminder/',
      'https://lolwildriftbuild.com/item/void-staff/',
      'https://lolwildriftbuild.com/item/mercurial/',
      'https://lolwildriftbuild.com/item/phantom-dancer/',
      'https://lolwildriftbuild.com/item/nashors-tooth/',
      // Add more URLs as needed
    ];

    let updatedCount = 0;
    let errorCount = 0;

    // Crawl details for known item URLs
    for (const itemUrl of knownItemUrls) {
      try {
        const itemDetails = await crawlItemDetails(itemUrl);

        if (itemDetails && itemDetails.name) {
          // Find matching item in database
          const existingItem = await itemModel.findOne({
            name: { $regex: new RegExp(itemDetails.name, 'i') },
          });

          if (existingItem) {
            // Update item with detailed information
            const updateData: any = {};

            if (itemDetails.cost && itemDetails.cost > 0) {
              updateData.price = itemDetails.cost;
            }

            if (
              itemDetails.stats &&
              Object.keys(itemDetails.stats).length > 0
            ) {
              updateData.stats = itemDetails.stats;
            }

            if (itemDetails.itemDescription) {
              updateData.description = itemDetails.itemDescription;
              updateData.activeDescription = itemDetails.itemDescription;
            }

            if (itemDetails.category) {
              updateData.category = itemDetails.category;
            }

            if (itemDetails.imageUrl) {
              updateData.imageUrl = itemDetails.imageUrl;
            }

            if (Object.keys(updateData).length > 0) {
              await itemModel.findByIdAndUpdate(existingItem._id, updateData);
              console.log(`🔄 Updated item: ${existingItem.name}`);
              updatedCount++;
            }
          } else {
            console.log(`⚠️ Item not found in database: ${itemDetails.name}`);
          }
        }
      } catch (error) {
        console.error(
          `❌ Error processing item URL ${itemUrl}:`,
          error.message,
        );
        errorCount++;
      }
    }

    console.log('\n🎉 Item details update completed!');
    console.log(
      `📈 Results: ${updatedCount} items updated, ${errorCount} errors`,
    );

    // Save updated results to file
    const resultsPath = path.resolve(
      process.cwd(),
      'wr-item-details-update-results.json',
    );
    const results = {
      timestamp: new Date().toISOString(),
      totalProcessed: knownItemUrls.length,
      updatedItems: updatedCount,
      errors: errorCount,
      processedUrls: knownItemUrls,
    };
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Results saved to: ${resultsPath}`);
  } catch (error) {
    console.error('❌ Error updating Wild Rift item details:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await app.close();
  }
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

bootstrap();
