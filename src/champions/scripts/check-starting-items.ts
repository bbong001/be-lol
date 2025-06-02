import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { ChampionDocument } from '../schemas/champion.schema';

async function checkStartingItems() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championModel = app.get('ChampionModel') as Model<ChampionDocument>;

    console.log('🔍 Checking Starting Items Conversion (startingItems field)');
    console.log('===========================================================');

    const champions = await championModel.find().lean();
    let totalStartingItems = 0;
    let convertedItems = 0;
    let unconvertedItems = 0;
    const unconvertedChampions = [];
    const sampleUnconverted = new Set();

    for (const champion of champions) {
      let hasUnconvertedStartingItems = false;

      if (champion.recommendedItems && champion.recommendedItems.length > 0) {
        for (const itemGroup of champion.recommendedItems) {
          // Check startingItems field only (starting was renamed)
          if (itemGroup.startingItems) {
            console.log(`🎯 Found 'startingItems' field in ${champion.id}`);
            for (const startGroup of itemGroup.startingItems) {
              if (startGroup.items) {
                for (const item of startGroup.items) {
                  totalStartingItems++;
                  if (typeof item === 'string') {
                    unconvertedItems++;
                    sampleUnconverted.add(item);
                    hasUnconvertedStartingItems = true;
                    console.log(
                      `❌ Unconverted startingItems in ${champion.id}: "${item}"`,
                    );
                  } else if (typeof item === 'object' && item.en && item.vi) {
                    convertedItems++;
                  } else {
                    console.log(
                      `⚠️  Unknown startingItems format in ${champion.id}:`,
                      typeof item,
                      item,
                    );
                  }
                }
              }
            }
          }
        }
      }

      if (hasUnconvertedStartingItems) {
        unconvertedChampions.push(champion.id);
      }
    }

    console.log(`\n📊 Starting Items Analysis:`);
    console.log(`Total starting items found: ${totalStartingItems}`);
    console.log(`✅ Converted: ${convertedItems}`);
    console.log(`❌ Unconverted: ${unconvertedItems}`);
    console.log(
      `Champions with unconverted starting items: ${unconvertedChampions.length}`,
    );

    if (unconvertedChampions.length > 0) {
      console.log(`\n❌ Champions with unconverted starting items:`);
      unconvertedChampions.slice(0, 10).forEach((id) => console.log(`- ${id}`));
      if (unconvertedChampions.length > 10) {
        console.log(`... and ${unconvertedChampions.length - 10} more`);
      }
    }

    if (sampleUnconverted.size > 0) {
      console.log(`\n🔸 Sample unconverted starting items:`);
      Array.from(sampleUnconverted)
        .slice(0, 15)
        .forEach((item) => console.log(`- "${item}"`));
    }

    return {
      totalStartingItems,
      convertedItems,
      unconvertedItems,
      unconvertedChampions: unconvertedChampions.length,
      sampleItems: Array.from(sampleUnconverted),
    };
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await app.close();
  }
}

checkStartingItems().catch(console.error);
