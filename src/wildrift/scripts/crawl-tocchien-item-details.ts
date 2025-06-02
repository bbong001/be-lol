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
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const wildriftService = app.get(WildriftService);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    console.log(
      'Starting to crawl detailed item information from tocchien.net...',
    );

    // Get all items from database that need detail updates
    const items = await itemModel.find({}).lean();
    console.log(`Found ${items.length} items in database`);

    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const item of items) {
      try {
        console.log(`\nProcessing item: ${item.name}`);

        // Create URL for item detail page
        const itemSlug = item.name
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .trim();

        const detailUrl = `https://tocchien.net/items/${itemSlug}/`;
        console.log(`Fetching details from: ${detailUrl}`);

        // Fetch item detail page
        let htmlContent: string;
        try {
          const response = await axios.get(detailUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              Accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
            },
            timeout: 15000,
          });
          htmlContent = response.data;
        } catch (fetchError) {
          console.log(`Failed to fetch ${detailUrl}: ${fetchError.message}`);
          errorCount++;
          continue;
        }

        const $ = cheerio.load(htmlContent);

        // Parse item details from the page
        const itemDetail: Partial<ItemDetailData> = {
          name: item.name,
          category: item.category,
          patch: '5.0',
        };

        // Extract item image
        const $itemImage = $(
          'img[alt*="' + item.name + '"], .item-image img, .item-icon',
        ).first();
        if ($itemImage.length > 0) {
          let imageUrl =
            $itemImage.attr('src') || $itemImage.attr('data-src') || '';
          if (imageUrl && !imageUrl.startsWith('http')) {
            if (imageUrl.startsWith('//')) {
              imageUrl = 'https:' + imageUrl;
            } else if (imageUrl.startsWith('/')) {
              imageUrl = 'https://tocchien.net' + imageUrl;
            }
          }
          if (imageUrl) {
            itemDetail.imageUrl = imageUrl;
            console.log(`Found image: ${imageUrl}`);
          }
        }

        // Extract item description
        const $description = $(
          '.item-description, .description, .item-info p',
        ).first();
        if ($description.length > 0) {
          itemDetail.description = $description.text().trim();
          console.log(
            `Found description: ${itemDetail.description.substring(0, 100)}...`,
          );
        }

        // Extract item stats
        const stats: Record<string, any> = {};

        // Look for stats in various formats
        $('.stat-item, .item-stat, .stats li').each((i, el) => {
          const $stat = $(el);
          const statText = $stat.text().trim();

          // Parse stat text like "+50 Attack Damage" or "Sát thương tấn công: +50"
          const statMatch = statText.match(
            /([^:+\-0-9]+)[:+\-\s]*([0-9]+(?:\.[0-9]+)?)/,
          );
          if (statMatch) {
            const statName = statMatch[1].trim();
            const statValue = parseFloat(statMatch[2]);
            stats[statName] = statValue;
          }
        });

        // Also try to extract stats from text content
        const pageText = $('body').text();
        const statPatterns = [
          /sát thương tấn công[:\s]*\+?([0-9]+)/i,
          /attack damage[:\s]*\+?([0-9]+)/i,
          /sức mạnh phép thuật[:\s]*\+?([0-9]+)/i,
          /ability power[:\s]*\+?([0-9]+)/i,
          /máu[:\s]*\+?([0-9]+)/i,
          /health[:\s]*\+?([0-9]+)/i,
          /giáp[:\s]*\+?([0-9]+)/i,
          /armor[:\s]*\+?([0-9]+)/i,
          /kháng phép[:\s]*\+?([0-9]+)/i,
          /magic resist[:\s]*\+?([0-9]+)/i,
          /tốc độ tấn công[:\s]*\+?([0-9]+)%?/i,
          /attack speed[:\s]*\+?([0-9]+)%?/i,
        ];

        statPatterns.forEach((pattern) => {
          const match = pageText.match(pattern);
          if (match) {
            const value = parseInt(match[1]);
            if (
              pattern.source.includes('sát thương') ||
              pattern.source.includes('attack damage')
            ) {
              stats['Attack Damage'] = value;
            } else if (
              pattern.source.includes('phép thuật') ||
              pattern.source.includes('ability power')
            ) {
              stats['Ability Power'] = value;
            } else if (
              pattern.source.includes('máu') ||
              pattern.source.includes('health')
            ) {
              stats['Health'] = value;
            } else if (
              pattern.source.includes('giáp') ||
              pattern.source.includes('armor')
            ) {
              stats['Armor'] = value;
            } else if (
              pattern.source.includes('kháng') ||
              pattern.source.includes('magic resist')
            ) {
              stats['Magic Resistance'] = value;
            } else if (
              pattern.source.includes('tốc độ') ||
              pattern.source.includes('attack speed')
            ) {
              stats['Attack Speed'] = value;
            }
          }
        });

        if (Object.keys(stats).length > 0) {
          itemDetail.stats = stats;
          console.log(`Found stats:`, stats);
        }

        // Extract item price
        const priceText = $('.price, .item-price, .cost').text();
        const priceMatch = priceText.match(/([0-9,]+)/);
        if (priceMatch) {
          itemDetail.price = parseInt(priceMatch[1].replace(/,/g, ''));
          console.log(`Found price: ${itemDetail.price}`);
        }

        // Extract active/passive abilities
        const $active = $(
          '.active-ability, .item-active, .passive-ability',
        ).first();
        if ($active.length > 0) {
          itemDetail.isActive = true;
          itemDetail.activeDescription = $active.text().trim();

          // Try to extract cooldown
          const cooldownMatch = itemDetail.activeDescription.match(
            /([0-9]+)\s*giây|([0-9]+)\s*seconds?/i,
          );
          if (cooldownMatch) {
            itemDetail.cooldown = parseInt(
              cooldownMatch[1] || cooldownMatch[2],
            );
          }

          console.log(
            `Found active ability: ${itemDetail.activeDescription.substring(0, 100)}...`,
          );
        }

        // Extract build components
        const buildsFrom: string[] = [];
        const buildsInto: string[] = [];

        $('.builds-from a, .components a').each((i, el) => {
          const componentName = $(el).text().trim();
          if (componentName && componentName !== item.name) {
            buildsFrom.push(componentName);
          }
        });

        $('.builds-into a, .upgrades a').each((i, el) => {
          const upgradeName = $(el).text().trim();
          if (upgradeName && upgradeName !== item.name) {
            buildsInto.push(upgradeName);
          }
        });

        if (buildsFrom.length > 0) {
          itemDetail.buildsFrom = buildsFrom;
          console.log(`Builds from: ${buildsFrom.join(', ')}`);
        }

        if (buildsInto.length > 0) {
          itemDetail.buildsInto = buildsInto;
          console.log(`Builds into: ${buildsInto.join(', ')}`);
        }

        // Update item in database
        const updateData: any = {};

        if (itemDetail.description)
          updateData.description = itemDetail.description;
        if (itemDetail.stats) updateData.stats = itemDetail.stats;
        if (itemDetail.price !== undefined) updateData.price = itemDetail.price;
        if (itemDetail.buildsFrom)
          updateData.buildsFrom = itemDetail.buildsFrom;
        if (itemDetail.buildsInto)
          updateData.buildsInto = itemDetail.buildsInto;
        if (itemDetail.isActive !== undefined)
          updateData.isActive = itemDetail.isActive;
        if (itemDetail.activeDescription)
          updateData.activeDescription = itemDetail.activeDescription;
        if (itemDetail.cooldown !== undefined)
          updateData.cooldown = itemDetail.cooldown;
        if (itemDetail.imageUrl) updateData.imageUrl = itemDetail.imageUrl;

        if (Object.keys(updateData).length > 0) {
          await itemModel.updateOne(
            { _id: item._id },
            { $set: { ...updateData, updatedAt: new Date() } },
          );
          updatedCount++;
          console.log(`Updated item: ${item.name}`);
        } else {
          console.log(`No new data found for: ${item.name}`);
        }

        processedCount++;

        // Add delay to avoid overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing ${item.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== DETAIL CRAWL SUMMARY ===');
    console.log(`Total items processed: ${processedCount}`);
    console.log(`Items updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);
  } catch (error) {
    console.error('Error during detail crawling:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
