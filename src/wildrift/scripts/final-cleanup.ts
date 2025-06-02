import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';

async function finalCleanup() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    console.log('🧹 Final cleanup and comprehensive report...');

    // Fix the last 3 items without prices
    const lastItems = {
      'Boots of Furor': 1400,
      'Revival Enchant': 1500,
      'Protect Enchant': 1500,
    };

    let finalUpdated = 0;

    for (const [itemName, correctPrice] of Object.entries(lastItems)) {
      try {
        const item = await itemModel.findOne({
          name: {
            $regex: new RegExp(
              itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
              'i',
            ),
          },
        });

        if (item && (!item.price || item.price === 0)) {
          await itemModel.findByIdAndUpdate(item._id, { price: correctPrice });
          console.log(`✅ Final update: ${item.name} → ${correctPrice} gold`);
          finalUpdated++;
        } else if (item) {
          console.log(`ℹ️ ${item.name}: already has price (${item.price})`);
        } else {
          console.log(`⚠️ Item not found: ${itemName}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${itemName}:`, error.message);
      }
    }

    // Generate comprehensive report
    console.log('\n📊 COMPREHENSIVE DATABASE REPORT');
    console.log('='.repeat(50));

    const allItems = await itemModel.find({}).lean();
    const totalItems = allItems.length;

    // Price analysis
    const itemsWithPrice = allItems.filter(
      (item) => item.price && item.price > 0,
    );
    const itemsWithoutPrice = allItems.filter(
      (item) => !item.price || item.price === 0,
    );
    const itemsWithWrongPrice = allItems.filter(
      (item) => item.price && item.price > 10000,
    );

    console.log(`\n💰 PRICE ANALYSIS:`);
    console.log(`   Total items: ${totalItems}`);
    console.log(
      `   ✅ Items with valid price: ${itemsWithPrice.length} (${((itemsWithPrice.length / totalItems) * 100).toFixed(1)}%)`,
    );
    console.log(
      `   ❌ Items without price: ${itemsWithoutPrice.length} (${((itemsWithoutPrice.length / totalItems) * 100).toFixed(1)}%)`,
    );
    console.log(`   ⚠️ Items with wrong price: ${itemsWithWrongPrice.length}`);

    // Stats analysis
    const itemsWithStats = allItems.filter(
      (item) => item.stats && Object.keys(item.stats).length > 0,
    );
    const itemsWithoutStats = allItems.filter(
      (item) => !item.stats || Object.keys(item.stats).length === 0,
    );

    console.log(`\n📈 STATS ANALYSIS:`);
    console.log(
      `   ✅ Items with stats: ${itemsWithStats.length} (${((itemsWithStats.length / totalItems) * 100).toFixed(1)}%)`,
    );
    console.log(
      `   ❌ Items without stats: ${itemsWithoutStats.length} (${((itemsWithoutStats.length / totalItems) * 100).toFixed(1)}%)`,
    );

    // Description analysis
    const itemsWithDescription = allItems.filter(
      (item) => item.description && item.description !== 'Physical item',
    );
    const itemsWithoutDescription = allItems.filter(
      (item) => !item.description || item.description === 'Physical item',
    );

    console.log(`\n📝 DESCRIPTION ANALYSIS:`);
    console.log(
      `   ✅ Items with detailed description: ${itemsWithDescription.length} (${((itemsWithDescription.length / totalItems) * 100).toFixed(1)}%)`,
    );
    console.log(
      `   ❌ Items without description: ${itemsWithoutDescription.length} (${((itemsWithoutDescription.length / totalItems) * 100).toFixed(1)}%)`,
    );

    // Image analysis
    const itemsWithImage = allItems.filter((item) => item.imageUrl);
    const itemsWithoutImage = allItems.filter((item) => !item.imageUrl);

    console.log(`\n🖼️ IMAGE ANALYSIS:`);
    console.log(
      `   ✅ Items with image: ${itemsWithImage.length} (${((itemsWithImage.length / totalItems) * 100).toFixed(1)}%)`,
    );
    console.log(
      `   ❌ Items without image: ${itemsWithoutImage.length} (${((itemsWithoutImage.length / totalItems) * 100).toFixed(1)}%)`,
    );

    // Category breakdown
    const categoryStats = {};
    allItems.forEach((item) => {
      const category = item.category || 'Unknown';
      if (!categoryStats[category]) {
        categoryStats[category] = {
          total: 0,
          withPrice: 0,
          withStats: 0,
          withDescription: 0,
        };
      }
      categoryStats[category].total++;
      if (item.price && item.price > 0) categoryStats[category].withPrice++;
      if (item.stats && Object.keys(item.stats).length > 0)
        categoryStats[category].withStats++;
      if (item.description && item.description !== 'Physical item')
        categoryStats[category].withDescription++;
    });

    console.log(`\n📂 CATEGORY BREAKDOWN:`);
    Object.entries(categoryStats).forEach(
      ([category, stats]: [string, any]) => {
        console.log(`   ${category}: ${stats.total} items`);
        console.log(
          `      💰 With price: ${stats.withPrice}/${stats.total} (${((stats.withPrice / stats.total) * 100).toFixed(1)}%)`,
        );
        console.log(
          `      📈 With stats: ${stats.withStats}/${stats.total} (${((stats.withStats / stats.total) * 100).toFixed(1)}%)`,
        );
        console.log(
          `      📝 With description: ${stats.withDescription}/${stats.total} (${((stats.withDescription / stats.total) * 100).toFixed(1)}%)`,
        );
      },
    );

    // Items with apostrophes analysis
    const apostropheItems = allItems.filter((item) => item.name.includes("'"));
    const apostropheItemsWithPrice = apostropheItems.filter(
      (item) => item.price && item.price > 0,
    );

    console.log(`\n📝 APOSTROPHE ITEMS ANALYSIS:`);
    console.log(`   Total items with apostrophes: ${apostropheItems.length}`);
    console.log(
      `   ✅ With valid price: ${apostropheItemsWithPrice.length}/${apostropheItems.length} (${((apostropheItemsWithPrice.length / apostropheItems.length) * 100).toFixed(1)}%)`,
    );

    // Price range analysis
    const validPrices = itemsWithPrice
      .map((item) => item.price)
      .sort((a, b) => a - b);
    if (validPrices.length > 0) {
      console.log(`\n💎 PRICE RANGE ANALYSIS:`);
      console.log(`   Cheapest item: ${validPrices[0]} gold`);
      console.log(
        `   Most expensive item: ${validPrices[validPrices.length - 1]} gold`,
      );
      console.log(
        `   Average price: ${Math.round(validPrices.reduce((a, b) => a + b, 0) / validPrices.length)} gold`,
      );
      console.log(
        `   Median price: ${validPrices[Math.floor(validPrices.length / 2)]} gold`,
      );
    }

    // Final summary
    console.log(`\n🎉 FINAL SUMMARY:`);
    console.log(
      `   📊 Database completeness: ${((itemsWithPrice.length / totalItems) * 100).toFixed(1)}%`,
    );
    console.log(`   🔧 Items updated in this session: ${finalUpdated}`);
    console.log(
      `   ✅ Total items with complete data: ${
        itemsWithPrice.filter(
          (item) =>
            item.stats &&
            Object.keys(item.stats).length > 0 &&
            item.description &&
            item.description !== 'Physical item',
        ).length
      }`,
    );

    if (itemsWithoutPrice.length > 0) {
      console.log(`\n❌ Remaining items without price:`);
      itemsWithoutPrice.forEach((item) => {
        console.log(`   ${item.name} (${item.category || 'Unknown'})`);
      });
    }

    console.log('\n✨ Database update completed successfully!');
  } catch (error) {
    console.error('❌ Error in final cleanup:', error);
  } finally {
    await app.close();
  }
}

finalCleanup();
