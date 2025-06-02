import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { getModelToken } from '@nestjs/mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    console.log('Starting to crawl missing activeDescription v4...');

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

        console.log('Searching for activeDescription...');

        // Phương pháp 1: Tìm trong tất cả thẻ p với keywords chính xác
        $('p').each((i, el) => {
          const text = $(el).text().trim();

          // Kiểm tra các keywords active chính xác
          if (
            text.includes('(Kích Hoạt)') ||
            text.includes('duy nhất') ||
            text.includes('Hóa Giải:')
          ) {
            // Kiểm tra độ dài hợp lý (20-300 ký tự)
            if (text.length >= 20 && text.length <= 300) {
              activeDescription = text;
              isActive = true;
              console.log(`✅ Found activeDescription in p tag: ${text}`);
              return false; // break
            }
          }
        });

        // Phương pháp 2: Tìm trong tất cả text với regex patterns chính xác
        if (!activeDescription) {
          const bodyText = $('body').text();

          // Regex patterns cụ thể cho từng loại active
          const patterns = [
            // Pattern cho (Kích Hoạt)
            /[^.]*\(Kích Hoạt\):[^.]+\.[^.]*\./gi,
            // Pattern cho duy nhất
            /duy nhất[:\-–]?\s*[^.]+\.[^.]*\./gi,
            // Pattern cho Hóa Giải
            /Hóa Giải:\s*[^.]+\.[^.]*\./gi,
          ];

          for (const pattern of patterns) {
            const match = bodyText.match(pattern);
            if (match && match[0]) {
              activeDescription = match[0].trim();
              isActive = true;
              console.log(`✅ Found with regex pattern: ${activeDescription}`);
              break;
            }
          }
        }

        // Phương pháp 3: Tìm trong tất cả elements với text chứa keywords
        if (!activeDescription) {
          $('*').each((i, el) => {
            const text = $(el).text().trim();

            // Tìm text chứa "(Kích Hoạt)" với độ dài hợp lý
            if (
              text.includes('(Kích Hoạt)') &&
              text.length >= 30 &&
              text.length <= 200
            ) {
              // Tách ra phần chứa (Kích Hoạt)
              const sentences = text.split('.');
              for (const sentence of sentences) {
                if (sentence.includes('(Kích Hoạt)') && sentence.length >= 20) {
                  activeDescription = sentence.trim() + '.';
                  isActive = true;
                  console.log(
                    `✅ Found "(Kích Hoạt)" in element: ${activeDescription}`,
                  );
                  return false; // break
                }
              }
            }

            // Tìm text chứa "duy nhất" với độ dài hợp lý
            if (
              text.includes('duy nhất') &&
              text.length >= 30 &&
              text.length <= 200
            ) {
              const sentences = text.split('.');
              for (const sentence of sentences) {
                if (sentence.includes('duy nhất') && sentence.length >= 20) {
                  activeDescription = sentence.trim() + '.';
                  isActive = true;
                  console.log(
                    `✅ Found "duy nhất" in element: ${activeDescription}`,
                  );
                  return false; // break
                }
              }
            }

            // Tìm text chứa "Hóa Giải:" với độ dài hợp lý
            if (
              text.includes('Hóa Giải:') &&
              text.length >= 30 &&
              text.length <= 200
            ) {
              const sentences = text.split('.');
              for (const sentence of sentences) {
                if (sentence.includes('Hóa Giải:') && sentence.length >= 20) {
                  activeDescription = sentence.trim() + '.';
                  isActive = true;
                  console.log(
                    `✅ Found "Hóa Giải:" in element: ${activeDescription}`,
                  );
                  return false; // break
                }
              }
            }
          });
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

    console.log('\n=== CRAWL ACTIVE DESCRIPTIONS V4 SUMMARY ===');
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
