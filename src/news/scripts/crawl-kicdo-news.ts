import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { NewsService } from '../news.service';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { CreateArticleDto } from '../dtos/create-article.dto';
import slugify from 'slugify';

interface CrawledArticle {
  title: string;
  slug: string;
  content: string;
  summary: string;
  imageUrl: string;
  tags: string[];
  published: boolean;
}

async function crawlKicdoNews() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const newsService = app.get(NewsService);

  try {
    console.log('🚀 Starting crawl from https://kicdo.com/tin-lol-n1');

    // Fetch the main news page
    const response = await axios.get('https://kicdo.com/tin-lol-n1', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    const articles: CrawledArticle[] = [];

    // Find news article links (adjust selector based on actual HTML structure)
    const articleLinks: string[] = [];

    // Common selectors for news articles - updated based on test results
    const selectors = [
      '[class*="post"] a', // Working selector from test
      'a[href*="/tin-tuc/"]',
      'a[href*="/news/"]',
      'a[href*="/bai-viet/"]',
      '.article-link',
      '.news-item a',
      '.post-link',
    ];

    for (const selector of selectors) {
      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        if (href && !articleLinks.includes(href)) {
          // Convert relative URLs to absolute
          const fullUrl = href.startsWith('http')
            ? href
            : `https://kicdo.com${href}`;

          // Filter out spam/ads links - VERY IMPORTANT!
          if (isValidKicdoArticleLink(fullUrl)) {
            articleLinks.push(fullUrl);
          }
        }
      });

      if (articleLinks.length > 0) break; // Stop when we find articles
    }

    console.log(`📰 Found ${articleLinks.length} article links`);

    // Limit to first 10 articles for testing
    const limitedLinks = articleLinks.slice(0, 10);

    for (const [index, articleUrl] of limitedLinks.entries()) {
      try {
        console.log(
          `📖 Crawling article ${index + 1}/${limitedLinks.length}: ${articleUrl}`,
        );

        const articleResponse = await axios.get(articleUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        });

        const article$ = cheerio.load(articleResponse.data);

        // Extract article data (adjust selectors based on actual HTML structure)
        const title = extractTitle(article$);
        const content = extractContent(article$);
        const summary = extractSummary(article$, content);
        const imageUrl = extractImageUrl(article$);

        if (title && content) {
          const slug = slugify(title, {
            lower: true,
            strict: true,
            locale: 'vi',
          });

          const crawledArticle: CrawledArticle = {
            title: title.trim(),
            slug,
            content: content.trim(),
            summary: summary.trim(),
            imageUrl: imageUrl || '',
            tags: ['LOL', 'Tin tức'], // Default tags
            published: true,
          };

          articles.push(crawledArticle);
          console.log(`✅ Successfully extracted: ${title}`);
        } else {
          console.log(`❌ Failed to extract content from: ${articleUrl}`);
        }

        // Add delay to avoid being blocked
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(
          `❌ Error crawling article ${articleUrl}:`,
          error.message,
        );
        continue;
      }
    }

    console.log(`💾 Saving ${articles.length} articles to database...`);

    // Get default author (admin user)
    const defaultAuthorId = '681dcf20cf2e99c8b82923a7'; // Use existing admin ID from your example

    for (const article of articles) {
      try {
        const createArticleDto: CreateArticleDto = {
          title: article.title,
          slug: article.slug,
          content: article.content,
          summary: article.summary,
          imageUrl: article.imageUrl,
          tags: article.tags,
          published: article.published,
        };

        await newsService.create(createArticleDto, defaultAuthorId);
        console.log(`✅ Saved article: ${article.title}`);
      } catch (error) {
        console.error(
          `❌ Error saving article "${article.title}":`,
          error.message,
        );
      }
    }

    console.log('🎉 Crawling completed successfully!');
  } catch (error) {
    console.error('❌ Error during crawling:', error);
  } finally {
    await app.close();
  }
}

function extractTitle($: cheerio.CheerioAPI): string {
  // Try multiple selectors for title
  const titleSelectors = [
    'h1',
    '.article-title',
    '.post-title',
    '.news-title',
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
  // Try multiple selectors for content - updated based on test results
  const contentSelectors = [
    '[class*="content"]', // Working selector from test
    '.article-content',
    '.post-content',
    '.news-content',
    '.content',
    '.article-body',
    '.post-body',
  ];

  for (const selector of contentSelectors) {
    const contentElement = $(selector).first();
    if (contentElement.length) {
      // Clean up unwanted elements more thoroughly
      contentElement.find('script, style, .ads, .advertisement').remove();

      // Remove comment sections and author info
      contentElement
        .find('#comments, .info_ac, .comment_form, #comment_form')
        .remove();
      contentElement.find('[id*="comment"], [class*="comment"]').remove();
      contentElement.find('form').remove();

      // Remove social share and related elements
      contentElement
        .find('.social-share, .share-buttons, .related-posts')
        .remove();
      contentElement.find('[class*="social"], [class*="share"]').remove();

      // Remove navigation and breadcrumb
      contentElement.find('nav, .breadcrumb, .pagination').remove();

      // Remove spans with author/date info
      contentElement
        .find('span:contains("Post by"), span:contains("Son Acton")')
        .remove();
      contentElement
        .find('span:contains("view:"), span:contains("updated")')
        .remove();

      // Remove internal links and "Xem thêm" links
      contentElement.find('a[href^="/"]').remove();
      contentElement.find('p:contains("Xem thêm:")').remove();

      // Remove ALL anchor tags <a></a>
      contentElement.find('a').remove();

      const html = contentElement.html();
      if (html && html.trim().length > 50) {
        return cleanHtmlContent(html.trim());
      }
    }
  }

  // Fallback: get content from paragraphs but avoid comment areas
  const mainContent = $('body').clone();
  mainContent
    .find('#comments, .info_ac, .comment_form, #comment_form')
    .remove();
  mainContent.find('[id*="comment"], [class*="comment"]').remove();
  mainContent.find('form, script, style, nav, .breadcrumb').remove();
  mainContent
    .find('span:contains("Post by"), span:contains("Son Acton")')
    .remove();
  mainContent.find('a[href^="/"]').remove();
  mainContent.find('p:contains("Xem thêm:")').remove();

  // Remove ALL anchor tags <a></a>
  mainContent.find('a').remove();

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
    .replace(/Son Acton/gi, '')
    .replace(/view:\s*\d+/gi, '')
    .replace(/updated[^<]*/gi, '')
    .replace(/Bình luận[^<]*/gi, '')
    .replace(/Comment[^<]*/gi, '')
    .replace(/<span[^>]*class="[^"]*line[^"]*"[^>]*>[^<]*<\/span>/gi, '');

  // Remove "Xem thêm:" links and internal article links
  cleanHtml = cleanHtml
    .replace(/Xem thêm:\s*<a[^>]*href="\/[^"]*"[^>]*>[^<]*<\/a>/gi, '')
    .replace(/<p[^>]*>\s*Xem thêm:[^<]*<a[^>]*>[^<]*<\/a>\s*<\/p>/gi, '')
    .replace(/<a[^>]*href="\/[^"]*"[^>]*>[^<]*<\/a>/gi, '')
    .replace(/Xem thêm:[^<]*$/gi, '');

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

function extractSummary($: cheerio.CheerioAPI, content: string): string {
  // Try to find meta description or excerpt
  const metaDescription = $('meta[name="description"]').attr('content');
  if (metaDescription && metaDescription.length > 20) {
    return metaDescription;
  }

  // Extract first paragraph or create summary from content
  const firstParagraph = $('p').first().text().trim();
  if (firstParagraph && firstParagraph.length > 20) {
    return firstParagraph.length > 200
      ? firstParagraph.substring(0, 200) + '...'
      : firstParagraph;
  }

  // Create summary from content
  const textContent = cheerio.load(content).text().trim();
  return textContent.length > 200
    ? textContent.substring(0, 200) + '...'
    : textContent;
}

function extractImageUrl($: cheerio.CheerioAPI): string {
  // Try multiple selectors for featured image - updated based on test results
  const imageSelectors = [
    'meta[property="og:image"]', // Working selector from test
    '.featured-image img',
    '.article-image img',
    '.post-image img',
    '.thumbnail img',
    'img[class*="featured"]',
    'img[class*="thumbnail"]',
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

  // Fallback: first image in content
  const firstImg = $('img').first().attr('src');
  if (firstImg) {
    return firstImg.startsWith('http')
      ? firstImg
      : `https://kicdo.com${firstImg}`;
  }

  return '';
}

function isValidKicdoArticleLink(url: string): boolean {
  // Must be from kicdo.com domain
  if (!url.includes('kicdo.com')) {
    return false;
  }

  // Block external domains and spam sites
  const blockedDomains = [
    'castamira.com',
    'federicogarcialorca.net',
    'tai-xiu-online.net',
    'hi88com.biz',
    'shbetz.net',
    'max10.casino',
    'f8betht.baby',
    'johnverano.com',
    'lunguk.org',
    'taisunwin.claims',
    'sunwin.ke',
    'gamerikvip.site',
    'new888.rest',
    'sharesinv.com',
    'findkiely.com',
    'aiwinclub.app',
    'mb66ac.com',
    'jun88king.com',
    'okvip.io',
    // Add more blocked domains as needed
  ];

  for (const domain of blockedDomains) {
    if (url.includes(domain)) {
      return false;
    }
  }

  // Block gambling/casino related keywords
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
    'net88',
    'leo88',
    '77bet',
    'bet88',
    '8kbet',
    '789club',
    'kubet',
    'f8bet',
    '6686',
    'hitclub',
    'bj88',
    '99ok',
    'keonhacai',
    'soikeo',
    'banking',
    'casino',
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

  // Only allow kicdo.com articles with specific patterns
  const validPatterns = [
    '/tin-lol-',
    '/tin-tuc-',
    '/bai-viet-',
    '/news-',
    '/lmht-',
    '/lien-minh-',
    '-ns', // kicdo article pattern like ns287, ns168
  ];

  return validPatterns.some((pattern) => url.includes(pattern));
}

// Run the crawl function
crawlKicdoNews().catch(console.error);
