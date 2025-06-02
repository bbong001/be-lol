import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { NewsService } from '../news.service';

async function checkRemovedLinks() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const newsService = app.get(NewsService);

  try {
    console.log('🔍 Checking for remaining <a> tags in crawled articles...');

    // Get latest 10 articles
    const result = await newsService.findAll(10, 1);

    console.log(`📄 Checking ${result.articles.length} articles:`);

    for (const article of result.articles) {
      console.log(`\n📰 Article: ${article.title}`);

      // Check for any remaining <a> tags
      const hasLinks = /<a[^>]*>.*?<\/a>/gi.test(article.content);

      if (hasLinks) {
        console.log('❌ Found remaining <a> tags!');
        const matches = article.content.match(/<a[^>]*>.*?<\/a>/gi);
        console.log('Links found:', matches?.slice(0, 3)); // Show first 3 matches
      } else {
        console.log('✅ No <a> tags found - Clean!');
      }

      // Check content length and preview
      console.log(`Content length: ${article.content.length} characters`);
      const preview = article.content.replace(/<[^>]*>/g, '').substring(0, 200);
      console.log(`Preview: ${preview}...`);
    }

    console.log('\n✅ Check completed!');
  } catch (error) {
    console.error('❌ Error during check:', error);
  } finally {
    await app.close();
  }
}

checkRemovedLinks().catch(console.error);
