import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import * as cheerio from 'cheerio';
import axios from 'axios';

// Delay function to avoid being blocked
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function crawlItemDetailsFromUrl(itemUrl: string): Promise<any> {
  try {
    console.log(`🔍 Crawling details from: ${itemUrl}`);

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
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);

    // Extract stats
    const stats = {};
    $('.item-stats .stat-item, .stats-list .stat, .item-stat').each(
      (i, elem) => {
        const statText = $(elem).text().trim();
        if (statText) {
          // Parse different stat formats
          const statMatch = statText.match(/([^:]+):\s*([^,\n]+)/);
          if (statMatch) {
            const statName = statMatch[1].trim();
            const statValue = statMatch[2].trim();
            stats[statName] = statValue;
          } else {
            // Try alternative parsing
            const parts = statText.split(/[:\-]/);
            if (parts.length >= 2) {
              const statName = parts[0].trim();
              const statValue = parts.slice(1).join(':').trim();
              if (statName && statValue) {
                stats[statName] = statValue;
              }
            }
          }
        }
      },
    );

    // Extract description/passive
    let description = '';
    const descriptionSelectors = [
      '.item-description',
      '.passive-description',
      '.item-passive',
      '.ability-description',
      '.item-tooltip',
      '.description',
      'p:contains("PASSIVE")',
      'p:contains("UNIQUE")',
      'p:contains("ACTIVE")',
    ];

    for (const selector of descriptionSelectors) {
      const desc = $(selector).first().text().trim();
      if (desc && desc.length > 10) {
        description = desc;
        break;
      }
    }

    // Extract cost
    let cost = 0;
    const costSelectors = [
      '.item-cost',
      '.cost',
      'h3:contains("Cost")',
      '.price',
    ];

    for (const selector of costSelectors) {
      const costText = $(selector).text().trim();
      const costMatch = costText.match(/(\d{3,4})/);
      if (costMatch) {
        const parsedCost = parseInt(costMatch[1]);
        if (parsedCost >= 100 && parsedCost <= 5000) {
          cost = parsedCost;
          break;
        }
      }
    }

    return {
      stats: Object.keys(stats).length > 0 ? stats : null,
      description: description || null,
      cost: cost || null,
    };
  } catch (error) {
    console.error(`❌ Error crawling ${itemUrl}:`, error.message);
    return null;
  }
}

async function generateItemUrl(itemName: string): Promise<string[]> {
  // Generate possible URLs for the item
  const baseUrl = 'https://lolwildriftbuild.com/item/';

  // Clean item name for URL
  const cleanName = itemName
    .toLowerCase()
    .replace(/'/g, '') // Remove apostrophes
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars except spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove multiple hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  const possibleUrls = [
    `${baseUrl}${cleanName}/`,
    `${baseUrl}${cleanName.replace(/-/g, '')}/`,
    `${baseUrl}${itemName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')}/`,
  ];

  return [...new Set(possibleUrls)]; // Remove duplicates
}

async function fixApostropheItemsDetails() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    console.log('🔧 Fixing apostrophe items details...');

    // Find items with apostrophes that need details
    const apostropheItems = await itemModel
      .find({
        name: { $regex: /'/ },
        $or: [
          { stats: { $exists: false } },
          { stats: {} },
          { description: { $exists: false } },
          { description: 'Physical item' },
          { description: '' },
        ],
      })
      .lean();

    console.log(
      `📋 Found ${apostropheItems.length} apostrophe items needing details:`,
    );
    apostropheItems.forEach((item) => {
      console.log(
        `   ${item.name} - Stats: ${Object.keys(item.stats || {}).length}, Desc: ${item.description ? 'Yes' : 'No'}`,
      );
    });

    let updatedCount = 0;
    let successCount = 0;

    for (const item of apostropheItems) {
      try {
        console.log(`\n🔍 Processing: ${item.name}`);

        // Generate possible URLs
        const possibleUrls = await generateItemUrl(item.name);
        let itemDetails = null;

        // Try each possible URL
        for (const url of possibleUrls) {
          console.log(`   Trying URL: ${url}`);
          itemDetails = await crawlItemDetailsFromUrl(url);

          if (itemDetails && (itemDetails.stats || itemDetails.description)) {
            console.log(`   ✅ Found details at: ${url}`);
            break;
          }

          await delay(1000); // Wait between requests
        }

        if (itemDetails && (itemDetails.stats || itemDetails.description)) {
          // Update the item with new details
          const updateData = {};

          if (itemDetails.stats && Object.keys(itemDetails.stats).length > 0) {
            updateData['stats'] = itemDetails.stats;
            console.log(
              `   📈 Found ${Object.keys(itemDetails.stats).length} stats`,
            );
          }

          if (itemDetails.description && itemDetails.description.length > 10) {
            updateData['description'] = itemDetails.description;
            console.log(
              `   📝 Found description: ${itemDetails.description.substring(0, 100)}...`,
            );
          }

          if (itemDetails.cost && itemDetails.cost > 0) {
            updateData['price'] = itemDetails.cost;
            console.log(`   💰 Found cost: ${itemDetails.cost} gold`);
          }

          if (Object.keys(updateData).length > 0) {
            await itemModel.findByIdAndUpdate(item._id, updateData);
            console.log(
              `   ✅ Updated ${item.name} with ${Object.keys(updateData).join(', ')}`,
            );
            updatedCount++;
            successCount++;
          }
        } else {
          console.log(`   ⚠️ No details found for ${item.name}`);
        }

        // Add delay between items to be polite
        await delay(2000);
      } catch (error) {
        console.error(`❌ Error processing ${item.name}:`, error.message);
      }
    }

    // Final report
    console.log('\n📊 FINAL REPORT:');
    console.log(`✅ Items processed: ${apostropheItems.length}`);
    console.log(`🔧 Items updated: ${updatedCount}`);
    console.log(
      `📈 Success rate: ${((successCount / apostropheItems.length) * 100).toFixed(1)}%`,
    );

    // Check remaining items without details
    const remainingItems = await itemModel
      .find({
        name: { $regex: /'/ },
        $or: [
          { stats: { $exists: false } },
          { stats: {} },
          { description: { $exists: false } },
          { description: 'Physical item' },
          { description: '' },
        ],
      })
      .select('name stats description')
      .lean();

    if (remainingItems.length > 0) {
      console.log(
        `\n❌ Remaining items without details: ${remainingItems.length}`,
      );
      remainingItems.forEach((item) => {
        console.log(
          `   ${item.name} - Stats: ${Object.keys(item.stats || {}).length}, Desc: ${item.description ? 'Yes' : 'No'}`,
        );
      });
    } else {
      console.log('\n🎉 All apostrophe items now have details!');
    }
  } catch (error) {
    console.error('❌ Error fixing apostrophe items:', error);
  } finally {
    await app.close();
  }
}

fixApostropheItemsDetails();
