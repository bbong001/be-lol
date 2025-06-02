import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PcBuildService } from '../pc-build.service';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { CreatePCBuildDto } from '../dtos/create-pc-build.dto';
import slugify from 'slugify';

interface CrawledPCBuild {
  name: string;
  description: string;
  content: string;
  imageUrl: string;
  tags: string[];
  isPublic: boolean;
}

async function crawlKicdoPCBuild() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const pcBuildService = app.get(PcBuildService);

  try {
    console.log(
      '🚀 Starting PC Build crawl from https://kicdo.com/build-pc-n22',
    );

    // Fetch the main PC build page
    const response = await axios.get('https://kicdo.com/build-pc-n22', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    const pcBuilds: CrawledPCBuild[] = [];

    // Find PC build article links using working selector
    const articleLinks: string[] = [];

    $('[class*="post"] a').each((_, element) => {
      const href = $(element).attr('href');
      if (href && !articleLinks.includes(href)) {
        // Convert relative URLs to absolute
        const fullUrl = href.startsWith('http')
          ? href
          : `https://kicdo.com${href}`;

        // Filter for valid PC build related links
        if (isValidPCBuildLink(fullUrl)) {
          articleLinks.push(fullUrl);
        }
      }
    });

    console.log(`🔧 Found ${articleLinks.length} PC build article links`);

    // Limit to first 10 articles for testing
    const limitedLinks = articleLinks.slice(0, 10);

    for (const [index, articleUrl] of limitedLinks.entries()) {
      try {
        console.log(
          `🖥️ Crawling PC build ${index + 1}/${limitedLinks.length}: ${articleUrl}`,
        );

        const articleResponse = await axios.get(articleUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        });

        const article$ = cheerio.load(articleResponse.data);

        // Extract PC build data
        const name = extractTitle(article$);
        const content = extractContent(article$);
        const description = extractDescription(article$, content);
        const imageUrl = extractImageUrl(article$);

        if (name && content) {
          const crawledPCBuild: CrawledPCBuild = {
            name: name.trim(),
            description: description.trim(),
            content: content.trim(),
            imageUrl: imageUrl || '',
            tags: ['PC Build', 'Gaming', 'Hardware'], // Default tags
            isPublic: true,
          };

          pcBuilds.push(crawledPCBuild);
          console.log(`✅ Successfully extracted: ${name}`);
        } else {
          console.log(`❌ Failed to extract content from: ${articleUrl}`);
        }

        // Add delay to avoid being blocked
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(
          `❌ Error crawling PC build ${articleUrl}:`,
          error.message,
        );
        continue;
      }
    }

    console.log(`💾 Saving ${pcBuilds.length} PC builds to database...`);

    // Get default user ID (admin user)
    const defaultUserId = '681dcf20cf2e99c8b82923a7'; // Use existing admin ID

    for (const pcBuild of pcBuilds) {
      try {
        const createPCBuildDto: CreatePCBuildDto = {
          name: pcBuild.name,
          description: pcBuild.description,
          content: pcBuild.content,
          imageUrl: pcBuild.imageUrl,
          tags: pcBuild.tags,
          isPublic: pcBuild.isPublic,
        };

        await pcBuildService.createBuild(createPCBuildDto, defaultUserId);
        console.log(`✅ Saved PC build: ${pcBuild.name}`);
      } catch (error) {
        console.error(
          `❌ Error saving PC build "${pcBuild.name}":`,
          error.message,
        );
      }
    }

    console.log('🎉 PC Build crawling completed successfully!');
  } catch (error) {
    console.error('❌ Error during PC build crawling:', error);
  } finally {
    await app.close();
  }
}

function extractTitle($: cheerio.CheerioAPI): string {
  // Try multiple selectors for title
  const titleSelectors = [
    'h1',
    '.entry-title',
    '.post-title',
    '.article-title',
    'title',
    '[class*="title"] h1',
    '[class*="title"] h2',
  ];

  for (const selector of titleSelectors) {
    const title = $(selector).first().text().trim();
    if (title && title.length > 10) {
      return title;
    }
  }

  return '';
}

function extractContent($: cheerio.CheerioAPI): string {
  // Try multiple selectors for content - using working selector from test
  const contentSelectors = [
    'main',
    '[class*="content"]',
    '.entry-content',
    '.post-content',
    '.article-content',
    '.content',
    'article',
  ];

  for (const selector of contentSelectors) {
    const contentElement = $(selector).first();
    if (contentElement.length) {
      // Clean up unwanted elements
      contentElement.find('script, style, .ads, .advertisement').remove();

      // Remove comment sections and navigation
      contentElement.find('#comments, .comment_form, #comment_form').remove();
      contentElement.find('[id*="comment"], [class*="comment"]').remove();
      contentElement.find('form').remove();

      // Remove social share and related elements
      contentElement
        .find('.social-share, .share-buttons, .related-posts')
        .remove();
      contentElement.find('[class*="social"], [class*="share"]').remove();

      // Remove navigation and breadcrumb
      contentElement.find('nav, .breadcrumb, .pagination').remove();

      // Remove ALL anchor tags <a></a>
      contentElement.find('a').remove();

      const html = contentElement.html();
      if (html && html.trim().length > 50) {
        return cleanHtmlContent(html.trim());
      }
    }
  }

  // Fallback: get content from paragraphs
  const mainContent = $('body').clone();
  mainContent.find('#comments, .comment_form, #comment_form').remove();
  mainContent.find('[id*="comment"], [class*="comment"]').remove();
  mainContent.find('form, script, style, nav, .breadcrumb').remove();
  mainContent.find('a').remove(); // Remove all links

  const paragraphs = mainContent
    .find('p')
    .map((_, el) => $(el).html())
    .get()
    .filter((p) => p && p.trim().length > 20);

  if (paragraphs.length > 0) {
    return cleanHtmlContent(paragraphs.join('\n'));
  }

  return '';
}

function cleanHtmlContent(html: string): string {
  // Remove empty paragraphs and divs
  let cleanHtml = html
    .replace(/<p[^>]*>\s*<\/p>/gi, '')
    .replace(/<div[^>]*>\s*<\/div>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove any remaining author or comment references
  cleanHtml = cleanHtml
    .replace(/Author:\s*[^<]+/gi, '')
    .replace(/Tác giả:\s*[^<]+/gi, '')
    .replace(/Post by\s*[^<]+/gi, '')
    .replace(/view:\s*\d+/gi, '')
    .replace(/updated[^<]*/gi, '')
    .replace(/Bình luận[^<]*/gi, '')
    .replace(/Comment[^<]*/gi, '');

  // Remove ALL remaining anchor tags <a></a>
  cleanHtml = cleanHtml.replace(/<a[^>]*>.*?<\/a>/gi, '');

  // Remove remaining empty elements
  cleanHtml = cleanHtml
    .replace(/<span[^>]*>\s*<\/span>/gi, '')
    .replace(/<div[^>]*>\s*<\/div>/gi, '')
    .replace(/<p[^>]*>\s*<\/p>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleanHtml;
}

function extractDescription($: cheerio.CheerioAPI, content: string): string {
  // Try to find meta description or excerpt
  const metaDescription = $('meta[name="description"]').attr('content');
  if (metaDescription && metaDescription.length > 20) {
    return metaDescription;
  }

  // Extract first paragraph or create description from content
  const firstParagraph = $('p').first().text().trim();
  if (firstParagraph && firstParagraph.length > 20) {
    return firstParagraph.length > 200
      ? firstParagraph.substring(0, 200) + '...'
      : firstParagraph;
  }

  // Create description from content
  const textContent = cheerio.load(content).text().trim();
  return textContent.length > 200
    ? textContent.substring(0, 200) + '...'
    : textContent;
}

function extractImageUrl($: cheerio.CheerioAPI): string {
  // Try multiple selectors for featured image
  const imageSelectors = [
    'meta[property="og:image"]',
    '.featured-image img',
    '.post-thumbnail img',
    'img[class*="featured"]',
    'article img',
    'img',
  ];

  for (const selector of imageSelectors) {
    if (selector.includes('meta')) {
      const content = $(selector).attr('content');
      if (content) {
        return content.startsWith('http')
          ? content
          : `https://kicdo.com${content}`;
      }
    } else {
      const imgSrc = $(selector).first().attr('src');
      if (imgSrc) {
        // Convert relative URL to absolute
        return imgSrc.startsWith('http')
          ? imgSrc
          : `https://kicdo.com${imgSrc}`;
      }
    }
  }

  return '';
}

function isValidPCBuildLink(url: string): boolean {
  // Must be from kicdo.com domain
  if (!url.includes('kicdo.com')) {
    return false;
  }

  // Block spam gambling/casino links
  const blockedKeywords = [
    'casino',
    'bet',
    'game',
    'win',
    'club',
    'taixiu',
    'tài xỉu',
    'cakhia',
    'xoilac',
    'socolive',
    'rikvip',
    'go88',
    'new88',
    'sunwin',
    'iwin',
    'mb66',
    'jun88',
    'hello88',
    'sv388',
    'banking',
    'poker',
    'bacara',
    'blackjack',
    'roulette',
    'slot',
  ];

  const urlLower = url.toLowerCase();
  for (const keyword of blockedKeywords) {
    if (urlLower.includes(keyword)) {
      return false;
    }
  }

  // Allow PC build related patterns
  const validPatterns = [
    '/ns', // kicdo article pattern like ns214, ns213
    '/build-pc',
    '/pc-build',
    '/cau-hinh',
    '/gaming',
    '/hardware',
    'tai-nghe', // gaming headset
    'chuot-gaming', // gaming mouse
    'ban-phim', // keyboard
    'sens-converter', // sensitivity converter
  ];

  return validPatterns.some((pattern) => url.includes(pattern));
}

// Run the crawl function
crawlKicdoPCBuild().catch(console.error);
