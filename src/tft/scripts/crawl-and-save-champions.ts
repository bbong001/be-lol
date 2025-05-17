import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { TftCrawlerService } from '../services/tft-crawler.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('CrawlAndSaveChampions');
  
  try {
    logger.log('Starting crawler script...');
    
    // Create a standalone application
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Get the TftCrawlerService
    const tftCrawlerService = app.get(TftCrawlerService);
    
    // Crawl and save champions
    logger.log('Crawling champions...');
    await tftCrawlerService.saveCrawledChampions();
    logger.log('Champions crawled and saved successfully');
    
    // Update champion details
    logger.log('Updating champion details...');
    const result = await tftCrawlerService.updateAllChampionDetails();
    logger.log(
      `Champion details updated: ${result.updated} successful, ${result.failed} failed`,
    );
    
    // Crawl and save items
    logger.log('Crawling items...');
    await tftCrawlerService.saveCrawledItems();
    logger.log('Items crawled and saved successfully');
    
    await app.close();
    logger.log('Script completed successfully');
  } catch (error) {
    logger.error(`Error running crawler script: ${error.message}`);
    process.exit(1);
  }
}

bootstrap(); 