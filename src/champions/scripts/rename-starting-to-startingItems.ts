import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { ChampionDocument } from '../schemas/champion.schema';

async function renameStartingToStartingItems() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championModel = app.get('ChampionModel') as Model<ChampionDocument>;

    console.log('🔄 Renaming "starting" to "startingItems"');
    console.log('=========================================');

    const champions = await championModel.find().lean();
    let processedCount = 0;
    let updatedCount = 0;
    let renamedFieldsCount = 0;

    for (const champion of champions) {
      try {
        console.log(`🔄 Processing ${champion.id}...`);
        processedCount++;

        const updateData: any = {};
        let needsUpdate = false;

        if (champion.recommendedItems && champion.recommendedItems.length > 0) {
          const updatedRecommendedItems = champion.recommendedItems.map(
            (itemGroup) => {
              const newItemGroup = { ...itemGroup };

              // Check if has 'starting' field
              if (newItemGroup.starting) {
                console.log(
                  `✅ Found 'starting' field in ${champion.id}, renaming to 'startingItems'`,
                );

                // Rename 'starting' to 'startingItems'
                newItemGroup.startingItems = newItemGroup.starting;
                delete newItemGroup.starting;

                renamedFieldsCount++;
                needsUpdate = true;
              }

              return newItemGroup;
            },
          );

          if (needsUpdate) {
            updateData.recommendedItems = updatedRecommendedItems;
          }
        }

        // Update in database
        if (needsUpdate) {
          await championModel.updateOne(
            { _id: champion._id },
            { $set: updateData },
          );
          updatedCount++;
          console.log(`✅ Updated ${champion.id}`);
        } else {
          console.log(`⏭️  No updates needed for ${champion.id}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${champion.id}:`, error.message);
      }
    }

    console.log(`\n📊 Rename Summary:`);
    console.log(`✅ Processed: ${processedCount}`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`🔄 Renamed fields: ${renamedFieldsCount}`);

    return { processedCount, updatedCount, renamedFieldsCount };
  } catch (error) {
    console.error('❌ Rename failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

renameStartingToStartingItems().catch(console.error);
