import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WrChampion } from '../schemas/wr-champion.schema';
import axios from 'axios';
import * as cheerio from 'cheerio';

async function crawlVietnameseData() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('🚀 Bắt đầu crawl dữ liệu tiếng Việt cho WrChampions...\n');

    const wrChampionModel = app.get<Model<WrChampion>>(
      getModelToken(WrChampion.name),
    );

    // Lấy danh sách champions tiếng Anh để crawl tương ứng tiếng Việt
    const englishChampions = await wrChampionModel.find({ lang: 'en' }).lean();

    console.log(
      `📊 Tìm thấy ${englishChampions.length} champions tiếng Anh cần crawl tiếng Việt\n`,
    );

    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    for (const champion of englishChampions) {
      console.log(`🔄 Đang xử lý: ${champion.name}`);

      try {
        // Kiểm tra xem đã có bản tiếng Việt chưa
        const existingViChampion = await wrChampionModel.findOne({
          name: champion.name,
          lang: 'vi',
        });

        if (existingViChampion) {
          console.log(`⏭️ Đã có bản tiếng Việt cho ${champion.name}`);
          skipCount++;
          continue;
        }

        // Thử crawl từ các nguồn tiếng Việt
        let vietnameseData = await crawlFromTocChien(champion.name);

        if (!vietnameseData) {
          // Fallback: dùng Google Translate API hoặc tạo bản copy với title dịch sơ
          vietnameseData = await createVietnameseFromEnglish(champion);
        }

        if (vietnameseData) {
          // Tạo champion mới với lang: 'vi'
          const newViChampion = new wrChampionModel({
            ...champion,
            _id: undefined, // Remove _id to create new document
            lang: 'vi',
            title: vietnameseData.title || champion.title,
            description: vietnameseData.description || champion.description,
            abilities: vietnameseData.abilities || champion.abilities,
            createdAt: undefined,
            updatedAt: undefined,
          });

          await newViChampion.save();

          console.log(`✅ Đã tạo bản tiếng Việt cho: ${champion.name}`);
          successCount++;
        } else {
          console.log(
            `⚠️ Không thể tạo dữ liệu tiếng Việt cho ${champion.name}`,
          );
          errorCount++;
        }

        // Delay để tránh spam requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Lỗi khi xử lý ${champion.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 KẾT QUẢ CRAWL:');
    console.log(`✅ Thành công: ${successCount}`);
    console.log(`⏭️ Bỏ qua (đã có): ${skipCount}`);
    console.log(`❌ Lỗi: ${errorCount}`);
    console.log(`📊 Tổng: ${englishChampions.length}`);

    // Thống kê sau khi crawl
    const viChampions = await wrChampionModel.countDocuments({ lang: 'vi' });
    const enChampions = await wrChampionModel.countDocuments({ lang: 'en' });

    console.log('\n📊 THỐNG KÊ SAU CRAWL:');
    console.log(`🇻🇳 Champions tiếng Việt: ${viChampions}`);
    console.log(`🇺🇸 Champions tiếng Anh: ${enChampions}`);
  } catch (error) {
    console.error('❌ Lỗi tổng quát:', error);
  } finally {
    await app.close();
  }
}

/**
 * Crawl từ tocchien.com
 */
async function crawlFromTocChien(championName: string) {
  try {
    const formattedName = championName.toLowerCase().replace(/\s+/g, '-');
    const url = `https://tocchien.com/tuong/${formattedName}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    const title = $('.champion-title, .tuong-title').first().text().trim();
    const description = $('.champion-description, .tuong-description')
      .first()
      .text()
      .trim();

    if (!title && !description) {
      return null;
    }

    return {
      title,
      description,
      abilities: null, // Có thể crawl thêm abilities nếu cần
    };
  } catch (error) {
    console.log(`Cannot crawl from TocChien for ${championName}`);
    return null;
  }
}

/**
 * Tạo bản tiếng Việt từ bản tiếng Anh (fallback)
 */
async function createVietnameseFromEnglish(englishChampion: any) {
  // Mapping một số title phổ biến
  const titleMapping = {
    'the Nine-Tailed Fox': 'Cáo Chín Đuôi',
    'The Might of Demacia': 'Sức Mạnh của Demacia',
    'the Darkin Blade': 'Lưỡi Kiếm Darkin',
    'the Warlord': 'Lãnh Chúa',
    // Thêm mapping khác nếu cần
  };

  const vietnameseTitle =
    titleMapping[englishChampion.title] || englishChampion.title;

  return {
    title: vietnameseTitle,
    description: englishChampion.description, // Giữ nguyên description hiện tại
    abilities: englishChampion.abilities, // Giữ nguyên abilities hiện tại
  };
}

crawlVietnameseData();
