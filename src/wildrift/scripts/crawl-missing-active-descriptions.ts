import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { getModelToken } from '@nestjs/mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    console.log('Starting to crawl missing activeDescription...');

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

        // Tìm các selector có thể chứa thông tin active
        const possibleSelectors = [
          '.item-active',
          '.active-description',
          '.item-passive',
          '.passive-description',
          '.item-effect',
          '.effect-description',
          '.item-ability',
          '.ability-description',
          'p:contains("duy nhất")',
          'p:contains("Chủ động")',
          'p:contains("Bị động")',
          'div:contains("duy nhất")',
          'div:contains("Chủ động")',
          'div:contains("Bị động")',
        ];

        // Thử từng selector
        for (const selector of possibleSelectors) {
          const element = $(selector);
          if (element.length > 0) {
            const text = element.text().trim();
            if (text && text.length > 10) {
              activeDescription = text;
              isActive = true;
              console.log(
                `Found active with selector "${selector}": ${text.substring(0, 100)}...`,
              );
              break;
            }
          }
        }

        // Nếu không tìm thấy bằng selector, tìm trong toàn bộ text
        if (!activeDescription) {
          const fullText = $('body').text();

          // Tìm các pattern cho active description
          const patterns = [
            /duy nhất[:\-–]?\s*([^.]+(?:\.[^.]*){0,3})/gi,
            /Chủ động[:\-–]?\s*([^.]+(?:\.[^.]*){0,3})/gi,
            /Bị động[:\-–]?\s*([^.]+(?:\.[^.]*){0,3})/gi,
            /UNIQUE[:\-–]?\s*([^.]+(?:\.[^.]*){0,3})/gi,
            /ACTIVE[:\-–]?\s*([^.]+(?:\.[^.]*){0,3})/gi,
            /PASSIVE[:\-–]?\s*([^.]+(?:\.[^.]*){0,3})/gi,
          ];

          for (const pattern of patterns) {
            const matches = fullText.match(pattern);
            if (matches && matches[0]) {
              activeDescription = matches[0].trim();
              isActive = true;
              console.log(
                `Found active with pattern: ${activeDescription.substring(0, 100)}...`,
              );
              break;
            }
          }
        }

        // Nếu vẫn không tìm thấy, tìm trong các đoạn văn có từ khóa
        if (!activeDescription) {
          $('p, div').each((i, el) => {
            const text = $(el).text().trim();
            if (
              text.includes('duy nhất') ||
              text.includes('Chủ động') ||
              text.includes('Bị động')
            ) {
              if (text.length > 20 && text.length < 500) {
                activeDescription = text;
                isActive = true;
                console.log(
                  `Found active in paragraph: ${text.substring(0, 100)}...`,
                );
                return false; // break
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
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing ${item.name}:`, error.message);
        errorCount++;

        // Thử với URL khác nếu lỗi 404
        if (error.response?.status === 404) {
          try {
            // Thử URL đơn giản hơn
            const simpleSlug = item.name
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');

            const alternativeUrl = `https://tocchien.net/trang-bi/${simpleSlug}/`;
            console.log(`Trying alternative URL: ${alternativeUrl}`);

            const altResponse = await axios.get(alternativeUrl, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
              timeout: 10000,
            });

            // Xử lý tương tự như trên...
            console.log(`✅ Alternative URL worked for: ${item.name}`);
          } catch (altError) {
            console.log(`❌ Alternative URL also failed for: ${item.name}`);
          }
        }

        // Delay ngay cả khi có lỗi
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log('\n=== CRAWL ACTIVE DESCRIPTIONS SUMMARY ===');
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
