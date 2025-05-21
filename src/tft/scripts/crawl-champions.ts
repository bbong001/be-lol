import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { TftCrawlerService } from '../services/tft-crawler.service';

/**
 * Script to crawl TFT champions from tftactics.gg
 *
 * Usage:
 * npx ts-node -r tsconfig-paths/register src/tft/scripts/crawl-champions.ts
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const crawlerService = app.get(TftCrawlerService);
    console.log('Starting to crawl TFT champions...');

    // Option 1: Just crawl and display
    const champions = await crawlerService.crawlChampions();
    console.log(`Crawled ${champions.length} champions:`);
    console.table(
      champions.map((c) => ({
        name: c.name,
        cost: c.cost,
        set: c.set,
        imageUrl: c.imageUrl,
      })),
    );

    // Option 2: Crawl and save to database
    // Uncomment the line below to save to database
    // await crawlerService.saveCrawledChampions();
    // console.log('Champions saved to database successfully!');
  } catch (error) {
    console.error('Error during crawling:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
