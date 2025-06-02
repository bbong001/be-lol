import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { ChampionDocument } from '../schemas/champion.schema';

async function debugPantheonItems() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championModel = app.get('ChampionModel') as Model<ChampionDocument>;

    console.log('🔍 Debug Pantheon Items');
    console.log('=======================');

    const pantheon = await championModel.findOne({ id: 'Pantheon' }).lean();

    if (!pantheon) {
      console.log('❌ Pantheon not found');
      return;
    }

    console.log('🎯 Pantheon Recommended Items:');
    console.log('==============================');

    if (pantheon.recommendedItems && pantheon.recommendedItems.length > 0) {
      pantheon.recommendedItems.forEach((itemGroup, groupIndex) => {
        console.log(`\n📦 Item Group ${groupIndex + 1}:`);

        // Check starting items
        if (itemGroup.startingItems) {
          console.log('\n🚀 Starting Items:');
          itemGroup.startingItems.forEach((startGroup, startIndex) => {
            console.log(`  Start Group ${startIndex + 1}:`);
            if (startGroup.items) {
              startGroup.items.forEach((item, itemIndex) => {
                console.log(`    Item ${itemIndex + 1}:`);
                console.log(`      Type: ${typeof item}`);
                console.log(`      Value:`, JSON.stringify(item, null, 6));
              });
            }
          });
        }

        // Check boots
        if (itemGroup.boots) {
          console.log('\n👢 Boots:');
          itemGroup.boots.forEach((boot, bootIndex) => {
            console.log(`  Boot ${bootIndex + 1}:`);
            console.log(`    Name Type: ${typeof boot.name}`);
            console.log(`    Name Value:`, JSON.stringify(boot.name, null, 6));
          });
        }

        // Check core builds
        if (itemGroup.coreBuilds) {
          console.log('\n🔧 Core Builds:');
          itemGroup.coreBuilds.forEach((build, buildIndex) => {
            console.log(`  Build ${buildIndex + 1}:`);
            if (build.items) {
              build.items.forEach((item, itemIndex) => {
                console.log(`    Item ${itemIndex + 1}:`);
                console.log(`      Type: ${typeof item}`);
                console.log(`      Value:`, JSON.stringify(item, null, 6));
              });
            }
          });
        }

        // Check situational items
        if (itemGroup.situational) {
          console.log('\n🔄 Situational Items:');
          Object.keys(itemGroup.situational).forEach((key) => {
            console.log(`  ${key}:`);
            if (Array.isArray(itemGroup.situational[key])) {
              itemGroup.situational[key].forEach((item, itemIndex) => {
                console.log(`    Item ${itemIndex + 1}:`);
                console.log(`      Name Type: ${typeof item.name}`);
                console.log(
                  `      Name Value:`,
                  JSON.stringify(item.name, null, 6),
                );
                console.log(`      Full Item:`, JSON.stringify(item, null, 6));
              });
            }
          });
        }
      });
    } else {
      console.log('❌ No recommended items found');
    }
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

debugPantheonItems().catch(console.error);
