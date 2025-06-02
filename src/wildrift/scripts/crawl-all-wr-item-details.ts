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

async function getItemUrlsFromMainPage(): Promise<string[]> {
  try {
    console.log('Getting item URLs from main items page...');

    const response = await axios.get('https://lolwildriftbuild.com/items/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    const itemUrls: string[] = [];

    // Find all item links
    $('.item-data').each((i, element) => {
      const href = $(element).attr('href');
      if (href && href.includes('/item/')) {
        let fullUrl = href;
        if (href.startsWith('/')) {
          fullUrl = 'https://lolwildriftbuild.com' + href;
        }
        if (!fullUrl.endsWith('/')) {
          fullUrl += '/';
        }
        itemUrls.push(fullUrl);
      }
    });

    // Remove duplicates
    const uniqueUrls = [...new Set(itemUrls)];
    console.log(`Found ${uniqueUrls.length} unique item URLs`);

    return uniqueUrls;
  } catch (error) {
    console.error('Error getting item URLs:', error.message);
    return [];
  }
}

async function crawlItemDetails(itemUrl: string): Promise<ItemDetails | null> {
  try {
    console.log(`Crawling item details from: ${itemUrl}`);

    // Add delay to be polite to the server
    await delay(3000);

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
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const itemDetails: ItemDetails = { name: '' };

    // Get item name from h1 title
    const title = $('h1').first().text().trim();
    if (title) {
      itemDetails.name = title;
    }

    // Alternative: get name from page title
    if (!itemDetails.name) {
      const pageTitle = $('title').text().trim();
      if (pageTitle) {
        itemDetails.name = pageTitle.split('|')[0].trim();
      }
    }

    // Get cost - try multiple selectors
    let cost = 0;
    const costSelectors = [
      'h3:contains("Cost") + *',
      '.cost-section .cost-value',
      '[class*="cost"]',
      'h3:contains("Cost")',
    ];

    for (const selector of costSelectors) {
      const costElement = $(selector);
      if (costElement.length) {
        const costText = costElement.text().trim();
        const extractedCost = parseInt(costText.replace(/[^\d]/g, ''));
        if (!isNaN(extractedCost) && extractedCost > 0) {
          cost = extractedCost;
          break;
        }
      }
    }

    if (cost > 0) {
      itemDetails.cost = cost;
    }

    // Get stats - try multiple approaches
    const statsSelectors = [
      'h3:contains("Stats") + *',
      '.stats-section',
      '[class*="stats"]',
    ];

    const stats: Record<string, any> = {};

    for (const selector of statsSelectors) {
      const statsSection = $(selector);
      if (statsSection.length) {
        const statsText = statsSection.text();

        // Parse different stat patterns with improved regex
        const statPatterns = [
          { pattern: /\+(\d+)\s+Max\s+health/gi, name: 'Max Health' },
          { pattern: /\+(\d+)\s+Attack\s+Damage/gi, name: 'Attack Damage' },
          { pattern: /\+(\d+)\s+Ability\s+Power/gi, name: 'Ability Power' },
          { pattern: /\+(\d+)\s+Ability\s+Haste/gi, name: 'Ability Haste' },
          { pattern: /\+(\d+)\s+Armor/gi, name: 'Armor' },
          { pattern: /\+(\d+)\s+Magic\s+Resist/gi, name: 'Magic Resist' },
          {
            pattern: /\+(\d+)%\s+Attack\s+Speed/gi,
            name: 'Attack Speed',
            isPercent: true,
          },
          {
            pattern: /\+(\d+)%\s+Critical\s+Strike\s+Chance/gi,
            name: 'Critical Strike Chance',
            isPercent: true,
          },
          { pattern: /\+(\d+)\s+Movement\s+Speed/gi, name: 'Movement Speed' },
          { pattern: /\+(\d+)\s+Mana/gi, name: 'Mana' },
          { pattern: /\+(\d+)\s+Health\s+Regen/gi, name: 'Health Regen' },
          { pattern: /\+(\d+)\s+Mana\s+Regen/gi, name: 'Mana Regen' },
          {
            pattern: /\+(\d+)%\s+Life\s+Steal/gi,
            name: 'Life Steal',
            isPercent: true,
          },
          { pattern: /\+(\d+)\s+Lethality/gi, name: 'Lethality' },
          {
            pattern: /\+(\d+)\s+Magic\s+Penetration/gi,
            name: 'Magic Penetration',
          },
          {
            pattern: /\+(\d+)%\s+Magic\s+Penetration/gi,
            name: 'Magic Penetration %',
            isPercent: true,
          },
        ];

        statPatterns.forEach(({ pattern, name, isPercent }) => {
          const matches = statsText.match(pattern);
          if (matches) {
            matches.forEach((match) => {
              const value = parseInt(match.replace(/[^\d]/g, ''));
              if (!isNaN(value)) {
                stats[name] = isPercent ? `${value}%` : value;
              }
            });
          }
        });

        if (Object.keys(stats).length > 0) {
          break;
        }
      }
    }

    if (Object.keys(stats).length > 0) {
      itemDetails.stats = stats;
    }

    // Get item description - try multiple approaches
    const descriptionSelectors = [
      'h3:contains("Item Description") + *',
      '.item-description',
      '[class*="description"]',
      'p:contains("Dealing")',
      'p:contains("Grants")',
      'p:contains("Punishment")',
    ];

    for (const selector of descriptionSelectors) {
      const descElement = $(selector);
      if (descElement.length) {
        const description = descElement.text().trim();
        if (description && description.length > 10) {
          itemDetails.itemDescription = description;
          break;
        }
      }
    }

    // Try to find description in any paragraph that contains keywords
    if (!itemDetails.itemDescription) {
      const paragraphs = $('p').toArray();
      for (const p of paragraphs) {
        const text = $(p).text().trim();
        if (text.length > 20) {
          const keywords = [
            'Dealing',
            'Grants',
            'Punishment',
            'passive',
            'active',
            'Unique',
          ];
          if (keywords.some((keyword) => text.includes(keyword))) {
            itemDetails.itemDescription = text;
            break;
          }
        }
      }
    }

    // Get category - try multiple approaches
    const categorySelectors = [
      '.breadcrumb a:last-child',
      '.category',
      '[class*="category"]',
    ];

    for (const selector of categorySelectors) {
      const categoryElement = $(selector);
      if (categoryElement.length) {
        const category = categoryElement.text().trim();
        if (category && category !== 'Items') {
          itemDetails.category = category;
          break;
        }
      }
    }

    // Get image URL
    const imageSelectors = [
      `img[alt*="${itemDetails.name}"]`,
      'img[src*="item"]',
      '.item-image img',
      '.item-icon',
    ];

    for (const selector of imageSelectors) {
      const imageElement = $(selector).first();
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
          break;
        }
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
    console.log('Starting comprehensive Wild Rift items details crawling...');

    // Get all item URLs from main page
    const itemUrls = await getItemUrlsFromMainPage();

    if (itemUrls.length === 0) {
      console.log('No item URLs found. Exiting...');
      return;
    }

    console.log(`Found ${itemUrls.length} item URLs to process`);

    let updatedCount = 0;
    let errorCount = 0;
    let notFoundCount = 0;

    // Process each item URL
    for (let i = 0; i < itemUrls.length; i++) {
      const itemUrl = itemUrls[i];
      console.log(`\n[${i + 1}/${itemUrls.length}] Processing: ${itemUrl}`);

      try {
        const itemDetails = await crawlItemDetails(itemUrl);

        if (itemDetails && itemDetails.name) {
          // Find matching item in database (try multiple search strategies)
          let existingItem = await itemModel.findOne({
            name: { $regex: new RegExp(`^${itemDetails.name}$`, 'i') },
          });

          // If not found, try fuzzy search
          if (!existingItem) {
            existingItem = await itemModel.findOne({
              name: {
                $regex: new RegExp(
                  itemDetails.name.replace(/[^a-zA-Z0-9\s]/g, ''),
                  'i',
                ),
              },
            });
          }

          if (existingItem) {
            // Update item with detailed information
            const updateData: any = {};

            if (
              itemDetails.cost &&
              itemDetails.cost > 0 &&
              (!existingItem.price || existingItem.price <= 0)
            ) {
              updateData.price = itemDetails.cost;
            }

            if (
              itemDetails.stats &&
              Object.keys(itemDetails.stats).length > 0
            ) {
              updateData.stats = {
                ...existingItem.stats,
                ...itemDetails.stats,
              };
            }

            if (
              itemDetails.itemDescription &&
              (!existingItem.description ||
                existingItem.description.endsWith('item'))
            ) {
              updateData.description = itemDetails.itemDescription;
              updateData.activeDescription = itemDetails.itemDescription;
            }

            if (itemDetails.category && itemDetails.category !== 'Unknown') {
              updateData.category = itemDetails.category;
            }

            if (
              itemDetails.imageUrl &&
              (!existingItem.imageUrl ||
                existingItem.imageUrl.includes('placeholder'))
            ) {
              updateData.imageUrl = itemDetails.imageUrl;
            }

            if (Object.keys(updateData).length > 0) {
              await itemModel.findByIdAndUpdate(existingItem._id, updateData);
              console.log(`🔄 Updated item: ${existingItem.name}`);
              updatedCount++;
            } else {
              console.log(`ℹ️ No updates needed for: ${existingItem.name}`);
            }
          } else {
            console.log(`⚠️ Item not found in database: ${itemDetails.name}`);
            notFoundCount++;
          }
        } else {
          console.log(`⚠️ No valid item data found from URL: ${itemUrl}`);
        }
      } catch (error) {
        console.error(
          `❌ Error processing item URL ${itemUrl}:`,
          error.message,
        );
        errorCount++;
      }
    }

    console.log('\n🎉 Comprehensive item details update completed!');
    console.log(
      `📈 Results: ${updatedCount} items updated, ${notFoundCount} not found in DB, ${errorCount} errors`,
    );

    // Save comprehensive results to file
    const resultsPath = path.resolve(
      process.cwd(),
      'wr-all-item-details-update-results.json',
    );
    const results = {
      timestamp: new Date().toISOString(),
      totalProcessed: itemUrls.length,
      updatedItems: updatedCount,
      notFoundInDb: notFoundCount,
      errors: errorCount,
      processedUrls: itemUrls,
    };
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Results saved to: ${resultsPath}`);
  } catch (error) {
    console.error(
      '❌ Error in comprehensive Wild Rift item details update:',
      error,
    );
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
