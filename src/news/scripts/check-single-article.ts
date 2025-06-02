import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { NewsService } from '../news.service';

async function checkSingleArticle() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const newsService = app.get(NewsService);

  try {
    console.log('🔍 Kiểm tra nội dung chi tiết của một bài viết...');

    // Get first article with "Tin tức" tag
    const result = await newsService.findAll(1, 1);
    const article = result.articles.find((a) => a.tags?.includes('Tin tức'));

    if (!article) {
      console.log('❌ Không tìm thấy bài viết có tag "Tin tức"');
      return;
    }

    console.log(`📖 Kiểm tra bài viết: "${article.title}"`);
    console.log(`🔗 Slug: ${article.slug}`);
    console.log('');

    console.log('📝 CONTENT:');
    console.log('='.repeat(80));
    console.log(article.content);
    console.log('='.repeat(80));
    console.log('');

    console.log('📋 SUMMARY:');
    console.log('-'.repeat(50));
    console.log(article.summary);
    console.log('-'.repeat(50));
    console.log('');

    // Check for unwanted content
    const unwantedTerms = [
      'Author:',
      'author:',
      'Tác giả:',
      'Son Acton',
      'comment',
      'Comment',
      'Bình luận',
      'comment_form',
      '<form',
      '</form>',
      'submit',
      'placeholder',
    ];

    console.log('🔍 Kiểm tra nội dung không mong muốn:');
    unwantedTerms.forEach((term) => {
      const found = article.content.includes(term);
      console.log(
        `${found ? '❌' : '✅'} ${term}: ${found ? 'TÌM THẤY' : 'KHÔNG CÓ'}`,
      );
    });

    console.log('');
    console.log(`📊 Thống kê:`);
    console.log(`- Content length: ${article.content.length} chars`);
    console.log(`- Summary length: ${article.summary?.length || 0} chars`);
    console.log(`- Published: ${article.published}`);
    console.log(`- Tags: ${JSON.stringify(article.tags)}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await app.close();
  }
}

checkSingleArticle().catch(console.error);
