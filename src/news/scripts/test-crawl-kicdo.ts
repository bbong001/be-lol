import * as cheerio from 'cheerio';
import axios from 'axios';

async function testKicdoStructure() {
  console.log('🔍 Testing Kicdo.com HTML structure...');

  const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  try {
    // Test main news page
    const response = await axios.get('https://kicdo.com/tin-lol-n1', {
      headers: { 'User-Agent': userAgent },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    console.log('\n📊 Page Analysis:');
    console.log(`- Page title: ${$('title').text()}`);
    console.log(`- Total links: ${$('a').length}`);
    console.log(`- Total images: ${$('img').length}`);
    console.log(`- Total paragraphs: ${$('p').length}`);

    // Test article link selectors
    console.log('\n🔗 Testing article link selectors:');
    const linkSelectors = [
      'a[href*="/tin-tuc/"]',
      'a[href*="/bai-viet/"]',
      'a[href*="/news/"]',
      '.article-item a',
      '.news-item a',
      '.post-link',
      '[class*="post"] a',
      '[class*="article"] a',
    ];

    const foundLinks = new Set<string>();

    for (const selector of linkSelectors) {
      const links = $(selector);
      if (links.length > 0) {
        console.log(`✅ ${selector}: ${links.length} links found`);

        links.each((_, element) => {
          const href = $(element).attr('href');
          if (href) {
            const fullUrl = href.startsWith('http')
              ? href
              : `https://kicdo.com${href}`;
            foundLinks.add(fullUrl);
          }
        });
      } else {
        console.log(`❌ ${selector}: no links found`);
      }
    }

    console.log(`\n📰 Total unique article URLs found: ${foundLinks.size}`);

    // Show first 5 URLs for inspection
    const urlArray = Array.from(foundLinks).slice(0, 5);
    console.log('\n🔍 Sample URLs:');
    urlArray.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });

    // Test if we can access a sample article
    if (urlArray.length > 0) {
      console.log('\n📖 Testing article page structure...');
      const sampleUrl = urlArray[0];

      try {
        const articleResponse = await axios.get(sampleUrl, {
          headers: { 'User-Agent': userAgent },
          timeout: 10000,
        });

        const article$ = cheerio.load(articleResponse.data);

        console.log(`Sample article: ${sampleUrl}`);
        console.log(
          `- Title from h1: "${article$('h1').first().text().trim()}"`,
        );
        console.log(
          `- Meta description: "${article$('meta[name="description"]').attr('content') || 'Not found'}"`,
        );
        console.log(
          `- First paragraph: "${article$('p').first().text().trim().substring(0, 100)}..."`,
        );

        // Test content selectors
        console.log('\n🎯 Testing content selectors:');
        const contentSelectors = [
          '.article-content',
          '.post-content',
          '.entry-content',
          '.article-body',
          '.post-body',
          '.content',
          '[class*="content"]',
          '.main-content',
        ];

        for (const selector of contentSelectors) {
          const content = article$(selector);
          if (content.length > 0) {
            const text = content.text().trim();
            console.log(`✅ ${selector}: ${text.length} characters`);
          } else {
            console.log(`❌ ${selector}: not found`);
          }
        }

        // Test image selectors
        console.log('\n🖼️ Testing image selectors:');
        const imageSelectors = [
          '.featured-image img',
          '.article-image img',
          '.post-thumbnail img',
          '.entry-thumb img',
          'meta[property="og:image"]',
          '.hero-image img',
        ];

        for (const selector of imageSelectors) {
          if (selector.includes('meta')) {
            const content = article$(selector).attr('content');
            if (content) {
              console.log(`✅ ${selector}: ${content}`);
            } else {
              console.log(`❌ ${selector}: not found`);
            }
          } else {
            const imgSrc = article$(selector).first().attr('src');
            if (imgSrc) {
              console.log(`✅ ${selector}: ${imgSrc}`);
            } else {
              console.log(`❌ ${selector}: not found`);
            }
          }
        }

        // Show some class names for debugging
        console.log('\n🏷️ Common class names found:');
        const classNames = new Set<string>();
        article$('[class]').each((_, element) => {
          const classes = article$(element).attr('class')?.split(' ') || [];
          classes.forEach((cls) => {
            if (cls.length > 0) classNames.add(cls);
          });
        });

        const sortedClasses = Array.from(classNames).sort().slice(0, 20);
        sortedClasses.forEach((cls) => console.log(`- .${cls}`));
      } catch (error) {
        console.error(`❌ Error testing article page: ${error.message}`);
      }
    }

    console.log('\n✅ Structure analysis completed!');
    console.log('\n💡 Tips:');
    console.log(
      '- Update selectors in crawl config based on the results above',
    );
    console.log('- Use the working selectors for better crawling results');
    console.log('- Test with different articles to ensure consistency');
  } catch (error) {
    console.error('❌ Error during structure test:', error.message);
  }
}

testKicdoStructure().catch(console.error);
