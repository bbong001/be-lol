import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { WildriftService } from '../wildrift.service';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { getModelToken } from '@nestjs/mongoose';
import { CreateWrItemDto } from '../dto/create-wr-item.dto';

interface TocChienItemData {
  name: string;
  imageUrl: string;
  category: string;
  tier: string;
  price?: number;
  description?: string;
  stats?: Record<string, any>;
  detailUrl?: string;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const wildriftService = app.get(WildriftService);

  try {
    console.log(
      'Starting improved crawl of Wild Rift items from tocchien.net...',
    );

    // Get HTML content from items page
    let htmlContent: string;
    const filePath = path.resolve(
      process.cwd(),
      'tocchien-items-page-improved.html',
    );

    if (fs.existsSync(filePath)) {
      console.log('Using cached HTML file...');
      htmlContent = fs.readFileSync(filePath, 'utf8');
    } else {
      console.log('Downloading items page from tocchien.net...');
      const response = await axios.get('https://tocchien.net/items/', {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
        },
        timeout: 30000,
      });
      htmlContent = response.data;
      fs.writeFileSync(filePath, htmlContent);
      console.log('HTML content saved to tocchien-items-page-improved.html');
    }

    const $ = cheerio.load(htmlContent);
    console.log('HTML loaded, starting to parse items...');

    const allItems: TocChienItemData[] = [];

    // Function to determine category from item name
    const determineCategory = (itemName: string): string => {
      const name = itemName.toLowerCase();

      // Giày/Boots
      if (name.includes('giày') || name.includes('boots')) {
        return 'Boots';
      }

      // Vật phẩm phòng thủ
      if (
        name.includes('giáp') ||
        name.includes('khiên') ||
        name.includes('áo choàng') ||
        name.includes('băng giáp') ||
        name.includes('tấm chắn')
      ) {
        return 'Defense';
      }

      // Vật phẩm tấn công vật lý
      if (
        name.includes('kiếm') ||
        name.includes('cung') ||
        name.includes('búa') ||
        name.includes('rìu') ||
        name.includes('dao') ||
        name.includes('súng') ||
        name.includes('móng vuốt') ||
        name.includes('lưỡi hái')
      ) {
        return 'Physical';
      }

      // Vật phẩm phép thuật
      if (
        name.includes('trượng') ||
        name.includes('sách') ||
        name.includes('mũ') ||
        name.includes('ngọc') ||
        name.includes('vọng âm') ||
        name.includes('mặt nạ') ||
        name.includes('thiên thạch') ||
        name.includes('lõi từ') ||
        name.includes('pháo đài')
      ) {
        return 'Magic';
      }

      // Vật phẩm hỗ trợ
      if (
        name.includes('dây chuyền') ||
        name.includes('lời thề') ||
        name.includes('tụ bão') ||
        name.includes('lư hương') ||
        name.includes('thú bông')
      ) {
        return 'Support';
      }

      return 'Other';
    };

    // Function to extract items from text content with better parsing
    const parseItemsFromText = () => {
      console.log('Parsing items from text content...');

      // Get all text content from the page
      const pageText = $('body').text();
      console.log('Page text length:', pageText.length);

      // Extract all item names from the text using regex
      // Look for patterns like "ÁO CHOÀNG BÓNG TỐI" (uppercase Vietnamese text)
      const itemNamePattern =
        /([A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ\s]{3,50})/g;

      const matches = pageText.match(itemNamePattern);
      console.log('Found potential item matches:', matches?.length || 0);

      if (matches) {
        const uniqueNames = new Set<string>();

        matches.forEach((match) => {
          const cleanName = match.trim();

          // Filter out common non-item text
          const skipTexts = [
            'TRANG CHỦ',
            'TƯỚNG',
            'TRANG BỊ',
            'BLOGS',
            'LIÊN HỆ',
            'CHÍNH SÁCH',
            'GIỚI THIỆU',
            'TOCCHIEN NET',
            'LIÊN MINH',
            'TỐC CHIẾN',
            'HUYỀN THOẠI',
            'COPYRIGHT',
            'THUỘC TÍNH',
            'CÔNG ĐI RỪNG',
            'PHÉP THỦ',
            'TỐC ĐỘ',
            'TRỢ THỦ',
            'CẤP ĐỘ',
            'CẤP',
            'MOBA DI ĐỘNG',
          ];

          if (
            cleanName.length >= 5 &&
            cleanName.length <= 50 &&
            !skipTexts.some((skip) => cleanName.includes(skip)) &&
            /^[A-ZÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ\s]+$/.test(
              cleanName,
            )
          ) {
            uniqueNames.add(cleanName);
          }
        });

        console.log('Unique item names found:', uniqueNames.size);

        uniqueNames.forEach((itemName) => {
          const category = determineCategory(itemName);
          const item: TocChienItemData = {
            name: itemName,
            imageUrl: '',
            category,
            tier: 'upgraded',
            price: 0,
            description: `${itemName} - Trang bị Liên Minh Tốc Chiến`,
            stats: {},
            detailUrl: '',
          };

          allItems.push(item);
          console.log(`Found item: ${itemName} (${category})`);
        });
      }
    };

    // Function to try finding items with different selectors
    const parseItemsWithSelectors = () => {
      console.log('Trying to parse items with various selectors...');

      // Try different possible selectors for items
      const selectors = [
        '.item',
        '.item-card',
        '.item-container',
        '.equipment',
        '.equipment-item',
        '[data-item]',
        '[data-equipment]',
        '.grid-item',
        '.card',
        '.product',
        '.product-item',
      ];

      let foundItems = 0;

      selectors.forEach((selector) => {
        const elements = $(selector);
        if (elements.length > 0) {
          console.log(
            `Found ${elements.length} elements with selector: ${selector}`,
          );

          elements.each((i, el) => {
            const $element = $(el);
            const text = $element.text().trim();
            const title = $element.attr('title') || '';
            const alt = $element.find('img').attr('alt') || '';

            const name = title || alt || text;

            if (name && name.length > 3 && name.length < 50) {
              const category = determineCategory(name);
              const item: TocChienItemData = {
                name: name.trim(),
                imageUrl: $element.find('img').attr('src') || '',
                category,
                tier: 'upgraded',
                price: 0,
                description: `${name} - Trang bị Liên Minh Tốc Chiến`,
                stats: {},
                detailUrl: $element.attr('href') || '',
              };

              allItems.push(item);
              foundItems++;
              console.log(
                `Found item with selector ${selector}: ${name} (${category})`,
              );
            }
          });
        }
      });

      console.log(`Total items found with selectors: ${foundItems}`);
    };

    // Function to extract items from known item list
    const parseKnownItems = () => {
      console.log('Adding known items from tocchien.net...');

      const knownItems = [
        'ÁO CHOÀNG BÓNG TỐI',
        'ÁO CHOÀNG HỘ MỆNH',
        'ÁO CHOÀNG NĂNG LƯỢNG',
        'BĂNG GIÁP',
        'BẪY YORDLE',
        'BÚA RÌU SÁT THẦN',
        'BÙA THĂNG HOA',
        'CHẤN TỬ PHA LÊ',
        'CHIẾN GIÁP RỰC ĐỎ',
        'CHÙY GAI MALMORTIUS',
        'CƯA XÍCH HÓA KỸ',
        'CUNG CHẠNG VẠNG',
        'CUỒNG CUNG RUNAAN',
        'DẠ KIẾM DRAKTHARR',
        'ĐAI LƯNG NĂNG LƯỢNG',
        'ĐAO TÍM',
        'DÂY CHUYỀN CHUỘC TỘI',
        'DÂY CHUYỀN NĂNG LƯỢNG',
        'DỊCH CHUYỂN NĂNG LƯỢNG',
        'ĐINH BA HẢI TINH',
        'ĐOẢN ĐAO NAVORI',
        'ĐỘNG CƠ VŨ TRỤ',
        'ĐỒNG XU CỔ ĐẠI',
        'GĂNG TAY BĂNG GIÁ',
        'GIẢI THUẬT NĂNG LƯỢNG',
        'GIÁO THIÊN LY',
        'GIÁP GAI',
        'GIÁP LIỆT SĨ',
        'GIÁP MÁU WARMOG',
        'GIÁP TÂM LINH',
        'GIÁP THIÊN NHIÊN',
        'GIÁP THIÊN THẦN',
        'GIÀY CUỒNG NỘ',
        'GIÀY KHAI SÁNG IONIA',
        'GIÀY NĂNG ĐỘNG',
        'GIÀY NĂNG LƯỢNG',
        'GIÀY PHÀM ĂN',
        'GIÀY THÉP GAI',
        'GIÀY THỦY NGÂN',
        'GƯƠM SUY VONG',
        'HỒNG NGỌC',
        'HUYẾT KIẾM',
        'KHIÊN BĂNG RANDUIN',
        'KHIÊN CỔ VẬT',
        'KHIÊN THÁI DƯƠNG',
        'KIẾM ÁC XÀ',
        'KIẾM DÀI',
        'KIẾM MA YOUMUU',
        'KIẾM MANAMUNE',
        'KIẾM NĂNG LƯỢNG SOLARI',
        'KIẾM TAI ƯƠNG',
        'KÍNH NHẮM MA PHÁP',
        'LIỀM MA',
        'LỜI NHẮC TỬ VONG',
        'LỜI THỀ HỘ VỆ',
        'LÕI TỪ NĂNG LƯỢNG',
        'LƯ HƯƠNG SÔI SỤC',
        'LƯỠI HÁI LINH HỒN',
        'LƯỠI HÁI SƯƠNG ĐEN',
        'MA VŨ SONG KIẾM',
        'MÃNG XÀ NĂNG LƯỢNG',
        'MẶT NẠ ĐỌA ĐẦY LIANDRY',
        'MÁY CHIẾU TÂM LINH',
        'MÓNG VUỐT STERAK',
        'MŨ PHÙ THỦY RABADON',
        'NANH NASHOR',
        'NGỌC VÔ CỰC',
        'NGỌN GIÁO SHOJIN',
        'NGƯNG ĐỌNG NĂNG LƯỢNG',
        'NGUYỆT ĐAO',
        'NỎ TỬ THỦ',
        'PHẢN LỰC NĂNG LƯỢNG',
        'PHÁO ĐÀI SƠN THẠCH',
        'PHONG THẦN KIẾM',
        'QUỶ THƯ MORELLO',
        'QUYỀN TRƯỢNG ÁC THẦN',
        'QUYỀN TRƯỢNG THIÊN THẦN',
        'RÌU ĐẠI MÃNG XÀ',
        'RÌU ĐEN',
        'SÁCH CHIÊU HỒN MEJAI',
        'SÁCH CHIÊU HỒN THỨC TỈNH',
        'SÁCH CŨ',
        'SÚNG HẢI TẶC',
        'SÚNG TỪ TRƯỜNG',
        'TẤM CHẮN BÌNH MINH',
        'TAM HỢP KIẾM',
        'THẠCH GIÁP NĂNG LƯỢNG',
        'THẦN KIẾM MURAMANA',
        'THIÊN THẠCH NĂNG LƯỢNG',
        'THÚ BÔNG BẢO MỘNG NĂNG LƯỢNG',
        'THƯƠNG PHỤC HẬN SERYLDA',
        'TIA CHỚP HUYỀN ẢO',
        'TIM BĂNG',
        'TRÁI TIM KHỔNG THẦN',
        'TRÁT LỆNH ĐẾ VƯƠNG',
        'TRƯỢNG LƯU THỦY',
        'TRƯỢNG PHA LÊ RYLAI',
        'TRƯỢNG TRƯỜNG SINH',
        'TỤ BÃO ZEKE',
        'VINH QUANG BỌC THÉP',
        'VÔ CỰC KIẾM',
        'VỌNG ÂM HÒA ĐIỆU',
        'VỌNG ÂM LUDEN',
        'VÒNG SẮT CỔ TỰ',
        'VŨ ĐIỆU TỬ THẦN',
        'VƯƠNG MIỆN BỎNG CHÁY',
        'VƯƠNG MIỆN SUY VONG',
      ];

      const pageText = $('body').text();

      knownItems.forEach((itemName) => {
        if (pageText.includes(itemName)) {
          // Check if item already exists
          if (!allItems.find((existing) => existing.name === itemName)) {
            const category = determineCategory(itemName);
            const item: TocChienItemData = {
              name: itemName,
              imageUrl: '',
              category,
              tier: 'upgraded',
              price: 0,
              description: `${itemName} - Trang bị Liên Minh Tốc Chiến`,
              stats: {},
              detailUrl: '',
            };

            allItems.push(item);
            console.log(`Added known item: ${itemName} (${category})`);
          }
        }
      });
    };

    // Try different parsing methods
    parseItemsWithSelectors();
    parseItemsFromText();
    parseKnownItems();

    // Remove duplicates
    const uniqueItems = allItems.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.name === item.name),
    );

    console.log(`\nTotal unique items found: ${uniqueItems.length}`);

    // Group by category for display
    const itemsByCategory = uniqueItems.reduce(
      (acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<string, TocChienItemData[]>,
    );

    console.log('\nItems by category:');
    Object.entries(itemsByCategory).forEach(([category, items]) => {
      console.log(`${category}: ${items.length} items`);
    });

    // Save items to database
    console.log('\nSaving items to database...');
    const itemModel = app.get(getModelToken('WrItem'));

    let newCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const itemData of uniqueItems) {
      try {
        const createItemDto: CreateWrItemDto = {
          name: itemData.name,
          description: itemData.description || `${itemData.category} item`,
          stats: itemData.stats || {},
          price: itemData.price || 0,
          buildsFrom: [],
          buildsInto: [],
          category: itemData.category,
          isActive: false,
          activeDescription: '',
          cooldown: 0,
          imageUrl: itemData.imageUrl || '',
          patch: '5.0',
        };

        // Check if item already exists
        const existingItem = await itemModel.findOne({ name: itemData.name });

        if (existingItem) {
          // Update existing item
          await itemModel.updateOne(
            { name: itemData.name },
            {
              $set: {
                ...createItemDto,
                updatedAt: new Date(),
              },
            },
          );
          updatedCount++;
          console.log(`Updated: ${itemData.name}`);
        } else {
          // Create new item
          await wildriftService.createItem(createItemDto);
          newCount++;
          console.log(`Created: ${itemData.name}`);
        }
      } catch (error) {
        console.error(`Error processing ${itemData.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n=== IMPROVED CRAWL SUMMARY ===');
    console.log(`Total items processed: ${uniqueItems.length}`);
    console.log(`New items created: ${newCount}`);
    console.log(`Items updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);

    // Save raw data to JSON file for debugging
    const outputPath = path.resolve(
      process.cwd(),
      'tocchien-items-improved-data.json',
    );
    fs.writeFileSync(outputPath, JSON.stringify(uniqueItems, null, 2));
    console.log(`Raw data saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error during improved crawling:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
