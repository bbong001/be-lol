import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { NewsService } from '../news.service';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { CreateArticleDto } from '../dtos/create-article.dto';
import slugify from 'slugify';
import * as fs from 'fs';
import * as path from 'path';

interface CrawlConfig {
  baseUrl: string;
  pages: string[];
  articleLinkSelectors: string[];
  titleSelectors: string[];
  contentSelectors: string[];
  imageSelectors: string[];
  summarySelectors: string[];
  delay: number;
  maxRetries: number;
  maxArticles: number;
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
  crawledAt: Date;
}

class KicdoCrawler {
  private config: CrawlConfig;
  private userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  constructor() {
    this.config = {
      baseUrl: 'https://kicdo.com',
      pages: ['/tin-lol-n1', '/tin-tuc-lien-minh-huyen-thoai', '/game-lol'],
      articleLinkSelectors: [
        'a[href*="/tin-tuc/"]',
        'a[href*="/bai-viet/"]',
        'a[href*="/news/"]',
        '.article-item a',
        '.news-item a',
        '.post-link',
        '[class*="post"] a',
        '[class*="article"] a',
      ],
      titleSelectors: [
        'h1.article-title',
        'h1.post-title',
        'h1.entry-title',
        '.article-header h1',
        '.post-header h1',
        'h1',
        '.title h1',
        '.content-header h1',
      ],
      contentSelectors: [
        '.article-content',
        '.post-content',
        '.entry-content',
        '.article-body',
        '.post-body',
        '.content',
        '[class*="content"] .text',
        '.main-content',
      ],
      imageSelectors: [
        '.featured-image img',
        '.article-image img',
        '.post-thumbnail img',
        '.entry-thumb img',
        '.cover-image img',
        'meta[property="og:image"]',
        '.hero-image img',
      ],
      summarySelectors: [
        'meta[name="description"]',
        'meta[property="og:description"]',
        '.article-excerpt',
        '.post-excerpt',
        '.summary',
        '.intro',
      ],
      delay: 2000,
      maxRetries: 3,
      maxArticles: 20,
    };
  }

  async crawl(): Promise<void> {
    const app = await NestFactory.createApplicationContext(AppModule);
    const newsService = app.get(NewsService);

    try {
      console.log('🚀 Starting advanced crawl from Kicdo.com');

      const allArticleUrls = await this.collectArticleUrls();
      console.log(`📰 Found ${allArticleUrls.length} unique article URLs`);

      const limitedUrls = allArticleUrls.slice(0, this.config.maxArticles);
      const articles: CrawledArticle[] = [];

      // Save URLs to file for debugging
      await this.saveUrlsToFile(allArticleUrls);

      for (const [index, articleUrl] of limitedUrls.entries()) {
        try {
          console.log(
            `📖 Crawling article ${index + 1}/${limitedUrls.length}: ${articleUrl}`,
          );

          const article = await this.crawlSingleArticle(articleUrl);
          if (article) {
            articles.push(article);
            console.log(`✅ Successfully extracted: ${article.title}`);
          } else {
            console.log(`❌ Failed to extract content from: ${articleUrl}`);
          }

          // Add delay between requests
          await this.delay(this.config.delay);
        } catch (error) {
          console.error(`❌ Error crawling ${articleUrl}:`, error.message);
          continue;
        }
      }

      console.log(`💾 Saving ${articles.length} articles to database...`);

      // Get default author (you should adjust this based on your user system)
      const defaultAuthorId = '681dcf20cf2e99c8b82923a7';

      for (const article of articles) {
        try {
          const createArticleDto: CreateArticleDto = {
            title: article.title,
            slug: article.slug,
            content: article.content,
            summary: article.summary,
            imageUrl: article.imageUrl,
            tags: article.tags,
            published: false, // Set to false initially for review
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

      // Save crawl report
      await this.saveCrawlReport(articles);
      console.log('🎉 Crawling completed successfully!');
    } catch (error) {
      console.error('❌ Error during crawling:', error);
    } finally {
      await app.close();
    }
  }

  private async collectArticleUrls(): Promise<string[]> {
    const allUrls = new Set<string>();

    for (const page of this.config.pages) {
      try {
        const pageUrl = `${this.config.baseUrl}${page}`;
        console.log(`🔍 Scanning page: ${pageUrl}`);

        const response = await this.fetchWithRetry(pageUrl);
        const $ = cheerio.load(response.data);

        for (const selector of this.config.articleLinkSelectors) {
          $(selector).each((_, element) => {
            const href = $(element).attr('href');
            if (href) {
              const fullUrl = href.startsWith('http')
                ? href
                : `${this.config.baseUrl}${href}`;

              // Filter out non-article URLs
              if (this.isValidArticleUrl(fullUrl)) {
                allUrls.add(fullUrl);
              }
            }
          });
        }

        console.log(`📄 Found ${allUrls.size} article URLs from ${page}`);
      } catch (error) {
        console.error(`❌ Error scanning page ${page}:`, error.message);
      }
    }

    return Array.from(allUrls);
  }

  private async crawlSingleArticle(
    url: string,
  ): Promise<CrawledArticle | null> {
    try {
      const response = await this.fetchWithRetry(url);
      const $ = cheerio.load(response.data);

      const title = this.extractTitle($);
      const content = this.extractContent($);
      const summary = this.extractSummary($, content);
      const imageUrl = this.extractImageUrl($);

      if (!title || !content) {
        return null;
      }

      const slug = slugify(title, {
        lower: true,
        strict: true,
        locale: 'vi',
        remove: /[*+~.()'"!:@]/g,
      });

      return {
        title: title.trim(),
        slug,
        content: content.trim(),
        summary: summary.trim(),
        imageUrl: imageUrl || '',
        tags: ['LOL', 'Tin tức', 'Kicdo'],
        published: false,
        sourceUrl: url,
        crawledAt: new Date(),
      };
    } catch (error) {
      throw error;
    }
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    for (const selector of this.config.titleSelectors) {
      const title = $(selector).first().text().trim();
      if (title && title.length > 5 && title.length < 200) {
        return title;
      }
    }
    return '';
  }

  private extractContent($: cheerio.CheerioAPI): string {
    for (const selector of this.config.contentSelectors) {
      const contentElement = $(selector).first();
      if (contentElement.length) {
        // Clean up unwanted elements
        contentElement
          .find(
            'script, style, .ads, .advertisement, .social-share, .related-posts',
          )
          .remove();

        const html = contentElement.html();
        if (html && html.trim().length > 200) {
          return this.cleanHtml(html.trim());
        }
      }
    }

    // Fallback: collect all paragraphs
    const paragraphs = $('p')
      .map((_, el) => $(el).html())
      .get()
      .filter((p) => p && p.trim().length > 20);

    if (paragraphs.length > 2) {
      return paragraphs.join('\n');
    }

    return '';
  }

  private extractSummary($: cheerio.CheerioAPI, content: string): string {
    // Try meta descriptions first
    for (const selector of this.config.summarySelectors) {
      const summary = $(selector).attr('content') || $(selector).text().trim();
      if (summary && summary.length > 20 && summary.length < 300) {
        return summary;
      }
    }

    // Extract from first paragraph
    const firstParagraph = $('p').first().text().trim();
    if (firstParagraph && firstParagraph.length > 20) {
      return firstParagraph.length > 250
        ? firstParagraph.substring(0, 250) + '...'
        : firstParagraph;
    }

    // Create from content
    const textContent = cheerio.load(content).text().trim();
    return textContent.length > 250
      ? textContent.substring(0, 250) + '...'
      : textContent;
  }

  private extractImageUrl($: cheerio.CheerioAPI): string {
    for (const selector of this.config.imageSelectors) {
      if (selector.includes('meta')) {
        const content = $(selector).attr('content');
        if (content) {
          return this.normalizeImageUrl(content);
        }
      } else {
        const imgSrc = $(selector).first().attr('src');
        if (imgSrc) {
          return this.normalizeImageUrl(imgSrc);
        }
      }
    }

    return '';
  }

  private normalizeImageUrl(url: string): string {
    if (!url) return '';

    // Remove query parameters for cleaner URLs
    url = url.split('?')[0];

    return url.startsWith('http') ? url : `${this.config.baseUrl}${url}`;
  }

  private cleanHtml(html: string): string {
    // Remove empty paragraphs and divs
    return html
      .replace(/<p[^>]*>\s*<\/p>/gi, '')
      .replace(/<div[^>]*>\s*<\/div>/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private isValidArticleUrl(url: string): boolean {
    // Filter out unwanted URLs
    const excludePatterns = [
      '/tag/',
      '/category/',
      '/page/',
      '/search',
      '#',
      'javascript:',
      'mailto:',
      '.jpg',
      '.png',
      '.gif',
      '.pdf',
    ];

    return !excludePatterns.some((pattern) => url.includes(pattern));
  }

  private async fetchWithRetry(url: string): Promise<any> {
    for (let i = 0; i < this.config.maxRetries; i++) {
      try {
        return await axios.get(url, {
          headers: { 'User-Agent': this.userAgent },
          timeout: 10000,
        });
      } catch (error) {
        if (i === this.config.maxRetries - 1) throw error;
        console.log(`⚠️ Retry ${i + 1}/${this.config.maxRetries} for ${url}`);
        await this.delay(1000 * (i + 1));
      }
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async saveUrlsToFile(urls: string[]): Promise<void> {
    const outputDir = path.join(process.cwd(), 'crawl-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `kicdo-urls-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(urls, null, 2));
    console.log(`💾 Saved ${urls.length} URLs to ${filepath}`);
  }

  private async saveCrawlReport(articles: CrawledArticle[]): Promise<void> {
    const outputDir = path.join(process.cwd(), 'crawl-output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      totalArticles: articles.length,
      source: 'kicdo.com',
      articles: articles.map((a) => ({
        title: a.title,
        slug: a.slug,
        sourceUrl: a.sourceUrl,
        hasImage: !!a.imageUrl,
        contentLength: a.content.length,
      })),
    };

    const filename = `kicdo-crawl-report-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`📊 Saved crawl report to ${filepath}`);
  }
}

// Run the crawler
async function runCrawler() {
  const crawler = new KicdoCrawler();
  await crawler.crawl();
}

runCrawler().catch(console.error);
