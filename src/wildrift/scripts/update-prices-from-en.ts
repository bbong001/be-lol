import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const wrItemModel = app.get(getModelToken('WrItem'));
  const wrItemEnModel = app.get(getModelToken('WrItemsEn'));

  try {
    console.log('🚀 Starting to update prices from WrItemsEn to WrItem...');

    // Lấy tất cả items từ WrItemsEn có price
    const itemsEn = await wrItemEnModel
      .find({
        price: { $exists: true, $ne: null, $gt: 0 },
      })
      .lean();

    console.log(`📊 Found ${itemsEn.length} items with price in WrItemsEn`);

    // Lấy tất cả items từ WrItem
    const itemsVi = await wrItemModel.find({}).lean();
    console.log(`📊 Found ${itemsVi.length} items in WrItem`);

    let updatedCount = 0;
    let notFoundCount = 0;
    let alreadyHasPriceCount = 0;
    const results: any[] = [];

    for (const itemEn of itemsEn) {
      try {
        // Tìm item tương ứng trong WrItem dựa trên tên
        // Thử nhiều cách match tên
        const matchingItem = itemsVi.find((itemVi) => {
          // So sánh trực tiếp
          if (itemVi.name === itemEn.name) return true;

          // So sánh không phân biệt hoa thường
          if (itemVi.name.toLowerCase() === itemEn.name.toLowerCase())
            return true;

          // So sánh sau khi normalize
          const normalizeString = (str: string) =>
            str
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd')
              .replace(/[^a-z0-9\s]/g, '')
              .trim();

          if (normalizeString(itemVi.name) === normalizeString(itemEn.name)) {
            return true;
          }

          // Kiểm tra nếu tên tiếng Việt chứa tên tiếng Anh hoặc ngược lại
          if (
            itemVi.name.toLowerCase().includes(itemEn.name.toLowerCase()) ||
            itemEn.name.toLowerCase().includes(itemVi.name.toLowerCase())
          ) {
            return true;
          }

          return false;
        });

        if (matchingItem) {
          // Kiểm tra xem item đã có price chưa
          if (matchingItem.price && matchingItem.price > 0) {
            console.log(
              `⚠️  ${matchingItem.name} already has price: ${matchingItem.price}`,
            );
            alreadyHasPriceCount++;
            results.push({
              nameVi: matchingItem.name,
              nameEn: itemEn.name,
              status: 'already_has_price',
              currentPrice: matchingItem.price,
              newPrice: itemEn.price,
            });
            continue;
          }

          // Cập nhật price
          await wrItemModel.updateOne(
            { _id: matchingItem._id },
            { $set: { price: itemEn.price } },
          );

          console.log(
            `✅ Updated price for ${matchingItem.name}: ${itemEn.price} gold`,
          );
          updatedCount++;

          results.push({
            nameVi: matchingItem.name,
            nameEn: itemEn.name,
            status: 'updated',
            price: itemEn.price,
          });
        } else {
          console.log(`❌ No matching item found for: ${itemEn.name}`);
          notFoundCount++;

          results.push({
            nameEn: itemEn.name,
            status: 'not_found',
            price: itemEn.price,
          });
        }
      } catch (error) {
        console.error(`💥 Error processing ${itemEn.name}:`, error.message);
      }
    }

    console.log('\n🎯 === UPDATE PRICES SUMMARY ===');
    console.log(`📊 Total items processed: ${itemsEn.length}`);
    console.log(`✅ Items updated: ${updatedCount}`);
    console.log(`⚠️  Items already have price: ${alreadyHasPriceCount}`);
    console.log(`❌ Items not found: ${notFoundCount}`);
    console.log(
      `📈 Success rate: ${((updatedCount / itemsEn.length) * 100).toFixed(1)}%`,
    );

    // Kiểm tra kết quả cuối cùng
    const finalItemsWithPrice = await wrItemModel.countDocuments({
      price: { $exists: true, $ne: null, $gt: 0 },
    });
    console.log(`🏆 Final items with price: ${finalItemsWithPrice}`);

    // In ra một số kết quả mẫu
    console.log('\n📋 Sample updated items:');
    results
      .filter((r) => r.status === 'updated')
      .slice(0, 10)
      .forEach((result) => {
        console.log(
          `  ✅ ${result.nameVi} (${result.nameEn}): ${result.price} gold`,
        );
      });

    if (results.filter((r) => r.status === 'not_found').length > 0) {
      console.log('\n❌ Items not found:');
      results
        .filter((r) => r.status === 'not_found')
        .slice(0, 10)
        .forEach((result) => {
          console.log(`  - ${result.nameEn}: ${result.price} gold`);
        });
    }

    if (results.filter((r) => r.status === 'already_has_price').length > 0) {
      console.log('\n⚠️  Items already have price:');
      results
        .filter((r) => r.status === 'already_has_price')
        .slice(0, 10)
        .forEach((result) => {
          console.log(
            `  - ${result.nameVi}: current=${result.currentPrice}, new=${result.newPrice}`,
          );
        });
    }
  } catch (error) {
    console.error('💥 Error during updating prices:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
