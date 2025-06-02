import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { getModelToken } from '@nestjs/mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    console.log('Starting to crawl missing activeDescription v2...');

    // Lấy tất cả items thiếu activeDescription
    const itemsWithoutActive = await itemModel
      .find({
        $or: [
          { activeDescription: { $exists: false } },
          { activeDescription: '' },
          { activeDescription: null },
          { isActive: { $ne: true } },
        ],
      })
      .lean();

    console.log(
      `Found ${itemsWithoutActive.length} items without activeDescription`,
    );

    let processedCount = 0;
    let foundActiveCount = 0;
    let errorCount = 0;

    for (const item of itemsWithoutActive) {
      try {
        console.log(`\nProcessing: ${item.name}`);

        // Tạo URL từ tên item
        const slug = item.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
          .replace(/đ/g, 'd')
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .trim();

        const detailUrl = `https://tocchien.net/trang-bi/${slug}/`;
        console.log(`Trying URL: ${detailUrl}`);

        const response = await axios.get(detailUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: 10000,
        });

        const $ = cheerio.load(response.data);

        // Tìm thông tin active description
        let activeDescription = '';
        let isActive = false;

        // Phương pháp 1: Tìm trong div.desc
        const descDiv = $('.desc');
        if (descDiv.length > 0) {
          const descText = descDiv.text().trim();
          console.log(`Found desc div: ${descText.substring(0, 100)}...`);

          // Tìm các pattern active
          const activePatterns = [
            /Hóa Giải[:\-–]?\s*([^.]+(?:\.[^.]*){0,2})/gi,
            /duy nhất[:\-–]?\s*([^.]+(?:\.[^.]*){0,2})/gi,
            /Chủ động[:\-–]?\s*([^.]+(?:\.[^.]*){0,2})/gi,
            /Bị động[:\-–]?\s*([^.]+(?:\.[^.]*){0,2})/gi,
          ];

          for (const pattern of activePatterns) {
            const matches = descText.match(pattern);
            if (matches && matches[0]) {
              activeDescription = matches[0].trim();
              isActive = true;
              console.log(
                `Found active with pattern in desc: ${activeDescription.substring(0, 100)}...`,
              );
              break;
            }
          }
        }

        // Phương pháp 2: Tìm trong các thẻ p
        if (!activeDescription) {
          $('p').each((i, el) => {
            const text = $(el).text().trim();
            if (
              text.includes('Hóa Giải') ||
              text.includes('duy nhất') ||
              text.includes('Chủ động') ||
              text.includes('Bị động')
            ) {
              if (text.length > 20 && text.length < 300) {
                activeDescription = text;
                isActive = true;
                console.log(
                  `Found active in p tag: ${text.substring(0, 100)}...`,
                );
                return false; // break
              }
            }
          });
        }

        // Phương pháp 3: Tìm trong toàn bộ text với regex chính xác hơn
        if (!activeDescription) {
          const fullText = $('body').text();

          // Regex patterns cụ thể hơn
          const specificPatterns = [
            /Hóa Giải:\s*Tạo[^.]+\.[^.]*\./gi,
            /duy nhất[:\-–]?\s*[^.]+\.[^.]*\./gi,
            /Chủ động[:\-–]?\s*[^.]+\.[^.]*\./gi,
            /Bị động[:\-–]?\s*[^.]+\.[^.]*\./gi,
          ];

          for (const pattern of specificPatterns) {
            const matches = fullText.match(pattern);
            if (matches && matches[0]) {
              activeDescription = matches[0].trim();
              isActive = true;
              console.log(
                `Found active with specific pattern: ${activeDescription.substring(0, 100)}...`,
              );
              break;
            }
          }
        }

        // Cập nhật database nếu tìm thấy
        if (activeDescription) {
          await itemModel.updateOne(
            { _id: item._id },
            {
              $set: {
                activeDescription: activeDescription,
                isActive: isActive,
              },
            },
          );
          console.log(`✅ Updated activeDescription for: ${item.name}`);
          foundActiveCount++;
        } else {
          console.log(`❌ No activeDescription found for: ${item.name}`);
        }

        processedCount++;

        // Delay để tránh spam server
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        console.error(`Error processing ${item.name}:`, error.message);
        errorCount++;

        // Delay ngay cả khi có lỗi
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log('\n=== CRAWL ACTIVE DESCRIPTIONS V2 SUMMARY ===');
    console.log(`Total items processed: ${processedCount}`);
    console.log(`Items with activeDescription found: ${foundActiveCount}`);
    console.log(`Errors encountered: ${errorCount}`);
    console.log(
      `Success rate: ${((foundActiveCount / processedCount) * 100).toFixed(1)}%`,
    );

    // Kiểm tra kết quả cuối cùng
    const finalActiveCount = await itemModel.countDocuments({
      isActive: true,
      activeDescription: { $exists: true, $nin: ['', null] },
    });
    console.log(`Final items with activeDescription: ${finalActiveCount}`);
  } catch (error) {
    console.error('Error during crawling active descriptions:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
