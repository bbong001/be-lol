import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Kiểm tra URL có hoạt động không bằng cách gửi HEAD request
 */
async function checkUrl(url: string): Promise<boolean> {
  try {
    if (!url) return false;

    // Với URLs từ datadragon, dùng GET request với responseType arraybuffer để tránh lỗi
    if (url.includes('ddragon.leagueoflegends.com')) {
      const response = await axios.get(url, {
        timeout: 3000,
        responseType: 'arraybuffer',
      });
      return response.status === 200;
    } else {
      // Với các URL khác dùng HEAD request
      const response = await axios.head(url, { timeout: 3000 });
      return response.status === 200;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Hàm chính để bootstrap ứng dụng
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('Bắt đầu kiểm tra tất cả URL ảnh kỹ năng của tướng...');

    // Lấy model WrChampion
    const wrChampionModel = app.get(getModelToken('WrChampion'));

    // Lấy tất cả champions từ database
    const allChampions = await wrChampionModel.find({}).exec();
    console.log(`Tìm thấy ${allChampions.length} tướng trong database`);

    // Thống kê
    let totalAbilities = 0;
    let workingUrls = 0;
    let brokenUrls = 0;
    let championsWithBrokenUrls = 0;

    // Lưu log vào file
    const logsDir = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir);
    }

    const logFilePath = path.resolve(
      logsDir,
      `skill-image-check-${new Date().toISOString().replace(/:/g, '-')}.log`,
    );

    // Kiểm tra từng champion
    for (const champion of allChampions) {
      let hasBrokenUrls = false;
      const abilities = champion.abilities;

      // Nếu champion không có abilities, bỏ qua
      if (!abilities) {
        fs.appendFileSync(
          logFilePath,
          `Champion ${champion.name} không có thông tin kỹ năng\n`,
        );
        continue;
      }

      fs.appendFileSync(logFilePath, `\nKiểm tra tướng: ${champion.name}\n`);
      console.log(`Kiểm tra tướng: ${champion.name}`);

      // Kiểm tra passive
      if (abilities.passive) {
        totalAbilities++;
        const passiveUrl = abilities.passive.imageUrl;
        const passiveWorks = await checkUrl(passiveUrl);

        if (!passiveWorks) {
          hasBrokenUrls = true;
          brokenUrls++;
          fs.appendFileSync(
            logFilePath,
            `  [LỖI] Passive (${abilities.passive.name}): ${passiveUrl}\n`,
          );
          console.log(
            `  [LỖI] Passive (${abilities.passive.name}): ${passiveUrl}`,
          );
        } else {
          workingUrls++;
          fs.appendFileSync(
            logFilePath,
            `  [OK] Passive (${abilities.passive.name}): ${passiveUrl}\n`,
          );
        }
      }

      // Kiểm tra Q
      if (abilities.q) {
        totalAbilities++;
        const qUrl = abilities.q.imageUrl;
        const qWorks = await checkUrl(qUrl);

        if (!qWorks) {
          hasBrokenUrls = true;
          brokenUrls++;
          fs.appendFileSync(
            logFilePath,
            `  [LỖI] Q (${abilities.q.name}): ${qUrl}\n`,
          );
          console.log(`  [LỖI] Q (${abilities.q.name}): ${qUrl}`);
        } else {
          workingUrls++;
          fs.appendFileSync(
            logFilePath,
            `  [OK] Q (${abilities.q.name}): ${qUrl}\n`,
          );
        }
      }

      // Kiểm tra W
      if (abilities.w) {
        totalAbilities++;
        const wUrl = abilities.w.imageUrl;
        const wWorks = await checkUrl(wUrl);

        if (!wWorks) {
          hasBrokenUrls = true;
          brokenUrls++;
          fs.appendFileSync(
            logFilePath,
            `  [LỖI] W (${abilities.w.name}): ${wUrl}\n`,
          );
          console.log(`  [LỖI] W (${abilities.w.name}): ${wUrl}`);
        } else {
          workingUrls++;
          fs.appendFileSync(
            logFilePath,
            `  [OK] W (${abilities.w.name}): ${wUrl}\n`,
          );
        }
      }

      // Kiểm tra E
      if (abilities.e) {
        totalAbilities++;
        const eUrl = abilities.e.imageUrl;
        const eWorks = await checkUrl(eUrl);

        if (!eWorks) {
          hasBrokenUrls = true;
          brokenUrls++;
          fs.appendFileSync(
            logFilePath,
            `  [LỖI] E (${abilities.e.name}): ${eUrl}\n`,
          );
          console.log(`  [LỖI] E (${abilities.e.name}): ${eUrl}`);
        } else {
          workingUrls++;
          fs.appendFileSync(
            logFilePath,
            `  [OK] E (${abilities.e.name}): ${eUrl}\n`,
          );
        }
      }

      // Kiểm tra Ultimate
      if (abilities.ultimate) {
        totalAbilities++;
        const ultimateUrl = abilities.ultimate.imageUrl;
        const ultimateWorks = await checkUrl(ultimateUrl);

        if (!ultimateWorks) {
          hasBrokenUrls = true;
          brokenUrls++;
          fs.appendFileSync(
            logFilePath,
            `  [LỖI] Ultimate (${abilities.ultimate.name}): ${ultimateUrl}\n`,
          );
          console.log(
            `  [LỖI] Ultimate (${abilities.ultimate.name}): ${ultimateUrl}`,
          );
        } else {
          workingUrls++;
          fs.appendFileSync(
            logFilePath,
            `  [OK] Ultimate (${abilities.ultimate.name}): ${ultimateUrl}\n`,
          );
        }
      }

      if (hasBrokenUrls) {
        championsWithBrokenUrls++;
      }

      // Thêm delay giữa các request để tránh rate limit
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // In kết quả tổng quan
    const summary = `
Kết quả kiểm tra URL ảnh kỹ năng:
- Tổng số tướng: ${allChampions.length}
- Tổng số kỹ năng: ${totalAbilities}
- Số URL hoạt động: ${workingUrls} (${((workingUrls / totalAbilities) * 100).toFixed(2)}%)
- Số URL bị lỗi: ${brokenUrls} (${((brokenUrls / totalAbilities) * 100).toFixed(2)}%)
- Số tướng có URL lỗi: ${championsWithBrokenUrls}
- Chi tiết đã được lưu vào file: ${logFilePath}
`;

    console.log(summary);
    fs.appendFileSync(logFilePath, summary);
  } catch (error) {
    console.error('Lỗi:', error);
  } finally {
    await app.close();
  }
}

// Chạy script
bootstrap();
