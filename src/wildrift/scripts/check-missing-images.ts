import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WrChampion } from '../schemas/wr-champion.schema';

async function checkMissingImages() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('🖼️ Đang kiểm tra imageUrl của WrChampion...\n');

    // Lấy model trực tiếp từ dependency injection
    const wrChampionModel = app.get<Model<WrChampion>>(
      getModelToken(WrChampion.name),
    );

    // Lấy tất cả champions
    const champions = await wrChampionModel.find({}).lean();
    console.log(`📊 Tổng số champions: ${champions.length}\n`);

    const missingImages = [];

    champions.forEach((champion) => {
      // Kiểm tra imageUrl
      if (!champion.imageUrl || champion.imageUrl.trim() === '') {
        missingImages.push({
          _id: champion._id,
          name: champion.name,
          currentImageUrl: champion.imageUrl || 'null',
        });
      }
    });

    console.log('🔍 BÁO CÁO IMAGEURL THIẾU:\n');
    console.log(`❌ Champions thiếu imageUrl: ${missingImages.length}\n`);

    if (missingImages.length > 0) {
      missingImages.forEach((champion) => {
        console.log(`  - ${champion.name} (ID: ${champion._id})`);
        console.log(`    Current imageUrl: ${champion.currentImageUrl}`);
      });

      console.log('\n📈 THỐNG KÊ:');
      console.log(
        `✅ Champions có imageUrl: ${champions.length - missingImages.length}`,
      );
      console.log(`❌ Champions thiếu imageUrl: ${missingImages.length}`);
      console.log(
        `📊 Tỷ lệ hoàn thiện: ${(((champions.length - missingImages.length) / champions.length) * 100).toFixed(1)}%`,
      );

      console.log('\n🎯 DANH SÁCH CẦN FIX:');
      missingImages.forEach((champion) => {
        console.log(`  - ${champion.name}`);
      });
    } else {
      console.log('✅ Tất cả champions đều có imageUrl!');
    }
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra imageUrl:', error);
  } finally {
    await app.close();
  }
}

checkMissingImages();
