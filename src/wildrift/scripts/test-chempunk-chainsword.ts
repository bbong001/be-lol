import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { WildriftService } from '../wildrift.service';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { getModelToken } from '@nestjs/mongoose';

async function testChempunkChainsword() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    const itemUrl = 'https://lolwildriftbuild.com/item/chempunk-chainsword/';
    console.log('🔍 Testing Chempunk Chainsword crawling from:', itemUrl);

    const response = await axios.get(itemUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    // Extract all information
    const itemName = $('h1').first().text().trim();
    const category = $('.breadcrumb a').last().text().trim() || 'Physical';

    // Get cost
    const costElement = $('h3:contains("Cost")').next();
    const costText = costElement.text().trim();
    console.log('💰 Raw cost text:', costText);

    // Parse cost more carefully - look for the actual price number
    let cost = 2800; // default for Chempunk Chainsword
    if (costText.includes('2800')) {
      cost = 2800;
    } else {
      // Try to find 4-digit numbers that look like item costs
      const costMatch = costText.match(/\b(\d{4})\b/);
      if (costMatch) {
        cost = parseInt(costMatch[1]);
      }
    }

    // Get stats
    const statsElement = $('h3:contains("Stats")').next();
    const statsText = statsElement.text();
    console.log('📊 Raw stats text:', statsText);

    const stats: Record<string, any> = {};

    // Parse stats patterns for Chempunk Chainsword
    const statPatterns = [
      { pattern: /\+(\d+)\s+Max\s+health/gi, name: 'Max Health' },
      { pattern: /\+(\d+)\s+Attack\s+Damage/gi, name: 'Attack Damage' },
      { pattern: /\+(\d+)\s+Ability\s+Haste/gi, name: 'Ability Haste' },
    ];

    statPatterns.forEach(({ pattern, name }) => {
      const matches = statsText.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          const value = parseInt(match.replace(/[^\d]/g, ''));
          if (!isNaN(value)) {
            stats[name] = value;
          }
        });
      }
    });

    // Get description
    const descriptionElement = $('h3:contains("Item Description")').next();
    const description =
      descriptionElement.text().trim() ||
      'Punishment: Dealing physical damage to enemy champions applies 50% Grievous Wounds for 3 seconds.';

    console.log('\n📋 Extracted Information:');
    console.log('Name:', itemName);
    console.log('Category:', category);
    console.log('Cost:', cost);
    console.log('Stats:', stats);
    console.log('Description:', description);

    // Update database
    const existingItem = await itemModel.findOne({
      name: { $regex: new RegExp('Chempunk Chainsword', 'i') },
    });

    if (existingItem) {
      console.log('\n🔍 Found existing item in database:', existingItem.name);
      console.log('Current price:', existingItem.price);
      console.log('Current stats:', existingItem.stats);
      console.log('Current description:', existingItem.description);

      const updateData = {
        price: cost,
        stats: {
          'Max Health': 250,
          'Attack Damage': 45,
          'Ability Haste': 15,
        },
        description:
          'Punishment: Dealing physical damage to enemy champions applies 50% Grievous Wounds for 3 seconds.',
        activeDescription:
          'Punishment: Dealing physical damage to enemy champions applies 50% Grievous Wounds for 3 seconds.',
        category: 'Physical',
        patch: '5.0.0',
      };

      await itemModel.findByIdAndUpdate(existingItem._id, updateData);
      console.log(
        '\n✅ Updated Chempunk Chainsword with detailed information!',
      );

      // Verify update
      const updatedItem = await itemModel.findById(existingItem._id);
      console.log('\n🔄 After update:');
      console.log('Price:', updatedItem.price);
      console.log('Stats:', updatedItem.stats);
      console.log('Description:', updatedItem.description);
    } else {
      console.log('\n⚠️ Chempunk Chainsword not found in database');

      // Show all items to see what we have
      const allItems = await itemModel.find({}).select('name').limit(10);
      console.log('Available items (first 10):');
      allItems.forEach((item) => console.log('  -', item.name));
    }
  } catch (error) {
    console.error('❌ Error testing Chempunk Chainsword:', error.message);
  } finally {
    await app.close();
  }
}

testChempunkChainsword();
