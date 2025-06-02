import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';

// Mapping các tên bị tách với tên đúng
const BROKEN_NAME_FIXES: Record<string, string> = {
  // ÁO CHOÀNG BÓNG TỐI
  'ÁO CHOÀNG B': 'ÁO CHOÀNG BÓNG TỐI',
  'ÓNG TỐI': 'ÁO CHOÀNG BÓNG TỐI',

  // BÙA THĂNG HOA
  'ÙA THĂNG HOA': 'BÙA THĂNG HOA',

  // CƯA XÍCH HÓA KỸ
  'CƯA XÍCH': 'CƯA XÍCH HÓA KỸ',
  'HÓA KỸ': 'CƯA XÍCH HÓA KỸ',

  // ĐAI LƯNG NĂNG LƯỢNG
  'ĐAI LƯ': 'ĐAI LƯNG NĂNG LƯỢNG',
  'NG NĂNG LƯỢNG': 'ĐAI LƯNG NĂNG LƯỢNG',

  // DỊCH CHUYỂN NĂNG LƯỢNG
  'DỊCH CHUY': 'DỊCH CHUYỂN NĂNG LƯỢNG',
  'ỂN NĂNG LƯỢNG': 'DỊCH CHUYỂN NĂNG LƯỢNG',

  // ĐỒNG XU CỔ ĐẠI
  'ĐỒNG XU CỔ Đ': 'ĐỒNG XU CỔ ĐẠI',

  // GIÁP MÁU WARMOG
  'U WARMOG': 'GIÁP MÁU WARMOG',
  'GIÁP MÁ': 'GIÁP MÁU WARMOG',

  // GIÁP THIÊN THẦN
  'P THIÊN THẦN': 'GIÁP THIÊN THẦN',

  // KIẾM NĂNG LƯỢNG SOLARI
  'NĂNG LƯỢNG SOLARI': 'KIẾM NĂNG LƯỢNG SOLARI',

  // LỜI NHẮC TỬ VONG
  'NHẮC TỬ VONG': 'LỜI NHẮC TỬ VONG',

  // LƯỠI HÁI LINH HỒN
  'NH HỒN': 'LƯỠI HÁI LINH HỒN',
  'LƯỠI HÁI LI': 'LƯỠI HÁI LINH HỒN',

  // MÃNG XÀ NĂNG LƯỢNG
  'ÃNG XÀ NĂNG LƯỢNG': 'MÃNG XÀ NĂNG LƯỢNG',

  // MẶT NẠ ĐỌA ĐẦY LIANDRY
  'Y LIANDRY': 'MẶT NẠ ĐỌA ĐẦY LIANDRY',
  'MẶT NẠ ĐỌA Đ': 'MẶT NẠ ĐỌA ĐẦY LIANDRY',

  // NANH NASHOR
  'NANH NAS': 'NANH NASHOR',

  // NGƯNG ĐỌNG NĂNG LƯỢNG
  'NGƯNG ĐỌNG': 'NGƯNG ĐỌNG NĂNG LƯỢNG',
  'NĂNG LƯỢNG': 'NGƯNG ĐỌNG NĂNG LƯỢNG',

  // PHẢN LỰC NĂNG LƯỢNG
  'PHẢN LỰC N': 'PHẢN LỰC NĂNG LƯỢNG',
  'ĂNG LƯỢNG': 'PHẢN LỰC NĂNG LƯỢNG',

  // RÌU ĐEN
  'U ĐEN': 'RÌU ĐEN',

  // TAM HỢP KIẾM
  'TAM HỢP KI': 'TAM HỢP KIẾM',

  // THÚ BÔNG BẢO MỘNG NĂNG LƯỢNG
  'THÚ BÔN': 'THÚ BÔNG BẢO MỘNG NĂNG LƯỢNG',
  'G BẢO MỘNG NĂNG LƯỢNG': 'THÚ BÔNG BẢO MỘNG NĂNG LƯỢNG',

  // THƯƠNG PHỤC HẬN SERYLDA
  'THƯƠNG PH': 'THƯƠNG PHỤC HẬN SERYLDA',
  'ỤC HẬN SERYLDA': 'THƯƠNG PHỤC HẬN SERYLDA',

  // TIA CHỚP HUYỀN ẢO
  'TIA CHỚP HUYỀN Ả': 'TIA CHỚP HUYỀN ẢO',

  // TRÁI TIM KHỔNG THẦN
  'RÁI TIM KHỔNG THẦN': 'TRÁI TIM KHỔNG THẦN',

  // TRÁT LỆNH ĐẾ VƯƠNG
  'TRÁT LỆNH ĐẾ': 'TRÁT LỆNH ĐẾ VƯƠNG',
  VƯƠNG: 'TRÁT LỆNH ĐẾ VƯƠNG',

  // VŨ ĐIỆU TỬ THẦN
  'VŨ ĐIỆU': 'VŨ ĐIỆU TỬ THẦN',
  'TỬ THẦN': 'VŨ ĐIỆU TỬ THẦN',

  // KHIÊN THÁI DƯƠNG
  'KHIÊN THÁI DƯƠN': 'KHIÊN THÁI DƯƠNG',

  // KIẾM TAI ƯƠNG
  'KIẾM TAI ƯƠN': 'KIẾM TAI ƯƠNG',

  // VỌNG ÂM HÒA ĐIỆU
  'VỌNG ÂM HÒA': 'VỌNG ÂM HÒA ĐIỆU',

  // GIÀY NĂNG LƯỢNG
  'GIÀY NĂNG L': 'GIÀY NĂNG LƯỢNG',

  // GIÀY THỦY NGÂN
  'GIÀY THỦY N': 'GIÀY THỦY NGÂN',
};

// Các tên cần xóa vì không hợp lệ
const INVALID_NAMES = ['CDATA'];

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    console.log('Starting to fix broken item names...');

    let fixedCount = 0;
    let deletedCount = 0;
    let mergedCount = 0;

    // Lấy tất cả items
    const allItems = await itemModel.find({}).lean();
    console.log(`Found ${allItems.length} total items`);

    // Tìm các items có tên bị tách
    const brokenItems = allItems.filter(
      (item) =>
        Object.keys(BROKEN_NAME_FIXES).includes(item.name) ||
        INVALID_NAMES.includes(item.name),
    );

    console.log(`Found ${brokenItems.length} items with broken names`);

    for (const brokenItem of brokenItems) {
      console.log(`Processing broken item: ${brokenItem.name}`);

      if (INVALID_NAMES.includes(brokenItem.name)) {
        // Xóa item không hợp lệ
        await itemModel.deleteOne({ _id: brokenItem._id });
        console.log(`Deleted invalid item: ${brokenItem.name}`);
        deletedCount++;
        continue;
      }

      const correctName = BROKEN_NAME_FIXES[brokenItem.name];

      if (!correctName) {
        console.log(`No fix found for: ${brokenItem.name}`);
        continue;
      }

      // Kiểm tra xem item đúng đã tồn tại chưa
      const existingCorrectItem = await itemModel.findOne({
        name: correctName,
      });

      if (existingCorrectItem) {
        // Merge data từ broken item vào correct item nếu cần
        const updateData: any = {};
        let needUpdate = false;

        // Merge imageUrl nếu correct item chưa có
        if (!existingCorrectItem.imageUrl && brokenItem.imageUrl) {
          updateData.imageUrl = brokenItem.imageUrl;
          needUpdate = true;
        }

        // Merge stats nếu correct item chưa có hoặc có ít hơn
        if (brokenItem.stats && Object.keys(brokenItem.stats).length > 0) {
          if (
            !existingCorrectItem.stats ||
            Object.keys(existingCorrectItem.stats).length === 0
          ) {
            updateData.stats = brokenItem.stats;
            needUpdate = true;
          } else {
            // Merge stats
            const mergedStats = {
              ...existingCorrectItem.stats,
              ...brokenItem.stats,
            };
            if (
              JSON.stringify(mergedStats) !==
              JSON.stringify(existingCorrectItem.stats)
            ) {
              updateData.stats = mergedStats;
              needUpdate = true;
            }
          }
        }

        // Merge description nếu correct item chưa có
        if (!existingCorrectItem.description && brokenItem.description) {
          updateData.description = brokenItem.description;
          needUpdate = true;
        }

        // Merge activeDescription nếu correct item chưa có
        if (
          !existingCorrectItem.activeDescription &&
          brokenItem.activeDescription
        ) {
          updateData.activeDescription = brokenItem.activeDescription;
          updateData.isActive = true;
          needUpdate = true;
        }

        if (needUpdate) {
          await itemModel.updateOne(
            { _id: existingCorrectItem._id },
            { $set: updateData },
          );
          console.log(
            `Merged data from "${brokenItem.name}" into "${correctName}"`,
          );
          mergedCount++;
        }

        // Xóa broken item
        await itemModel.deleteOne({ _id: brokenItem._id });
        console.log(`Deleted broken item: ${brokenItem.name}`);
        deletedCount++;
      } else {
        // Rename broken item thành correct name
        await itemModel.updateOne(
          { _id: brokenItem._id },
          { $set: { name: correctName } },
        );
        console.log(`Renamed "${brokenItem.name}" to "${correctName}"`);
        fixedCount++;
      }
    }

    // Kiểm tra và xóa các duplicates
    console.log('\nChecking for duplicates...');
    const itemNames = await itemModel.distinct('name');

    for (const name of itemNames) {
      const duplicates = await itemModel.find({ name }).lean();
      if (duplicates.length > 1) {
        console.log(`Found ${duplicates.length} duplicates for: ${name}`);

        // Giữ lại item có nhiều thông tin nhất
        const bestItem = duplicates.reduce((best, current) => {
          const bestScore =
            (best.imageUrl ? 1 : 0) +
            (best.stats && Object.keys(best.stats).length > 0 ? 1 : 0) +
            (best.description ? 1 : 0) +
            (best.activeDescription ? 1 : 0);

          const currentScore =
            (current.imageUrl ? 1 : 0) +
            (current.stats && Object.keys(current.stats).length > 0 ? 1 : 0) +
            (current.description ? 1 : 0) +
            (current.activeDescription ? 1 : 0);

          return currentScore > bestScore ? current : best;
        });

        // Xóa các duplicates khác
        for (const duplicate of duplicates) {
          if (duplicate._id.toString() !== bestItem._id.toString()) {
            await itemModel.deleteOne({ _id: duplicate._id });
            console.log(`Deleted duplicate: ${name} (${duplicate._id})`);
            deletedCount++;
          }
        }
      }
    }

    console.log('\n=== FIX BROKEN NAMES SUMMARY ===');
    console.log(`Items renamed: ${fixedCount}`);
    console.log(`Items merged: ${mergedCount}`);
    console.log(`Items deleted: ${deletedCount}`);

    // Kiểm tra kết quả cuối cùng
    const finalCount = await itemModel.countDocuments();
    console.log(`Final item count: ${finalCount}`);
  } catch (error) {
    console.error('Error during fixing broken names:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
