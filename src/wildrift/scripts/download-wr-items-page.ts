import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

async function downloadWrItemsPage() {
  try {
    console.log('📥 Downloading Wild Rift items page...');

    const url = 'https://lolwildriftbuild.com/items/';
    console.log(`🌐 URL: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 30000,
    });

    console.log(`✅ Response status: ${response.status}`);
    console.log(`📏 Content length: ${response.data.length} characters`);

    // Save to file
    const filePath = path.resolve(process.cwd(), 'wr-items-page.html');
    fs.writeFileSync(filePath, response.data, 'utf8');

    console.log(`💾 Page saved to: ${filePath}`);

    // Basic content analysis
    const content = response.data;
    const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'No title found';
    console.log(`📄 Page title: ${title}`);

    // Count potential item images
    const imgMatches = content.match(/<img[^>]*>/gi) || [];
    console.log(`🖼️  Total images found: ${imgMatches.length}`);

    // Look for item-related content
    const itemKeywords = [
      'item',
      'equipment',
      'physical',
      'magic',
      'defense',
      'defence',
      'boots',
    ];
    const keywordCounts = {};

    itemKeywords.forEach((keyword) => {
      const regex = new RegExp(keyword, 'gi');
      const matches = content.match(regex) || [];
      keywordCounts[keyword] = matches.length;
    });

    console.log('\n🔍 Keyword analysis:');
    Object.entries(keywordCounts).forEach(([keyword, count]) => {
      console.log(`   ${keyword}: ${count} occurrences`);
    });

    // Look for category sections
    const categoryHeaders = [
      'Physical Items',
      'Magic Items',
      'Defence Items',
      'Defense Items',
      'Boots Items',
    ];

    console.log('\n📋 Category sections found:');
    categoryHeaders.forEach((header) => {
      const found = content.includes(header);
      console.log(`   ${header}: ${found ? '✅ Found' : '❌ Not found'}`);
    });

    console.log('\n🎉 Download completed successfully!');
    console.log('💡 Now you can run: npm run crawl:wr-items');
  } catch (error) {
    console.error('❌ Error downloading Wild Rift items page:', error.message);

    if (error.response) {
      console.error(`   HTTP Status: ${error.response.status}`);
      console.error(`   Response headers:`, error.response.headers);
    }

    if (error.code === 'ECONNABORTED') {
      console.error('   Request timed out after 30 seconds');
    }

    process.exit(1);
  }
}

downloadWrItemsPage();
