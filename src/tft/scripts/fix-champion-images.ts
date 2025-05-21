import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Cache cho dữ liệu champion từ Data Dragon
const championDataCache = new Map();

/**
 * Thiết lập logger để theo dõi thay đổi
 */
function setupLogger() {
  const logDir = path.resolve(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const logPath = path.resolve(
    logDir,
    `fix-tft-champion-images-${new Date().toISOString().replace(/:/g, '-')}.log`,
  );

  const logStream = fs.createWriteStream(logPath, { flags: 'a' });

  return {
    log: (message: string) => {
      console.log(message);
      logStream.write(message + '\n');
    },
    close: () => {
      logStream.end();
    },
  };
}

/**
 * Lấy dữ liệu champion từ Data Dragon API
 */
async function getChampionDataFromDDragon(championName: string): Promise<any> {
  try {
    // Nếu đã cache, trả về từ cache
    if (championDataCache.has(championName)) {
      return championDataCache.get(championName);
    }

    // Map tên champion sang format Data Dragon
    const formattedName = championName
      .replace(/['\s&]/g, '')  // Loại bỏ dấu ' và khoảng trắng
      .replace(/\./g, '')      // Loại bỏ dấu chấm
      .replace(/&Willump/g, '') // Trường hợp đặc biệt: Nunu & Willump -> Nunu
      .replace(/Kai'Sa/g, 'Kaisa');  // Trường hợp đặc biệt

    // Lấy tất cả champion từ Data Dragon
    const allChampionsResponse = await axios.get(
      'https://ddragon.leagueoflegends.com/cdn/14.11.1/data/en_US/champion.json',
    );
    const allChampions = allChampionsResponse.data.data;

    // Tìm champion khớp gần đúng với tên
    let matchedChamp = null;
    for (const key in allChampions) {
      const champ = allChampions[key];
      const ddName = champ.name.replace(/['\s&]/g, '').replace(/\./g, '');
      
      if (ddName.toLowerCase() === formattedName.toLowerCase() || 
          key.toLowerCase() === formattedName.toLowerCase()) {
        matchedChamp = champ;
        break;
      }
    }

    if (!matchedChamp) {
      return null;
    }

    // Lưu dữ liệu vào cache
    championDataCache.set(championName, matchedChamp);
    return matchedChamp;
  } catch (error) {
    console.error(`Error fetching data for ${championName}:`, error.message);
    return null;
  }
}

/**
 * Tạo URL hình ảnh champion từ Data Dragon
 */
function generateChampionImageUrl(championKey: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/14.11.1/img/champion/${championKey}.png`;
}

/**
 * Cập nhật hình ảnh champion sử dụng Data Dragon
 */
async function fixChampionImages(
  champion: any,
  logger: any,
  tftChampionModel: any,
): Promise<boolean> {
  // Lấy dữ liệu champion từ Data Dragon
  const ddChampionData = await getChampionDataFromDDragon(champion.name);

  if (!ddChampionData) {
    logger.log(`  Không thể tìm thấy dữ liệu Data Dragon cho ${champion.name}`);
    return false;
  }

  let updated = false;
  const updates: any = {};

  // Cập nhật imageUrl nếu trống hoặc không chính xác
  if (!champion.imageUrl || champion.imageUrl === '') {
    const imageUrl = generateChampionImageUrl(ddChampionData.id);
    updates.imageUrl = imageUrl;
    logger.log(`  Cập nhật imageUrl cho ${champion.name}: ${imageUrl}`);
    updated = true;
  }

  if (updated) {
    try {
      await tftChampionModel.findByIdAndUpdate(champion._id, updates);
      logger.log(`  Đã cập nhật thành công ${champion.name}`);
      return true;
    } catch (error) {
      logger.log(`  Lỗi khi cập nhật ${champion.name}: ${error.message}`);
      return false;
    }
  } else {
    logger.log(`  Không cần cập nhật hình ảnh cho ${champion.name}`);
    return false;
  }
}

async function bootstrap() {
  const logger = setupLogger();
  logger.log('Bắt đầu cập nhật hình ảnh cho tất cả TFT champion bằng Data Dragon API...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const tftChampionModel = app.get(getModelToken('TftChampion'));

  try {
    // Lấy tất cả champion từ database
    logger.log('Đang tải danh sách champion từ database...');
    const champions = await tftChampionModel.find().lean();
    logger.log(`Tìm thấy ${champions.length} champion trong database`);

    // Đếm số champion đã cập nhật
    let championsUpdated = 0;

    // Xử lý từng champion
    for (const champion of champions) {
      logger.log(`\nXử lý ${champion.name}...`);
      const updated = await fixChampionImages(champion, logger, tftChampionModel);
      if (updated) {
        championsUpdated++;
      }
    }

    // Tổng kết
    logger.log(`\nHoàn tất! Tổng kết:`);
    logger.log(`Đã cập nhật hình ảnh cho ${championsUpdated} champion`);
    logger.close();
  } catch (error) {
    logger.log(`\nLỗi: ${error.message}`);
    logger.close();
  } finally {
    await app.close();
  }
}

bootstrap(); 