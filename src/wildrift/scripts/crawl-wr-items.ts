import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { WildriftService } from '../wildrift.service';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { getModelToken } from '@nestjs/mongoose';
import { CreateWrItemDto } from '../dto/create-wr-item.dto';

interface ItemData {
  name: string;
  imageUrl: string;
  category: string;
  tier: string;
  price?: number;
  description?: string;
  stats?: Record<string, any>;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const wildriftService = app.get(WildriftService);

  try {
    console.log(
      'Starting to crawl Wild Rift items from lolwildriftbuild.com...',
    );

    // Get HTML content from items page
    let htmlContent: string;
    const filePath = path.resolve(process.cwd(), 'wr-items-page.html');

    if (fs.existsSync(filePath)) {
      console.log('Using cached HTML file...');
      htmlContent = fs.readFileSync(filePath, 'utf8');
    } else {
      console.log('Downloading items page from lolwildriftbuild.com...');
      const response = await axios.get('https://lolwildriftbuild.com/items/', {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });
      htmlContent = response.data;
      fs.writeFileSync(filePath, htmlContent);
      console.log('HTML content saved to wr-items-page.html');
    }

    const $ = cheerio.load(htmlContent);
    console.log('HTML loaded, starting to parse items...');

    const allItems: ItemData[] = [];

    // Function to parse items with improved categorization
    const parseItemsFromSections = () => {
      console.log('Parsing items by section headers...');

      // Find all section headers
      const sectionHeaders = $('h2[id]');
      console.log(`Found ${sectionHeaders.length} section headers`);

      sectionHeaders.each((i, headerEl) => {
        const $header = $(headerEl);
        const headerId = $header.attr('id');
        const headerText = $header.text().trim();

        console.log(`Processing section: ${headerText} (id: ${headerId})`);

        // Determine category from header
        let category = 'Unknown';
        if (
          headerId === 'physical-items' ||
          headerText.toLowerCase().includes('physical')
        ) {
          category = 'Physical';
        } else if (
          headerId === 'magic-items' ||
          headerText.toLowerCase().includes('magic')
        ) {
          category = 'Magic';
        } else if (
          headerId === 'defence-items' ||
          headerText.toLowerCase().includes('defence') ||
          headerText.toLowerCase().includes('defense')
        ) {
          category = 'Defense';
        } else if (
          headerId === 'boots-items' ||
          headerText.toLowerCase().includes('boots')
        ) {
          category = 'Boots';
        }

        if (category === 'Unknown') {
          console.log(`Skipping unknown section: ${headerText}`);
          return;
        }

        // Find all item-data links in this section
        // Look for the next h2 to determine section boundaries
        const nextHeader = $header.nextAll('h2').first();
        let sectionContent;

        if (nextHeader.length > 0) {
          // Get content between this header and the next header
          sectionContent = $header.nextUntil(nextHeader);
        } else {
          // This is the last section, get all content after this header
          sectionContent = $header.nextAll();
        }

        // Find all item-data links within this section
        const itemLinks = sectionContent.find('.item-data');
        console.log(`Found ${itemLinks.length} items in ${category} section`);

        itemLinks.each((j, linkEl) => {
          const $link = $(linkEl);
          const $img = $link.find('img.item-icon');

          if ($img.length === 0) return;

          // Get image source (check both src and data-lazy-src)
          let imageUrl = $img.attr('data-lazy-src') || $img.attr('src') || '';
          const alt = $img.attr('alt') || '';
          const title = $img.attr('title') || '';

          // Use alt or title as name
          const name = (alt || title).trim();

          // Skip if no name or image
          if (!name || !imageUrl) return;

          // Skip placeholder images
          if (
            imageUrl.includes('data:image/svg+xml') ||
            imageUrl.includes('placeholder')
          ) {
            return;
          }

          // Fix relative URLs
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          } else if (imageUrl.startsWith('/')) {
            imageUrl = 'https://lolwildriftbuild.com' + imageUrl;
          }

          const item: ItemData = {
            name,
            imageUrl,
            category,
            tier: 'upgraded',
            price: 0,
            description: `${category} item`,
            stats: {},
          };

          allItems.push(item);
          console.log(`Found item: ${name} (${category}) - ${imageUrl}`);
        });
      });
    };

    // Parse items using improved section-based approach
    parseItemsFromSections();

    console.log(`\nTotal items found: ${allItems.length}`);

    // Group by category for display
    const itemsByCategory = allItems.reduce(
      (acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<string, ItemData[]>,
    );

    console.log('\nItems by category:');
    Object.entries(itemsByCategory).forEach(([category, items]) => {
      console.log(`${category}: ${items.length} items`);
    });

    // Save items to database
    console.log('\nSaving items to database...');
    const itemModel = app.get(getModelToken('WrItem'));

    let newCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const itemData of allItems) {
      try {
        const createItemDto: CreateWrItemDto = {
          name: itemData.name,
          description: itemData.description || `${itemData.category} item`,
          stats: itemData.stats || {},
          price: itemData.price || 0,
          buildsFrom: [],
          buildsInto: [],
          category: itemData.category,
          isActive: false,
          activeDescription: '',
          cooldown: 0,
          imageUrl: itemData.imageUrl,
          patch: '5.0.0',
        };

        const result = await itemModel.findOneAndUpdate(
          { name: createItemDto.name },
          createItemDto,
          { upsert: true, new: true },
        );

        if (result.isNew) {
          console.log(`✅ Created new item: ${createItemDto.name}`);
          newCount++;
        } else {
          console.log(`🔄 Updated existing item: ${createItemDto.name}`);
          updatedCount++;
        }
      } catch (error) {
        console.error(`❌ Error saving item ${itemData.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n🎉 Crawling completed!');
    console.log(
      `📈 Results: ${newCount} new items, ${updatedCount} updated items, ${errorCount} errors`,
    );

    // Verify items in database
    const allItemsInDb = await wildriftService.findAllItems({ limit: 1000 });
    console.log(`\n📊 Total items in database: ${allItemsInDb.total}`);

    // Save crawl results to file
    const resultsPath = path.resolve(
      process.cwd(),
      'wr-items-crawl-results.json',
    );
    const results = {
      timestamp: new Date().toISOString(),
      totalFound: allItems.length,
      newItems: newCount,
      updatedItems: updatedCount,
      errors: errorCount,
      itemsByCategory,
    };
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Results saved to: ${resultsPath}`);
  } catch (error) {
    console.error('❌ Error crawling Wild Rift items:', error);
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
