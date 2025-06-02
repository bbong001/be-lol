import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const wrItemModel = app.get(getModelToken('WrItem'));
  const wrItemEnModel = app.get(getModelToken('WrItemsEn'));

  try {
    console.log('🔍 Comparing item names between WrItem and WrItemsEn...');

    // Lấy tất cả items từ cả hai collections
    const itemsVi = await wrItemModel.find({}).lean();
    const itemsEn = await wrItemEnModel.find({}).lean();

    console.log(`📊 WrItem (Vietnamese): ${itemsVi.length} items`);
    console.log(`📊 WrItemsEn (English): ${itemsEn.length} items`);

    // Tìm các items có thể match
    console.log('\n🔍 Potential matches:');
    let potentialMatches = 0;

    for (const itemVi of itemsVi.slice(0, 20)) {
      // Chỉ kiểm tra 20 items đầu
      console.log(`\n🇻🇳 Vietnamese: ${itemVi.name}`);

      // Tìm các items tiếng Anh có thể match
      const possibleMatches = itemsEn.filter((itemEn) => {
        const viName = itemVi.name.toLowerCase();
        const enName = itemEn.name.toLowerCase();

        // Kiểm tra các từ khóa chung
        const commonWords = [
          'sword',
          'blade',
          'armor',
          'shield',
          'boots',
          'crown',
          'staff',
          'wand',
          'crystal',
          'heart',
          'edge',
          'fang',
          'claw',
          'gauntlet',
          'helm',
          'cloak',
          'robe',
          'ring',
          'amulet',
          'orb',
          'scepter',
          'tome',
          'book',
        ];

        // Kiểm tra nếu có từ khóa chung
        for (const word of commonWords) {
          if (viName.includes(word) || enName.includes(word)) {
            return true;
          }
        }

        // Kiểm tra độ dài tương tự
        if (Math.abs(viName.length - enName.length) < 5) {
          return true;
        }

        return false;
      });

      if (possibleMatches.length > 0) {
        console.log(`   🔗 Possible matches:`);
        possibleMatches.slice(0, 3).forEach((match) => {
          console.log(`      🇺🇸 ${match.name} (${match.price} gold)`);
        });
        potentialMatches++;
      } else {
        console.log(`   ❌ No potential matches found`);
      }
    }

    console.log(`\n📈 Potential matches found: ${potentialMatches}/20`);

    // Hiển thị một số items tiếng Anh phổ biến
    console.log('\n📋 Common English items:');
    const commonEnItems = itemsEn
      .filter((item) =>
        [
          'Sword',
          'Blade',
          'Armor',
          'Shield',
          'Boots',
          'Crown',
          'Staff',
          'Heart',
          'Edge',
          'Fang',
        ].some((keyword) => item.name.includes(keyword)),
      )
      .slice(0, 10);

    commonEnItems.forEach((item) => {
      console.log(`   🇺🇸 ${item.name}: ${item.price} gold`);
    });

    // Hiển thị một số items tiếng Việt
    console.log('\n📋 Vietnamese items sample:');
    itemsVi.slice(0, 10).forEach((item) => {
      console.log(`   🇻🇳 ${item.name}: ${item.price || 'No price'}`);
    });

    // Thống kê items có price
    const viItemsWithPrice = itemsVi.filter(
      (item) => item.price && item.price > 0,
    ).length;
    const enItemsWithPrice = itemsEn.filter(
      (item) => item.price && item.price > 0,
    ).length;

    console.log('\n💰 Price statistics:');
    console.log(
      `   Vietnamese items with price: ${viItemsWithPrice}/${itemsVi.length}`,
    );
    console.log(
      `   English items with price: ${enItemsWithPrice}/${itemsEn.length}`,
    );
  } catch (error) {
    console.error('💥 Error comparing item names:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
