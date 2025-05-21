import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Champions với tên cụ thể từ Wild Rift sang PC LoL
const nameMapWildRiftToPC = {
  Akshan: 'Akshan',
  Ambessa: 'Ambessa', // Có thể không có trong DDragon
  Amumu: 'Amumu',
  Ahri: 'Ahri',
  Aatrox: 'Aatrox',
  Alistar: 'Alistar',
  Ashe: 'Ashe',
  'Aurelion Sol': 'AurelionSol',
  Annie: 'Annie',
  Akali: 'Akali',
  Blitzcrank: 'Blitzcrank',
  Braum: 'Braum',
  Brand: 'Brand',
  Caitlyn: 'Caitlyn',
  Camille: 'Camille',
  Corki: 'Corki',
  Diana: 'Diana',
  'Dr. Mundo': 'DrMundo',
  'Dr Mundo': 'DrMundo',
  Darius: 'Darius',
  Draven: 'Draven',
  Ekko: 'Ekko',
  Evelynn: 'Evelynn',
  Ezreal: 'Ezreal',
  Fiora: 'Fiora',
  Fizz: 'Fizz',
  Galio: 'Galio',
  Garen: 'Garen',
  Gragas: 'Gragas',
  Graves: 'Graves',
  Gwen: 'Gwen',
  Hecarim: 'Hecarim',
  Heimerdinger: 'Heimerdinger',
  Irelia: 'Irelia',
  Janna: 'Janna',
  'Jarvan IV': 'JarvanIV',
  'Jarvan Iv': 'JarvanIV',
  Jax: 'Jax',
  Jayce: 'Jayce',
  Jhin: 'Jhin',
  Jinx: 'Jinx',
  "Kai'Sa": 'Kaisa',
  Kaisa: 'Kaisa',
  Karma: 'Karma',
  Kassadin: 'Kassadin',
  Katarina: 'Katarina',
  Kayle: 'Kayle',
  Kayn: 'Kayn',
  Kennen: 'Kennen',
  "Kha'Zix": 'Khazix',
  Khazix: 'Khazix',
  Leona: 'Leona',
  'Lee Sin': 'LeeSin',
  Lucian: 'Lucian',
  Lulu: 'Lulu',
  Lux: 'Lux',
  'Master Yi': 'MasterYi',
  Malphite: 'Malphite',
  'Miss Fortune': 'MissFortune',
  Morgana: 'Morgana',
  Nami: 'Nami',
  Nasus: 'Nasus',
  Nautilus: 'Nautilus',
  Nilah: 'Nilah',
  'Nunu & Willump': 'Nunu',
  Olaf: 'Olaf',
  Orianna: 'Orianna',
  Pantheon: 'Pantheon',
  Pyke: 'Pyke',
  Rammus: 'Rammus',
  Renekton: 'Renekton',
  Rengar: 'Rengar',
  Riven: 'Riven',
  Samira: 'Samira',
  Senna: 'Senna',
  Seraphine: 'Seraphine',
  Sett: 'Sett',
  Shen: 'Shen',
  Shyvana: 'Shyvana',
  Singed: 'Singed',
  Sion: 'Sion',
  Sona: 'Sona',
  Soraka: 'Soraka',
  Teemo: 'Teemo',
  Thresh: 'Thresh',
  Tristana: 'Tristana',
  Tryndamere: 'Tryndamere',
  'Twisted Fate': 'TwistedFate',
  Varus: 'Varus',
  Vayne: 'Vayne',
  Veigar: 'Veigar',
  Vi: 'Vi',
  Viego: 'Viego',
  Vladimir: 'Vladimir',
  Volibear: 'Volibear',
  Wukong: 'MonkeyKing',
  Xayah: 'Xayah',
  'Xin Zhao': 'XinZhao',
  Yasuo: 'Yasuo',
  Yone: 'Yone',
  Yuumi: 'Yuumi',
  Zed: 'Zed',
  Ziggs: 'Ziggs',
  Zoe: 'Zoe',
  Zyra: 'Zyra',
};

// Cache cho dữ liệu DDragon
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
    `fix-champion-images-${new Date().toISOString().replace(/:/g, '-')}.log`,
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

    // Map tên Wild Rift sang tên PC LoL nếu cần
    const pcName =
      nameMapWildRiftToPC[championName] ||
      championName.replace(/\s+/g, '').replace(/[.']/g, '');

    // Lấy tất cả champion trước để xác thực champion này có tồn tại không
    const allChampionsResponse = await axios.get(
      'https://ddragon.leagueoflegends.com/cdn/14.11.1/data/en_US/champion.json',
    );
    const allChampions = allChampionsResponse.data.data;

    // Kiểm tra xem champion có tồn tại không
    if (!allChampions[pcName]) {
      return null;
    }

    // Lưu dữ liệu vào cache
    championDataCache.set(championName, allChampions[pcName]);

    return allChampions[pcName];
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
 * Tạo URL splash art của champion từ Data Dragon
 */
function generateChampionSplashUrl(championKey: string): string {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championKey}_0.jpg`;
}

/**
 * Cập nhật hình ảnh champion sử dụng Data Dragon
 */
async function fixChampionImages(
  champion: any,
  logger: any,
  wrChampionModel: any,
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

  // Cập nhật splashUrl nếu trống hoặc không chính xác
  if (!champion.splashUrl || champion.splashUrl === '') {
    const splashUrl = generateChampionSplashUrl(ddChampionData.id);
    updates.splashUrl = splashUrl;
    logger.log(`  Cập nhật splashUrl cho ${champion.name}: ${splashUrl}`);
    updated = true;
  }

  if (updated) {
    try {
      await wrChampionModel.findByIdAndUpdate(champion._id, updates);
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
  logger.log('Bắt đầu cập nhật hình ảnh cho tất cả champion bằng Data Dragon API...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const wrChampionModel = app.get(getModelToken('WrChampion'));

  try {
    // Lấy tất cả champion từ database
    logger.log('Đang tải danh sách champion từ database...');
    const champions = await wrChampionModel.find().lean();
    logger.log(`Tìm thấy ${champions.length} champion trong database`);

    // Đếm số champion đã cập nhật
    let championsUpdated = 0;

    // Xử lý từng champion
    for (const champion of champions) {
      logger.log(`\nXử lý ${champion.name}...`);
      const updated = await fixChampionImages(champion, logger, wrChampionModel);
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