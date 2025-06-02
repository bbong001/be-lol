import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const wrItemEnModel = app.get(getModelToken('WrItemsEn'));

  try {
    console.log('🔍 Checking WrItemsEn collection...');

    // Kiểm tra tổng số items
    const totalItems = await wrItemEnModel.countDocuments({});
    console.log(`📊 Total items in WrItemsEn: ${totalItems}`);

    if (totalItems === 0) {
      console.log('❌ No items found in WrItemsEn collection');
      return;
    }

    // Kiểm tra items có price
    const itemsWithPrice = await wrItemEnModel.countDocuments({
      price: { $exists: true, $ne: null, $gt: 0 },
    });
    console.log(`💰 Items with price: ${itemsWithPrice}/${totalItems}`);

    // Lấy một số sample items
    const sampleItems = await wrItemEnModel.find({}).limit(10).lean();

    console.log('\n📋 Sample items:');
    sampleItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name}`);
      console.log(`   Price: ${item.price || 'N/A'}`);
      console.log(
        `   Description: ${item.description?.substring(0, 50) || 'N/A'}...`,
      );
      console.log('');
    });

    // Kiểm tra items có price cụ thể
    const itemsWithPriceDetails = await wrItemEnModel
      .find({
        price: { $exists: true, $ne: null, $gt: 0 },
      })
      .limit(10)
      .lean();

    console.log('\n💰 Items with price details:');
    itemsWithPriceDetails.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name}: ${item.price} gold`);
    });

    // Thống kê price range
    const priceStats = await wrItemEnModel.aggregate([
      {
        $match: {
          price: { $exists: true, $ne: null, $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgPrice: { $avg: '$price' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (priceStats.length > 0) {
      const stats = priceStats[0];
      console.log('\n📈 Price statistics:');
      console.log(`   Min price: ${stats.minPrice} gold`);
      console.log(`   Max price: ${stats.maxPrice} gold`);
      console.log(`   Average price: ${Math.round(stats.avgPrice)} gold`);
      console.log(`   Items with price: ${stats.count}`);
    }
  } catch (error) {
    console.error('💥 Error checking WrItemsEn:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
