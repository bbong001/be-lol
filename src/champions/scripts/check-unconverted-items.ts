import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { ChampionDocument } from '../schemas/champion.schema';

async function checkUnconvertedItems() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championModel = app.get('ChampionModel') as Model<ChampionDocument>;

    console.log('🔍 Checking Unconverted Items');
    console.log('=============================');

    const champions = await championModel.find().lean();
    const unconvertedItems = new Set();
    const unconvertedChampions = [];

    for (const champion of champions) {
      let hasUnconvertedItems = false;

      if (champion.recommendedItems && champion.recommendedItems.length > 0) {
        for (const itemGroup of champion.recommendedItems) {
          // Check starting items
          if (itemGroup.startingItems) {
            for (const startGroup of itemGroup.startingItems) {
              if (startGroup.items) {
                for (const item of startGroup.items) {
                  if (typeof item === 'string') {
                    unconvertedItems.add(item);
                    hasUnconvertedItems = true;
                  }
                }
              }
            }
          }

          // Check boots
          if (itemGroup.boots) {
            for (const boot of itemGroup.boots) {
              if (boot.name && typeof boot.name === 'string') {
                unconvertedItems.add(boot.name);
                hasUnconvertedItems = true;
              }
            }
          }

          // Check core builds
          if (itemGroup.coreBuilds) {
            for (const build of itemGroup.coreBuilds) {
              if (build.items) {
                for (const item of build.items) {
                  if (typeof item === 'string') {
                    unconvertedItems.add(item);
                    hasUnconvertedItems = true;
                  }
                }
              }
            }
          }

          // Check situational items
          if (itemGroup.situational) {
            for (const key of Object.keys(itemGroup.situational)) {
              if (Array.isArray(itemGroup.situational[key])) {
                for (const item of itemGroup.situational[key]) {
                  if (item.name && typeof item.name === 'string') {
                    unconvertedItems.add(item.name);
                    hasUnconvertedItems = true;
                  }
                }
              }
            }
          }
        }
      }

      if (hasUnconvertedItems) {
        unconvertedChampions.push(champion.id);
      }
    }

    console.log(`\n📊 Analysis Results:`);
    console.log(`Total champions: ${champions.length}`);
    console.log(
      `Champions with unconverted items: ${unconvertedChampions.length}`,
    );
    console.log(`Unique unconverted items: ${unconvertedItems.size}`);

    if (unconvertedChampions.length > 0) {
      console.log(`\n❌ Champions with unconverted items:`);
      unconvertedChampions.slice(0, 10).forEach((id) => console.log(`- ${id}`));
      if (unconvertedChampions.length > 10) {
        console.log(`... and ${unconvertedChampions.length - 10} more`);
      }
    }

    if (unconvertedItems.size > 0) {
      console.log(`\n🔸 Unconverted items found:`);
      Array.from(unconvertedItems)
        .slice(0, 20)
        .forEach((item) => console.log(`- "${item}"`));
      if (unconvertedItems.size > 20) {
        console.log(`... and ${unconvertedItems.size - 20} more`);
      }
    }

    return {
      totalChampions: champions.length,
      unconvertedChampions: unconvertedChampions.length,
      unconvertedItems: Array.from(unconvertedItems),
    };
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await app.close();
  }
}

checkUnconvertedItems().catch(console.error);
