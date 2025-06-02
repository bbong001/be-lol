import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WrChampion } from '../schemas/wr-champion.schema';

async function migrateToI18n() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('🚀 Bắt đầu migration để thêm field lang cho WrChampions...\n');

    const wrChampionModel = app.get<Model<WrChampion>>(
      getModelToken(WrChampion.name),
    );

    // Lấy tất cả champions chưa có field lang
    const championsWithoutLang = await wrChampionModel
      .find({ lang: { $exists: false } })
      .lean();

    console.log(
      `📊 Tìm thấy ${championsWithoutLang.length} champions cần cập nhật lang field\n`,
    );

    if (championsWithoutLang.length === 0) {
      console.log('✅ Tất cả champions đã có field lang rồi!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const champion of championsWithoutLang) {
      try {
        // Cập nhật lang = 'en' vì dữ liệu hiện tại là tiếng Anh
        await wrChampionModel.findByIdAndUpdate(champion._id, {
          lang: 'en',
        });

        console.log(`✅ Đã cập nhật lang=en cho: ${champion.name}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Lỗi khi cập nhật ${champion.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 KẾT QUẢ MIGRATION:');
    console.log(`✅ Thành công: ${successCount}`);
    console.log(`❌ Lỗi: ${errorCount}`);
    console.log(`📊 Tổng: ${championsWithoutLang.length}`);

    // Kiểm tra kết quả
    const enChampions = await wrChampionModel.countDocuments({ lang: 'en' });
    const totalChampions = await wrChampionModel.countDocuments({});

    console.log('\n📊 THỐNG KÊ SAU MIGRATION:');
    console.log(`🇺🇸 Champions tiếng Anh: ${enChampions}`);
    console.log(`📋 Tổng champions: ${totalChampions}`);
  } catch (error) {
    console.error('❌ Lỗi tổng quát:', error);
  } finally {
    await app.close();
  }
}

migrateToI18n();
