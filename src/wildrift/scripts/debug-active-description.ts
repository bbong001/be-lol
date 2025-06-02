import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('Debugging activeDescription structure...');

    // Test với trang ÁO CHOÀNG BÓNG TỐI (đã có activeDescription)
    const testUrl = 'https://tocchien.net/trang-bi/ao-choang-bong-toi/';

    console.log(`Testing: ${testUrl}`);

    const response = await axios.get(testUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Lưu HTML để debug
    fs.writeFileSync('debug-ao-choang-bong-toi.html', response.data);
    console.log('Saved HTML to debug-ao-choang-bong-toi.html');

    // Tìm tất cả text có chứa "duy nhất"
    console.log('\n=== Text containing "duy nhất" ===');
    let foundCount = 0;
    $('*').each((i, el) => {
      const text = $(el).text().trim();
      if (text.includes('duy nhất')) {
        foundCount++;
        console.log(
          `${foundCount}. Element: ${(el as any).tagName || el.type}`,
        );
        console.log(`   Class: ${$(el).attr('class') || 'none'}`);
        console.log(`   Text: ${text.substring(0, 300)}...`);
        console.log('');
      }
    });

    // Tìm text có "Hóa Giải"
    console.log('\n=== Text containing "Hóa Giải" ===');
    foundCount = 0;
    $('*').each((i, el) => {
      const text = $(el).text().trim();
      if (text.includes('Hóa Giải')) {
        foundCount++;
        console.log(
          `${foundCount}. Element: ${(el as any).tagName || el.type}`,
        );
        console.log(`   Class: ${$(el).attr('class') || 'none'}`);
        console.log(`   Text: ${text.substring(0, 300)}...`);
        console.log('');
      }
    });

    // Tìm tất cả các đoạn văn dài
    console.log('\n=== Long paragraphs (50-500 chars) ===');
    foundCount = 0;
    $('p, div, span').each((i, el) => {
      const text = $(el).text().trim();
      if (text.length >= 50 && text.length <= 500) {
        foundCount++;
        if (foundCount <= 10) {
          // Chỉ hiển thị 10 đầu tiên
          console.log(
            `${foundCount}. Element: ${(el as any).tagName || el.type}`,
          );
          console.log(`   Class: ${$(el).attr('class') || 'none'}`);
          console.log(`   Length: ${text.length}`);
          console.log(`   Text: ${text.substring(0, 200)}...`);
          console.log('');
        }
      }
    });

    console.log(`Total long paragraphs found: ${foundCount}`);
  } catch (error) {
    console.error('Error during debugging:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
