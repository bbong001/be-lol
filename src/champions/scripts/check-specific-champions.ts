import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { ChampionDocument } from '../schemas/champion.schema';

async function checkSpecificChampions() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championModel = app.get('ChampionModel') as Model<ChampionDocument>;

    console.log('🔍 Checking Specific Champions');
    console.log('==============================');

    const championsToCheck = ['Pantheon', 'Ornn', 'Ahri', 'Aatrox', 'Annie'];

    for (const championId of championsToCheck) {
      console.log(`\n🎯 Checking ${championId}:`);

      const champion = await championModel.findOne({ id: championId }).lean();

      if (!champion) {
        console.log(`❌ ${championId} not found`);
        continue;
      }

      console.log(`Name type: ${typeof champion.name}`);
      console.log(`Name value:`, JSON.stringify(champion.name, null, 2));

      console.log(`Title type: ${typeof champion.title}`);
      console.log(`Title value:`, JSON.stringify(champion.title, null, 2));

      // Check recommended runes
      if (champion.recommendedRunes && champion.recommendedRunes.length > 0) {
        console.log(
          `Recommended Runes: ${champion.recommendedRunes.length} groups`,
        );
        const firstRune = champion.recommendedRunes[0];
        if (firstRune.primaryTree?.name) {
          console.log(
            `Primary Tree:`,
            JSON.stringify(firstRune.primaryTree.name, null, 2),
          );
        }
      } else {
        console.log(`Recommended Runes: None`);
      }

      // Check recommended items
      if (champion.recommendedItems && champion.recommendedItems.length > 0) {
        console.log(
          `Recommended Items: ${champion.recommendedItems.length} groups`,
        );
        const firstItems = champion.recommendedItems[0];
        if (
          firstItems.startingItems &&
          firstItems.startingItems[0]?.items?.[0]
        ) {
          console.log(
            `First Starting Item:`,
            JSON.stringify(firstItems.startingItems[0].items[0], null, 2),
          );
        }
      } else {
        console.log(`Recommended Items: None`);
      }

      console.log('---');
    }
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

checkSpecificChampions().catch(console.error);
