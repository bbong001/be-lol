import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { NewsService } from '../news.service';

async function checkCrawledArticles() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const newsService = app.get(NewsService);

  try {
    console.log('📊 Kiểm tra articles đã crawl từ Kicdo...');

    const result = await newsService.findAll(10, 1);
    const recentArticles = result.articles.filter((article) =>
      article.tags?.includes('Tin tức'),
    );

    console.log(
      `🔍 Tìm thấy ${recentArticles.length} articles có tag "Tin tức":`,
    );
    console.log('');

    recentArticles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   - Slug: ${article.slug}`);
      console.log(`   - Tags: ${JSON.stringify(article.tags)}`);
      console.log(`   - Content length: ${article.content?.length || 0} chars`);
      console.log(
        `   - Image: ${article.imageUrl ? '✅ ' + article.imageUrl.substring(0, 50) + '...' : '❌ Không có'}`,
      );
      console.log(
        `   - Summary: ${article.summary?.substring(0, 100) || 'Không có'}...`,
      );
      console.log(`   - Published: ${article.published}`);
      console.log(`   - Author: ${article.author?.name || 'N/A'}`);
      console.log(
        `   - Created: ${new Date((article as any).createdAt).toLocaleString()}`,
      );
      console.log('');
    });

    console.log(`✅ Tổng số articles trong database: ${result.total}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await app.close();
  }
}

checkCrawledArticles().catch(console.error);
