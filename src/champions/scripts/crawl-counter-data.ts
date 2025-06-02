import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CounterCrawlerService } from '../services/counter-crawler.service';
import * as cheerio from 'cheerio';

async function crawlCounterData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const counterCrawlerService = app.get(CounterCrawlerService);

  try {
    console.log('🚀 Starting counter data crawling...\n');

    // Example 1: Crawl single champion
    console.log('📊 Example 1: Crawling Briar jungle counter data...');
    try {
      await counterCrawlerService.crawlCounterData(
        'Briar',
        'jungle',
        '15.10',
        'Emerald+',
      );
    } catch (error) {
      console.warn('⚠️ Failed to crawl Briar jungle:', error.message);
    }

    // Wait between requests
    await sleep(3000);

    // Example 2: Batch crawl multiple champions
    console.log('\n📊 Example 2: Batch crawling multiple champions...');
    const championsToTravel = [
      {
        name: 'Graves',
        roles: ['jungle'],
      },
      {
        name: 'Kindred',
        roles: ['jungle'],
      },
      {
        name: 'Yasuo',
        roles: ['mid', 'top'],
      },
      {
        name: 'Jinx',
        roles: ['adc'],
      },
    ];

    try {
      await counterCrawlerService.batchCrawlCounters(
        championsToTravel,
        '15.10',
        'Emerald+',
      );
    } catch (error) {
      console.warn('⚠️ Batch crawl had some failures:', error.message);
    }

    // Example 3: Demonstrate error handling and retry mechanism
    console.log('\n📊 Example 3: Testing error handling...');
    try {
      // This will likely fail due to invalid champion name
      await counterCrawlerService.crawlCounterData(
        'InvalidChampionName',
        'jungle',
        '15.10',
        'Emerald+',
      );
    } catch (error) {
      console.log('✅ Error handling working correctly:', error.message);
    }

    console.log('\n✅ Counter crawling examples completed!');

    // Show usage of stored HTML data
    console.log('\n📖 Example of accessing stored HTML data...');
    await demonstrateHtmlAccess(app);
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  } finally {
    await app.close();
  }
}

async function demonstrateHtmlAccess(app: any) {
  const counterService = app.get('CounterService');

  try {
    // Find any counter data with HTML content
    const counters = await counterService.findAll({ limit: 1 });

    if (counters.data.length > 0) {
      const counter = counters.data[0];

      console.log('\n🔍 Accessing stored HTML and metadata:');
      console.log('Champion:', counter.championName, counter.role);
      console.log('Source URL:', counter.sourceUrl);
      console.log('HTML Content Length:', counter.rawHtmlContent?.length || 0);

      if (counter.additionalData) {
        console.log(
          'Additional Data Keys:',
          Object.keys(counter.additionalData),
        );
        if (counter.additionalData.itemBuildRecommendations) {
          console.log(
            'Recommended Items:',
            counter.additionalData.itemBuildRecommendations.core,
          );
        }
      }

      // Example: Re-parse the HTML if needed
      if (counter.rawHtmlContent) {
        console.log('\n🔄 Example: Re-parsing stored HTML...');
        const $ = cheerio.load(counter.rawHtmlContent);

        // Extract some data from stored HTML
        const title = $('title').text() || 'No title found';
        const metaDescription =
          $('meta[name="description"]').attr('content') || 'No description';

        console.log('Page Title:', title);
        console.log(
          'Meta Description:',
          metaDescription.substring(0, 100) + '...',
        );
      }
    } else {
      console.log('⚠️ No counter data found. Run the crawler first.');
    }
  } catch (error) {
    console.warn('⚠️ Error accessing HTML data:', error.message);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the script
if (require.main === module) {
  crawlCounterData()
    .then(() => {
      console.log('✅ Crawling script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Crawling script failed:', error);
      process.exit(1);
    });
}

export { crawlCounterData };
