import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WrChampion } from '../schemas/wr-champion.schema';
import axios from 'axios';

interface ChampionData {
  [key: string]: {
    id: string;
    key: string;
    name: string;
    title: string;
    image: {
      full: string;
      sprite: string;
      group: string;
      x: number;
      y: number;
      w: number;
      h: number;
    };
  };
}

async function fixMissingImages() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('🔧 Đang sửa imageUrl cho WrChampion...\n');

    // Lấy model trực tiếp từ dependency injection
    const wrChampionModel = app.get<Model<WrChampion>>(
      getModelToken(WrChampion.name),
    );

    // Lấy champions thiếu imageUrl
    const championsToFix = await wrChampionModel
      .find({
        $or: [
          { imageUrl: { $exists: false } },
          { imageUrl: null },
          { imageUrl: '' },
        ],
      })
      .lean();

    console.log(
      `📊 Tìm thấy ${championsToFix.length} champions cần fix imageUrl\n`,
    );

    if (championsToFix.length === 0) {
      console.log('✅ Tất cả champions đều có imageUrl!');
      return;
    }

    // Lấy dữ liệu champion từ Data Dragon API
    console.log('🌐 Đang lấy dữ liệu từ Data Dragon API...');
    const response = await axios.get(
      'https://ddragon.leagueoflegends.com/cdn/13.24.1/data/en_US/champion.json',
    );

    const championData: { data: ChampionData } = response.data;
    console.log(
      `📥 Lấy được ${Object.keys(championData.data).length} champions từ API\n`,
    );

    let fixedCount = 0;
    let notFoundCount = 0;

    for (const champion of championsToFix) {
      const championName = champion.name;
      console.log(`🔍 Đang xử lý: ${championName}`);

      // Tìm champion trong Data Dragon data
      let datadragonChampion = null;

      // Tìm theo tên chính xác
      datadragonChampion = Object.values(championData.data).find(
        (ddChamp) => ddChamp.name === championName,
      );

      // Nếu không tìm thấy, thử tìm theo tên gần giống
      if (!datadragonChampion) {
        datadragonChampion = Object.values(championData.data).find(
          (ddChamp) =>
            ddChamp.name.toLowerCase().includes(championName.toLowerCase()) ||
            championName.toLowerCase().includes(ddChamp.name.toLowerCase()),
        );
      }

      if (datadragonChampion) {
        const imageUrl = `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/${datadragonChampion.image.full}`;

        // Cập nhật imageUrl
        await wrChampionModel.findByIdAndUpdate(champion._id, {
          imageUrl: imageUrl,
        });

        console.log(`  ✅ Fixed: ${championName} -> ${imageUrl}`);
        fixedCount++;
      } else {
        console.log(`  ❌ Không tìm thấy: ${championName}`);
        notFoundCount++;
      }
    }

    console.log('\n📈 KẾT QUẢ:');
    console.log(`✅ Đã sửa: ${fixedCount} champions`);
    console.log(`❌ Không tìm thấy: ${notFoundCount} champions`);
    console.log(
      `📊 Tỷ lệ thành công: ${((fixedCount / championsToFix.length) * 100).toFixed(1)}%`,
    );
  } catch (error) {
    console.error('❌ Lỗi khi sửa imageUrl:', error);
  } finally {
    await app.close();
  }
}

fixMissingImages();
