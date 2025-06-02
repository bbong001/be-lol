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
    console.log('Starting to crawl Wild Rift items from tocchien.net...');

    // Get HTML content from items page
    let htmlContent: string;
    const filePath = path.resolve(process.cwd(), 'tocchien-items-page.html');

    if (fs.existsSync(filePath)) {
      console.log('Using cached HTML file...');
      htmlContent = fs.readFileSync(filePath, 'utf8');
    } else {
      console.log('Downloading items page from tocchien.net...');
      const response = await axios.get('https://tocchien.net/items/', {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 30000,
      });
      htmlContent = response.data;
      fs.writeFileSync(filePath, htmlContent);
      console.log('HTML content saved to tocchien-items-page.html');
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

    // Function to parse items from the main content
    const parseItemsFromPage = () => {
      console.log('Parsing items from tocchien.net...');

      // Look for item links - they appear to be in the main content area
      // Based on the website structure, items are likely displayed as links or cards

      // Try multiple selectors to find items
      const itemSelectors = [
        'a[href*="/items/"]',
        '.item-card',
        '.item-link',
        'a[title]',
        'a img[alt]',
      ];

      let itemElements = $();

      for (const selector of itemSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          console.log(
            `Found ${elements.length} elements with selector: ${selector}`,
          );
          itemElements = elements;
          break;
        }
      }

      // If no specific selectors work, try to find all links that might be items
      if (itemElements.length === 0) {
        console.log('Trying to find items by analyzing all links...');
        $('a').each((i, el) => {
          const $link = $(el);
          const href = $link.attr('href') || '';
          const text = $link.text().trim();
          const title = $link.attr('title') || '';

          // Check if this looks like an item link
          if (
            href.includes('/items/') ||
            (text && text.length > 3 && text.length < 50) ||
            (title && title.length > 3 && title.length < 50)
          ) {
            itemElements = itemElements.add(el);
          }
        });
      }

      console.log(
        `Processing ${itemElements.length} potential item elements...`,
      );

      itemElements.each((i, el) => {
        const $element = $(el);
        let name = '';
        let imageUrl = '';
        let detailUrl = '';

        // Get item name
        name = $element.attr('title') || $element.text().trim() || '';

        // Get detail URL
        detailUrl = $element.attr('href') || '';
        if (detailUrl && !detailUrl.startsWith('http')) {
          detailUrl = 'https://tocchien.net' + detailUrl;
        }

        // Get image URL
        const $img = $element.find('img').first();
        if ($img.length > 0) {
          imageUrl = $img.attr('src') || $img.attr('data-src') || '';
          if (!name) {
            name = $img.attr('alt') || $img.attr('title') || '';
          }
        }

        // Fix relative image URLs
        if (imageUrl && !imageUrl.startsWith('http')) {
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          } else if (imageUrl.startsWith('/')) {
            imageUrl = 'https://tocchien.net' + imageUrl;
          }
        }

        // Skip if no name
        if (!name || name.length < 3) return;

        // Skip navigation items and common non-item text
        const skipTexts = [
          'trang chủ',
          'tướng',
          'trang bị',
          'blogs',
          'liên hệ',
          'chính sách',
          'giới thiệu',
        ];
        if (skipTexts.some((skip) => name.toLowerCase().includes(skip))) return;

        const category = determineCategory(name);

        const item: TocChienItemData = {
          name: name.trim(),
          imageUrl: imageUrl || '',
          category,
          tier: 'upgraded',
          price: 0,
          description: `${name} - Trang bị Liên Minh Tốc Chiến`,
          stats: {},
          detailUrl: detailUrl || '',
        };

        allItems.push(item);
        console.log(`Found item: ${name} (${category})`);
        if (imageUrl) console.log(`  Image: ${imageUrl}`);
        if (detailUrl) console.log(`  Detail: ${detailUrl}`);
      });
    };

    // Parse items from the page
    parseItemsFromPage();

    // If we didn't find many items, try alternative parsing
    if (allItems.length < 10) {
      console.log('Low item count, trying alternative parsing methods...');

      // Try to find items in the text content
      const pageText = $('body').text();
      const itemNames = [
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
      ];

      itemNames.forEach((itemName) => {
        if (pageText.includes(itemName)) {
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

          // Check if item already exists
          if (!allItems.find((existing) => existing.name === itemName)) {
            allItems.push(item);
            console.log(`Added item from text: ${itemName} (${category})`);
          }
        }
      });
    }

    console.log(`\nTotal items found: ${allItems.length}`);

    // Group by category for display
    const itemsByCategory = allItems.reduce(
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

    for (const itemData of allItems) {
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

    console.log('\n=== CRAWL SUMMARY ===');
    console.log(`Total items processed: ${allItems.length}`);
    console.log(`New items created: ${newCount}`);
    console.log(`Items updated: ${updatedCount}`);
    console.log(`Errors: ${errorCount}`);

    // Save raw data to JSON file for debugging
    const outputPath = path.resolve(process.cwd(), 'tocchien-items-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2));
    console.log(`Raw data saved to: ${outputPath}`);
  } catch (error) {
    console.error('Error during crawling:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
