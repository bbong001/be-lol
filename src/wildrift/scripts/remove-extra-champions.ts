import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import * as fs from 'fs';
import * as path from 'path';

// Danh sách chính thức các champion có trong Wild Rift (cập nhật tháng 5/2025)
const OFFICIAL_WILD_RIFT_CHAMPIONS = [
  'Aatrox',
  'Ahri',
  'Akali',
  'Akshan',
  'Alistar',
  'Ambessa',
  'Amumu',
  'Annie',
  'Ashe',
  'Aurelion Sol',
  'Blitzcrank',
  'Brand',
  'Braum',
  'Caitlyn',
  'Camille',
  'Corki',
  'Darius',
  'Diana',
  'Dr. Mundo',
  'Draven',
  'Ekko',
  'Evelynn',
  'Ezreal',
  'Fiddlesticks',
  'Fiora',
  'Fizz',
  'Galio',
  'Garen',
  'Gnar',
  'Gragas',
  'Graves',
  'Gwen',
  'Hecarim',
  'Heimerdinger',
  'Irelia',
  'Janna',
  'Jarvan IV',
  'Jax',
  'Jayce',
  'Jhin',
  'Jinx',
  "Kai'Sa",
  'Kalista',
  'Karma',
  'Kassadin',
  'Katarina',
  'Kayle',
  'Kayn',
  'Kennen',
  "Kha'Zix",
  'Kindred',
  'Lee Sin',
  'Leona',
  'Lillia',
  'Lissandra',
  'Lucian',
  'Lulu',
  'Lux',
  'Malphite',
  'Maokai',
  'Master Yi',
  'Milio',
  'Miss Fortune',
  'Mordekaiser',
  'Morgana',
  'Nami',
  'Nasus',
  'Nautilus',
  'Nilah',
  'Nocturne',
  'Nunu',
  'Olaf',
  'Orianna',
  'Ornn',
  'Pantheon',
  'Poppy',
  'Pyke',
  'Rakan',
  'Rammus',
  'Renekton',
  'Rengar',
  'Riven',
  'Rumble',
  'Ryze',
  'Samira',
  'Senna',
  'Seraphine',
  'Sett',
  'Shen',
  'Shyvana',
  'Singed',
  'Sion',
  'Sivir',
  'Sona',
  'Soraka',
  'Swain',
  'Syndra',
  'Talon',
  'Teemo',
  'Thresh',
  'Tristana',
  'Tryndamere',
  'Twisted Fate',
  'Twitch',
  'Urgot',
  'Varus',
  'Vayne',
  'Veigar',
  'Vex',
  'Vi',
  'Viego',
  'Viktor',
  'Vladimir',
  'Volibear',
  'Warwick',
  'Wukong',
  'Xayah',
  'Xin Zhao',
  'Yasuo',
  'Yone',
  'Yuumi',
  'Zed',
  'Zeri',
  'Ziggs',
  'Zilean',
  'Zoe',
  'Zyra',
];

// Kiểm tra xem có tướng nào cần được rename không (khác tên giữa PC và Wild Rift)
const NAME_MAPPING: Record<string, string> = {
  // Không cần mapping tên nữa vì đã sửa trực tiếp trong DB
};

/**
 * Thực hiện việc loại bỏ các champion không thuộc Wild Rift
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logDir = path.resolve(process.cwd(), 'logs');

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const logFilePath = path.resolve(
    logDir,
    `remove-extra-champions-${new Date().toISOString().replace(/:/g, '-')}.log`,
  );

  const log = (message: string) => {
    console.log(message);
    fs.appendFileSync(logFilePath, message + '\n');
  };

  try {
    log('Bắt đầu kiểm tra và loại bỏ các champion dư thừa...');

    // Lấy WrChampion model
    const wrChampionModel = app.get(getModelToken('WrChampion'));

    // Lấy tất cả champion hiện có trong database
    const allChampions = await wrChampionModel.find({}).exec();
    log(`Tìm thấy ${allChampions.length} champion trong database`);

    // Tạo danh sách các champion cần giữ lại dựa trên danh sách chính thức
    // Bao gồm cả việc xử lý mapping tên
    const officialNamesSet = new Set(OFFICIAL_WILD_RIFT_CHAMPIONS);

    // Lọc ra các champion không có trong danh sách chính thức
    const extraChampions = allChampions.filter((champion) => {
      const championName = champion.name;

      // Kiểm tra xem có phải là tên được map không
      const officialNames = Object.entries(NAME_MAPPING)
        .filter(([officialName, dbName]) => {
          return dbName === championName;
        })
        .map(([officialName]) => officialName);

      if (officialNames.length > 0) {
        // Nếu champion có trong danh sách mapping và tên official có trong danh sách tướng chính thức
        // thì giữ lại tướng này
        return !officialNames.some((name) => officialNamesSet.has(name));
      }

      // Kiểm tra bình thường nếu không có trong mapping
      return !officialNamesSet.has(championName);
    });

    log(`Tìm thấy ${extraChampions.length} champion không thuộc Wild Rift:`);
    for (const champion of extraChampions) {
      log(`- ${champion.name}`);
    }

    // Hỏi xác nhận trước khi xóa
    if (process.argv.includes('--confirm')) {
      // Xóa các champion không thuộc Wild Rift
      for (const champion of extraChampions) {
        log(`Đang xóa champion: ${champion.name}`);
        await wrChampionModel.deleteOne({ _id: champion._id });
      }

      log(`Đã xóa ${extraChampions.length} champion dư thừa.`);
    } else {
      log('\nĐây là DRY RUN. Không có champion nào bị xóa.');
      log('Để xóa champion, hãy chạy lại script với tham số --confirm:');
      log('npm run remove:extra-champions -- --confirm');
    }

    // Kiểm tra xem còn thiếu champion nào trong danh sách Wild Rift không
    const existingChampionNames = new Set(allChampions.map((c) => c.name));
    const missingChampions = OFFICIAL_WILD_RIFT_CHAMPIONS.filter((name) => {
      // Kiểm tra cả tên gốc và tên đã mapping
      const mappedName = NAME_MAPPING[name] || name;
      return !existingChampionNames.has(mappedName);
    });

    if (missingChampions.length > 0) {
      log('\nCác champion Wild Rift chưa có trong database:');
      for (const name of missingChampions) {
        log(`- ${name}`);
      }
    }
  } catch (error) {
    log(`Lỗi: ${error.message}`);
    console.error(error);
  } finally {
    await app.close();
    log('\nHoàn thành kiểm tra.');
  }
}

// Chạy script
bootstrap();
