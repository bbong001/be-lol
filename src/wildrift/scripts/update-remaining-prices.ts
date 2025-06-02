import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';

// Mapping giá mặc định dựa trên tên và loại item
const DEFAULT_PRICES: Record<string, number> = {
  // Items không có trong WrItemsEn - dựa trên tên và loại tương tự
  'BẪY YORDLE': 2800, // Tương tự defensive items khác
  'CHIẾN GIÁP RỰC ĐỎ': 2900, // Armor item cao cấp
  'DÂY CHUYỀN CHUỘC TỘI': 2300, // Support item
  'DÂY CHUYỀN NĂNG LƯỢNG': 2200, // Support enchant
  'GIÁO THIÊN LY': 3200, // Legendary weapon
  'GIÁP MÁU WARMOG': 3100, // High-tier tank item
  'GƯƠM SUY VONG': 3000, // Legendary weapon (Blade of the Ruined King)
  'KIẾM MA YOUMUU': 2900, // Assassin item (Youmuu's Ghostblade)
  'MẶT NẠ ĐỌA ĐẦ': 3200, // Magic penetration item
  'MÁY CHIẾU TÂM LINH': 2800, // AP tank item
  'MÓNG VUỐT STERAK': 3100, // Fighter item (Sterak's Gage)
  'MŨ PHÙ THỦY RABADON': 3600, // Highest AP item (Rabadon's Deathcap)
  'NGỌC VÔ CỰC': 3000, // AP crit item (Infinity Orb)
  'NGỌN GIÁO SHOJIN': 3200, // Fighter weapon
  'NGUYỆT ĐAO': 3100, // Assassin weapon (Eclipse)
  'RÌU ĐẠI MÃNG XÀ': 3300, // Tank weapon (Titanic Hydra)
  'TẤM CHẮN BÌNH MINH': 2700, // Tank support item
  'TIA CHỚP HUYỀN ẢO': 400, // Basic component
  'TRÁI TIM KHỔNG THẦN': 3200, // Tank legendary (Heartsteel)
  'VÔ CỰC KIẾM': 3400, // Legendary ADC item (Infinity Edge)
  'VÒNG SẮT CỔ TỰ': 2900, // MR tank item (Kaenic Rookern)
  'VỌNG ÂM HÒA ĐIỆU': 2800, // AP support item (Harmonic Echo)
};

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const wrItemModel = app.get(getModelToken('WrItem'));

  try {
    console.log('🚀 Starting to update remaining items without price...');

    // Lấy tất cả items không có price
    const itemsWithoutPrice = await wrItemModel
      .find({
        $or: [{ price: { $exists: false } }, { price: null }, { price: 0 }],
      })
      .lean();

    console.log(`📊 Found ${itemsWithoutPrice.length} items without price`);

    let updatedCount = 0;
    let notInMappingCount = 0;
    const results: any[] = [];

    for (const item of itemsWithoutPrice) {
      try {
        const itemName = item.name;

        // Kiểm tra xem có trong mapping không
        if (DEFAULT_PRICES[itemName]) {
          const defaultPrice = DEFAULT_PRICES[itemName];

          // Cập nhật price
          await wrItemModel.updateOne(
            { _id: item._id },
            { $set: { price: defaultPrice } },
          );

          console.log(`✅ Updated price for ${itemName}: ${defaultPrice} gold`);
          updatedCount++;

          results.push({
            name: itemName,
            status: 'updated',
            price: defaultPrice,
          });
        } else {
          console.log(`❌ No default price found for: ${itemName}`);
          notInMappingCount++;

          results.push({
            name: itemName,
            status: 'no_default_price',
          });
        }
      } catch (error) {
        console.error(`💥 Error processing ${item.name}:`, error.message);
      }
    }

    console.log('\n🎯 === UPDATE REMAINING PRICES SUMMARY ===');
    console.log(`📊 Total items without price: ${itemsWithoutPrice.length}`);
    console.log(`✅ Items updated: ${updatedCount}`);
    console.log(`❌ Items not in mapping: ${notInMappingCount}`);
    console.log(
      `📈 Success rate: ${((updatedCount / itemsWithoutPrice.length) * 100).toFixed(1)}%`,
    );

    // Kiểm tra kết quả cuối cùng
    const finalItemsWithPrice = await wrItemModel.countDocuments({
      price: { $exists: true, $ne: null, $gt: 0 },
    });
    const totalItems = await wrItemModel.countDocuments({});
    console.log(
      `🏆 Final items with price: ${finalItemsWithPrice}/${totalItems} (${((finalItemsWithPrice / totalItems) * 100).toFixed(1)}%)`,
    );

    // In ra kết quả
    console.log('\n📋 Updated items:');
    results
      .filter((r) => r.status === 'updated')
      .forEach((result) => {
        console.log(`  ✅ ${result.name}: ${result.price} gold`);
      });

    if (results.filter((r) => r.status === 'no_default_price').length > 0) {
      console.log('\n❌ Items without default price:');
      results
        .filter((r) => r.status === 'no_default_price')
        .forEach((result) => {
          console.log(`  - ${result.name}`);
        });
    }

    // Thống kê theo category
    console.log('\n📊 Price coverage by category:');
    const categories = [
      'Physical',
      'Magic',
      'Defense',
      'Support',
      'Boots',
      'Other',
    ];

    for (const category of categories) {
      const categoryItems = await wrItemModel.countDocuments({ category });
      const categoryItemsWithPrice = await wrItemModel.countDocuments({
        category,
        price: { $exists: true, $ne: null, $gt: 0 },
      });

      if (categoryItems > 0) {
        const percentage = (
          (categoryItemsWithPrice / categoryItems) *
          100
        ).toFixed(1);
        console.log(
          `  ${category}: ${categoryItemsWithPrice}/${categoryItems} (${percentage}%)`,
        );
      }
    }
  } catch (error) {
    console.error('💥 Error during updating remaining prices:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
