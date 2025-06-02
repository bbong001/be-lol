import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';

async function checkApostropheItems() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    console.log('🔍 Checking apostrophe items status...');

    // Find all items with apostrophes
    const apostropheItems = await itemModel
      .find({
        name: { $regex: /'/ },
      })
      .lean();

    console.log(`📋 Total items with apostrophes: ${apostropheItems.length}`);

    // Categorize items by their detail status
    const itemsWithStats = apostropheItems.filter(
      (item) => item.stats && Object.keys(item.stats).length > 0,
    );

    const itemsWithoutStats = apostropheItems.filter(
      (item) => !item.stats || Object.keys(item.stats).length === 0,
    );

    const itemsWithDescription = apostropheItems.filter(
      (item) =>
        item.description &&
        item.description !== 'Physical item' &&
        item.description.length > 10,
    );

    const itemsWithoutDescription = apostropheItems.filter(
      (item) =>
        !item.description ||
        item.description === 'Physical item' ||
        item.description.length <= 10,
    );

    console.log('\n📊 STATS ANALYSIS:');
    console.log(`✅ Items with stats: ${itemsWithStats.length}`);
    console.log(`❌ Items without stats: ${itemsWithoutStats.length}`);

    console.log('\n📝 DESCRIPTION ANALYSIS:');
    console.log(`✅ Items with description: ${itemsWithDescription.length}`);
    console.log(
      `❌ Items without description: ${itemsWithoutDescription.length}`,
    );

    // Show items that need details
    const itemsNeedingDetails = apostropheItems.filter(
      (item) =>
        !item.stats ||
        Object.keys(item.stats).length === 0 ||
        !item.description ||
        item.description === 'Physical item' ||
        item.description.length <= 10,
    );

    if (itemsNeedingDetails.length > 0) {
      console.log(
        `\n🚨 Items needing details (${itemsNeedingDetails.length}):`,
      );
      itemsNeedingDetails.forEach((item) => {
        const hasStats = item.stats && Object.keys(item.stats).length > 0;
        const hasDesc =
          item.description &&
          item.description !== 'Physical item' &&
          item.description.length > 10;
        console.log(`   ${item.name}`);
        console.log(
          `      📈 Stats: ${hasStats ? '✅' : '❌'} (${Object.keys(item.stats || {}).length} properties)`,
        );
        console.log(
          `      📝 Description: ${hasDesc ? '✅' : '❌'} (${item.description || 'None'})`,
        );
        console.log(`      💰 Price: ${item.price || 0} gold`);
        console.log(`      🏷️ Category: ${item.category || 'Unknown'}`);
        console.log('');
      });
    } else {
      console.log('\n🎉 All apostrophe items have complete details!');
    }

    // Show items with complete details
    const completeItems = apostropheItems.filter(
      (item) =>
        item.stats &&
        Object.keys(item.stats).length > 0 &&
        item.description &&
        item.description !== 'Physical item' &&
        item.description.length > 10,
    );

    if (completeItems.length > 0) {
      console.log(
        `\n✅ Items with complete details (${completeItems.length}):`,
      );
      completeItems.slice(0, 10).forEach((item) => {
        console.log(
          `   ${item.name} - ${Object.keys(item.stats).length} stats, ${item.description.substring(0, 50)}...`,
        );
      });

      if (completeItems.length > 10) {
        console.log(`   ... and ${completeItems.length - 10} more items`);
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log(`Total apostrophe items: ${apostropheItems.length}`);
    console.log(
      `Complete items: ${completeItems.length} (${((completeItems.length / apostropheItems.length) * 100).toFixed(1)}%)`,
    );
    console.log(
      `Items needing details: ${itemsNeedingDetails.length} (${((itemsNeedingDetails.length / apostropheItems.length) * 100).toFixed(1)}%)`,
    );
  } catch (error) {
    console.error('❌ Error checking apostrophe items:', error);
  } finally {
    await app.close();
  }
}

checkApostropheItems();
