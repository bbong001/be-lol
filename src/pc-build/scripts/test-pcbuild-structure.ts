import * as cheerio from 'cheerio';
import axios from 'axios';

async function testPCBuildStructure() {
  try {
    console.log(
      '🔍 Testing PC Build page structure from https://kicdo.com/build-pc-n22',
    );

    const response = await axios.get('https://kicdo.com/build-pc-n22', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    console.log('\n📰 Finding PC Build links...');

    // Test different selectors to find PC build articles
    const selectors = [
      '[class*="post"] a',
      '[class*="article"] a',
      '[class*="build"] a',
      'a[href*="/build-pc"]',
      'a[href*="/pc-build"]',
      'a[href*="/cau-hinh"]',
      '.entry-title a',
      '.post-title a',
      '.article-link',
      'a[href*="/ns"]', // kicdo article pattern
    ];

    let foundLinks = 0;
    for (const selector of selectors) {
      const links = $(selector);
      if (links.length > 0) {
        console.log(`✅ Selector "${selector}" found ${links.length} links`);

        // Show first 5 links
        links.slice(0, 5).each((_, element) => {
          const href = $(element).attr('href');
          const title = $(element).text().trim();
          if (href && title) {
            const fullUrl = href.startsWith('http')
              ? href
              : `https://kicdo.com${href}`;
            console.log(`   - ${title.substring(0, 60)}... -> ${fullUrl}`);
          }
        });

        foundLinks += links.length;
        if (foundLinks > 0) break; // Use first working selector
      }
    }

    if (foundLinks === 0) {
      console.log('❌ No PC build links found with current selectors');
    }

    console.log('\n🎯 Testing content extraction...');

    // Test content selectors
    const contentSelectors = [
      '[class*="content"]',
      '.entry-content',
      '.post-content',
      '.article-content',
      '.content',
      'article',
      'main',
    ];

    for (const selector of contentSelectors) {
      const content = $(selector).first();
      if (content.length > 0) {
        const text = content.text().trim();
        console.log(
          `✅ Content selector "${selector}" found ${text.length} characters`,
        );
        console.log(`   Preview: ${text.substring(0, 200)}...`);
        break;
      }
    }

    console.log('\n🖼️ Testing image extraction...');

    // Test image selectors
    const imageSelectors = [
      'meta[property="og:image"]',
      '.featured-image img',
      '.post-thumbnail img',
      'img[class*="featured"]',
      'article img',
    ];

    for (const selector of imageSelectors) {
      const image = $(selector).first();
      if (image.length > 0) {
        const src = image.attr('content') || image.attr('src');
        console.log(`✅ Image selector "${selector}" found: ${src}`);
        break;
      }
    }

    console.log('\n📄 Page info:');
    console.log(`Title: ${$('title').text()}`);
    console.log(
      `Meta description: ${$('meta[name="description"]').attr('content')}`,
    );
    console.log(`Total page length: ${response.data.length} characters`);
  } catch (error) {
    console.error('❌ Error testing structure:', error.message);
  }
}

testPCBuildStructure().catch(console.error);
