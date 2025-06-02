import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { getModelToken } from '@nestjs/mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    console.log('Starting to crawl images for items from tocchien.net...');

    // Get all items from database that need images
    const items = await itemModel
      .find({
        $or: [
          { imageUrl: { $exists: false } },
          { imageUrl: '' },
          { imageUrl: null },
        ],
      })
      .lean();

    console.log(`Found ${items.length} items without images`);

    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Common image search strategies
    const searchStrategies = [
      // Strategy 1: Direct item page
      (itemName: string) => {
        const slug = itemName
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .trim();
        return `https://tocchien.net/items/${slug}/`;
      },

      // Strategy 2: Search page
      (itemName: string) => {
        const searchTerm = encodeURIComponent(itemName);
        return `https://tocchien.net/search/?q=${searchTerm}`;
      },

      // Strategy 3: Alternative slug format
      (itemName: string) => {
        const slug = itemName
          .toLowerCase()
          .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
          .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
          .replace(/[ìíịỉĩ]/g, 'i')
          .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
          .replace(/[ùúụủũưừứựửữ]/g, 'u')
          .replace(/[ỳýỵỷỹ]/g, 'y')
          .replace(/đ/g, 'd')
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .trim();
        return `https://tocchien.net/items/${slug}/`;
      },
    ];

    // Function to extract image from page
    const extractImageFromPage = async (
      url: string,
      itemName: string,
    ): Promise<string | null> => {
      try {
        console.log(`Fetching: ${url}`);

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

        // Try different selectors to find item image
        const imageSelectors = [
          `img[alt*="${itemName}"]`,
          `img[title*="${itemName}"]`,
          '.item-image img',
          '.item-icon img',
          '.equipment-image img',
          '.product-image img',
          '.main-image img',
          '.hero-image img',
          'img[src*="item"]',
          'img[src*="equipment"]',
          'img[src*="icon"]',
          '.content img',
          'article img',
          '.post-content img',
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

              // Validate image URL
              if (
                imageUrl.includes('tocchien.net') ||
                imageUrl.includes('cdn') ||
                imageUrl.includes('img')
              ) {
                console.log(
                  `Found image with selector ${selector}: ${imageUrl}`,
                );
                return imageUrl;
              }
            }
          }
        }

        // If no specific selectors work, try to find any reasonable image
        let foundImage: string | null = null;
        $('img').each((i, el) => {
          if (foundImage) return false; // Stop iteration if image found

          const $img = $(el);
          let imageUrl = $img.attr('src') || $img.attr('data-src') || '';

          if (imageUrl) {
            // Fix relative URLs
            if (imageUrl.startsWith('//')) {
              imageUrl = 'https:' + imageUrl;
            } else if (imageUrl.startsWith('/')) {
              imageUrl = 'https://tocchien.net' + imageUrl;
            }

            // Check if this looks like an item image
            const alt = $img.attr('alt') || '';
            const title = $img.attr('title') || '';
            const src = imageUrl.toLowerCase();

            if (
              alt.includes(itemName) ||
              title.includes(itemName) ||
              src.includes('item') ||
              src.includes('equipment') ||
              src.includes('icon')
            ) {
              console.log(`Found potential image: ${imageUrl}`);
              foundImage = imageUrl;
              return false; // Stop iteration
            }
          }
        });

        if (foundImage) {
          return foundImage;
        }

        return null;
      } catch (error) {
        console.log(`Failed to fetch ${url}: ${error.message}`);
        return null;
      }
    };

    // Function to search for images using external sources
    const searchExternalImages = async (
      itemName: string,
    ): Promise<string | null> => {
      try {
        // Try searching for Wild Rift item images from common sources
        const externalSources = [
          `https://lolwildriftbuild.com/items/${itemName.toLowerCase().replace(/\s+/g, '-')}`,
          `https://wildriftfire.com/items/${itemName.toLowerCase().replace(/\s+/g, '-')}`,
          `https://app.mobalytics.gg/lol/items/${itemName.toLowerCase().replace(/\s+/g, '-')}`,
        ];

        for (const sourceUrl of externalSources) {
          try {
            const response = await axios.get(sourceUrl, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
              timeout: 10000,
            });

            const $ = cheerio.load(response.data);

            const $img = $(
              'img[src*="item"], img[src*="icon"], .item-image img',
            ).first();
            if ($img.length > 0) {
              const imageUrl = $img.attr('src') || '';
              if (imageUrl && imageUrl.startsWith('http')) {
                console.log(`Found external image: ${imageUrl}`);
                return imageUrl;
              }
            }
          } catch (error) {
            // Continue to next source
          }
        }

        return null;
      } catch (error) {
        return null;
      }
    };

    for (const item of items) {
      try {
        console.log(`\nProcessing item: ${item.name}`);

        let foundImageUrl: string | null = null;

        // Try each search strategy
        for (let i = 0; i < searchStrategies.length && !foundImageUrl; i++) {
          const url = searchStrategies[i](item.name);
          foundImageUrl = await extractImageFromPage(url, item.name);

          if (foundImageUrl) {
            console.log(
              `Found image using strategy ${i + 1}: ${foundImageUrl}`,
            );
            break;
          }

          // Add delay between requests
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // If still no image found, try external sources
        if (!foundImageUrl) {
          console.log('Trying external sources...');
          foundImageUrl = await searchExternalImages(item.name);
        }

        // Update item in database if image found
        if (foundImageUrl) {
          await itemModel.updateOne(
            { _id: item._id },
            {
              $set: {
                imageUrl: foundImageUrl,
                updatedAt: new Date(),
              },
            },
          );
          updatedCount++;
          console.log(`Updated image for: ${item.name}`);
        } else {
          console.log(`No image found for: ${item.name}`);
        }

        processedCount++;

        // Add delay to avoid overwhelming servers
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error processing ${item.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== IMAGE CRAWL SUMMARY ===');
    console.log(`Total items processed: ${processedCount}`);
    console.log(`Items with images found: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error('Error during image crawling:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
