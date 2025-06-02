import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { NewsService } from '../news.service';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { CreateArticleDto } from '../dtos/create-article.dto';
import slugify from 'slugify';
import * as fs from 'fs';

interface CrawlConfig {
  urls: string[];
  maxArticlesPerPage: number;
  totalMaxArticles: number;
  delayBetweenRequests: number;
}

interface CrawledArticle {
  title: string;
  slug: string;
  content: string;
  summary: string;
  imageUrl: string;
  tags: string[];
  published: boolean;
  sourceUrl: string;
}

const config: CrawlConfig = {
  urls: [
    'https://kicdo.com/tin-lol-n1',
    'https://kicdo.com/tin-tuc-lien-minh-huyen-thoai',
    'https://kicdo.com/game-lol',
  ],
  maxArticlesPerPage: 15,
  totalMaxArticles: 30,
  delayBetweenRequests: 1500, // 1.5 seconds
};

async function crawlKicdoFinal() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const newsService = app.get(NewsService);

  try {
    console.log('🚀 Starting final crawl from kicdo.com');
    console.log(`📄 Pages to crawl: ${config.urls.length}`);
    console.log(`🎯 Target: ${config.totalMaxArticles} articles total`);
    console.log('');

    const allArticleLinks: { url: string; source: string }[] = [];
    const crawledArticles: CrawledArticle[] = [];

    // Collect article links from all pages
    for (const [index, pageUrl] of config.urls.entries()) {
      try {
        console.log(
          `📖 Crawling page ${index + 1}/${config.urls.length}: ${pageUrl}`,
        );

        const response = await axios.get(pageUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        });

        const $ = cheerio.load(response.data);
        const pageLinks: string[] = [];

        // Find article links using proven selectors
        const selectors = [
          '[class*="post"] a',
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
            if (href && !pageLinks.includes(href)) {
              const fullUrl = href.startsWith('http')
                ? href
                : `https://kicdo.com${href}`;

              // Filter out spam/ads links - VERY IMPORTANT!
              if (isValidKicdoArticleLink(fullUrl)) {
                pageLinks.push(fullUrl);
              }
            }
          });

          if (pageLinks.length > 0) break;
        }

        const limitedLinks = pageLinks.slice(0, config.maxArticlesPerPage);
        limitedLinks.forEach((link) => {
          allArticleLinks.push({ url: link, source: pageUrl });
        });

        console.log(
          `📰 Found ${pageLinks.length} links, added ${limitedLinks.length} to queue`,
        );

        // Delay between pages
        await new Promise((resolve) =>
          setTimeout(resolve, config.delayBetweenRequests),
        );
      } catch (error) {
        console.error(`❌ Error crawling page ${pageUrl}:`, error.message);
      }
    }

    // Remove duplicates and limit total
    const uniqueLinks = Array.from(
      new Map(allArticleLinks.map((item) => [item.url, item])).values(),
    ).slice(0, config.totalMaxArticles);

    console.log(`📚 Total unique articles to crawl: ${uniqueLinks.length}`);
    console.log('');

    // Crawl individual articles
    const defaultAuthorId = '681dcf20cf2e99c8b82923a7';
    let successCount = 0;
    let skipCount = 0;

    for (const [index, linkInfo] of uniqueLinks.entries()) {
      try {
        console.log(
          `📖 Crawling article ${index + 1}/${uniqueLinks.length}: ${linkInfo.url}`,
        );

        const articleResponse = await axios.get(linkInfo.url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
        });

        const article$ = cheerio.load(articleResponse.data);

        const title = extractTitle(article$);
        const content = extractContent(article$);
        const summary = extractSummary(article$, content);
        const imageUrl = extractImageUrl(article$);

        if (title && content && content.length > 100) {
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
            tags: ['LOL', 'Tin tức'],
            published: true,
            sourceUrl: linkInfo.url,
          };

          // Try to save to database
          try {
            const createArticleDto: CreateArticleDto = {
              title: crawledArticle.title,
              slug: crawledArticle.slug,
              content: crawledArticle.content,
              summary: crawledArticle.summary,
              imageUrl: crawledArticle.imageUrl,
              tags: crawledArticle.tags,
              published: crawledArticle.published,
            };

            await newsService.create(createArticleDto, defaultAuthorId);
            crawledArticles.push(crawledArticle);
            successCount++;
            console.log(`✅ Saved: ${title.substring(0, 60)}...`);
          } catch (saveError) {
            if (saveError.message.includes('already exists')) {
              skipCount++;
              console.log(
                `⏭️ Skipped (duplicate): ${title.substring(0, 60)}...`,
              );
            } else {
              console.error(`❌ Save error: ${saveError.message}`);
            }
          }
        } else {
          console.log(`❌ Insufficient content: ${linkInfo.url}`);
        }

        // Delay between requests
        await new Promise((resolve) =>
          setTimeout(resolve, config.delayBetweenRequests),
        );
      } catch (error) {
        console.error(`❌ Error crawling ${linkInfo.url}:`, error.message);
      }
    }

    // Save crawl report
    const reportData = {
      crawlDate: new Date().toISOString(),
      totalLinksFound: allArticleLinks.length,
      uniqueLinksProcessed: uniqueLinks.length,
      successfulSaves: successCount,
      skippedDuplicates: skipCount,
      config,
      crawledArticles: crawledArticles.map((a) => ({
        title: a.title,
        slug: a.slug,
        contentLength: a.content.length,
        sourceUrl: a.sourceUrl,
      })),
    };

    fs.writeFileSync(
      'crawl-report-final.json',
      JSON.stringify(reportData, null, 2),
    );

    console.log('');
    console.log('🎉 Final crawl completed!');
    console.log(`📊 Results:`);
    console.log(`   - Total articles processed: ${uniqueLinks.length}`);
    console.log(`   - Successfully saved: ${successCount}`);
    console.log(`   - Skipped (duplicates): ${skipCount}`);
    console.log(`   - Report saved: crawl-report-final.json`);
  } catch (error) {
    console.error('❌ Error during crawling:', error);
  } finally {
    await app.close();
  }
}

function extractTitle($: cheerio.CheerioAPI): string {
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
  const contentSelectors = [
    '[class*="content"]',
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
      // Remove unwanted elements thoroughly
      contentElement.find('script, style, .ads, .advertisement').remove();
      contentElement
        .find('#comments, .info_ac, .comment_form, #comment_form')
        .remove();
      contentElement.find('[id*="comment"], [class*="comment"]').remove();
      contentElement.find('form').remove();
      contentElement
        .find('.social-share, .share-buttons, .related-posts')
        .remove();
      contentElement.find('[class*="social"], [class*="share"]').remove();
      contentElement.find('nav, .breadcrumb, .pagination').remove();
      contentElement
        .find('span:contains("Post by"), span:contains("Son Acton")')
        .remove();
      contentElement
        .find('span:contains("view:"), span:contains("updated")')
        .remove();

      const html = contentElement.html();
      if (html && html.trim().length > 50) {
        return cleanHtmlContent(html.trim());
      }
    }
  }

  // Fallback
  const mainContent = $('body').clone();
  mainContent
    .find('#comments, .info_ac, .comment_form, #comment_form')
    .remove();
  mainContent.find('[id*="comment"], [class*="comment"]').remove();
  mainContent.find('form, script, style, nav, .breadcrumb').remove();
  mainContent
    .find('span:contains("Post by"), span:contains("Son Acton")')
    .remove();

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
  let cleanHtml = html
    .replace(/<p[^>]*>\s*<\/p>/gi, '')
    .replace(/<div[^>]*>\s*<\/div>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Remove unwanted text patterns
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

  // Remove empty elements
  cleanHtml = cleanHtml
    .replace(/<span[^>]*>\s*<\/span>/gi, '')
    .replace(/<div[^>]*>\s*<\/div>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return cleanHtml;
}

function extractSummary($: cheerio.CheerioAPI, content: string): string {
  const metaDescription = $('meta[name="description"]').attr('content');
  if (metaDescription && metaDescription.length > 20) {
    return metaDescription;
  }

  const firstParagraph = $('p').first().text().trim();
  if (firstParagraph && firstParagraph.length > 20) {
    return firstParagraph.length > 200
      ? firstParagraph.substring(0, 200) + '...'
      : firstParagraph;
  }

  const textContent = cheerio.load(content).text().trim();
  return textContent.length > 200
    ? textContent.substring(0, 200) + '...'
    : textContent;
}

function extractImageUrl($: cheerio.CheerioAPI): string {
  const imageSelectors = [
    'meta[property="og:image"]',
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
        return imgSrc.startsWith('http')
          ? imgSrc
          : `https://kicdo.com${imgSrc}`;
      }
    }
  }

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
    '365ok.com.co',
    '33win100.com',
    '33win101.com',
    '789club63.com',
    'weatheroakales.co.uk',
    'elyantardepedraza.com',
    'go88z.dev',
    'f8betlv.com',
    '6686.express',
    'ahihi88.host',
    'hi8818.com',
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
    'fb88',
    'w88',
    'm88',
    'bancadoithuong',
    'dabet',
    'vn88',
    'bong88',
    'hb88',
    '8kbet',
    '68gamebai',
    'zbet',
    'alo789',
    'nhatvip',
    'fabet',
    '7club',
    'sin88',
    'qq88',
    'fc88',
    'sky88',
    'td88',
    'xocdia',
    'fun88',
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
    '/vai-tro-',
    '/tuong-lol-',
    '/trang-bi-',
    '/huong-dan-',
    '/bang-ngoc-',
  ];

  return validPatterns.some((pattern) => url.includes(pattern));
}

crawlKicdoFinal().catch(console.error);
