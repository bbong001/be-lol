import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TftItem } from '../schemas/tft-item.schema';

async function migrateItemsToI18n() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const tftItemModel = app.get<Model<TftItem>>(getModelToken(TftItem.name));

    console.log('🌍 Starting TFT Items Migration to Multilingual Format');
    console.log('='.repeat(60));

    // Count total items to migrate
    const totalItems = await tftItemModel.countDocuments();
    console.log(`📊 Total items to migrate: ${totalItems}`);

    if (totalItems === 0) {
      console.log('✅ No items found to migrate');
      return;
    }

    // Get items in batches to avoid memory issues
    const batchSize = 50;
    let processed = 0;
    let migrated = 0;
    let skipped = 0;

    while (processed < totalItems) {
      const items = await tftItemModel
        .find({})
        .skip(processed)
        .limit(batchSize)
        .lean();

      for (const item of items) {
        try {
          // Check if item is already migrated (has multilingual name)
          if (item.name && typeof item.name === 'object' && item.name.en) {
            console.log(`⏭️  Skipping already migrated item: ${item.name.en}`);
            skipped++;
            continue;
          }

          // Only migrate if name is a string
          if (typeof item.name === 'string') {
            const updateData: any = {
              name: {
                en: item.name,
                vi: item.name, // Default to same value, will need manual translation
              },
            };

            // Handle description if it exists and is a string
            if (item.description && typeof item.description === 'string') {
              updateData.description = {
                en: item.description,
                vi: item.description, // Default to same value, will need manual translation
              };
            }

            // Update the item
            await tftItemModel.updateOne({ _id: item._id }, updateData);

            console.log(
              `✅ Migrated item: ${item.name} → ${updateData.name.en}`,
            );
            migrated++;
          } else {
            console.log(
              `⚠️  Skipping item with invalid name format: ${item._id}`,
            );
            skipped++;
          }
        } catch (error) {
          console.error(`❌ Error migrating item ${item._id}:`, error.message);
        }
      }

      processed += items.length;
      console.log(`📈 Progress: ${processed}/${totalItems} items processed`);
    }

    // Final report
    console.log('\n🎉 MIGRATION SUMMARY');
    console.log('='.repeat(30));
    console.log(`✅ Successfully migrated: ${migrated} items`);
    console.log(`⏭️  Already migrated (skipped): ${skipped} items`);
    console.log(`📊 Total processed: ${processed} items`);

    // Verify migration
    console.log('\n🔍 VERIFYING MIGRATION');
    console.log('='.repeat(30));

    const multilingualItems = await tftItemModel.countDocuments({
      'name.en': { $exists: true },
    });

    console.log(`✅ Items with multilingual names: ${multilingualItems}`);

    if (multilingualItems === totalItems) {
      console.log('🎉 All items successfully migrated!');
    } else {
      console.log(
        `⚠️  ${totalItems - multilingualItems} items still need migration`,
      );
    }

    // Show sample migrated items
    console.log('\n📝 SAMPLE MIGRATED ITEMS');
    console.log('='.repeat(30));

    const sampleItems = await tftItemModel
      .find({ 'name.en': { $exists: true } })
      .limit(3)
      .lean();

    sampleItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name.en} (${item.name.vi})`);
      if (item.description) {
        console.log(`   Description: ${item.description.en}`);
      }
    });

    console.log('\n💡 NEXT STEPS:');
    console.log('- Review migrated data for accuracy');
    console.log(
      '- Add Vietnamese translations for item names and descriptions',
    );
    console.log('- Update existing API consumers to use lang parameter');
    console.log('- Test the new multilingual endpoints');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

// Run the migration
migrateItemsToI18n();
