import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CounterCrawlerService } from '../services/counter-crawler.service';
import { CounterService } from '../services/counter.service';

async function testDatabaseIntegration() {
  console.log('🚀 Testing Database Integration');
  console.log('============================================================');

  try {
    // Create NestJS application context with full AppModule
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get services
    const crawlerService = app.get(CounterCrawlerService);
    const counterService = app.get(CounterService);

    console.log('✅ NestJS application context created');
    console.log('✅ Services injected successfully');

    // Test champions to crawl
    const testChampions = [
      { name: 'zeri', role: 'adc' },
      { name: 'caitlyn', role: 'adc' },
      { name: 'jinx', role: 'adc' },
    ];

    console.log('\n📡 Phase 1: Crawling and Saving to Database');
    console.log('------------------------------------------------------------');

    for (const champion of testChampions) {
      try {
        console.log(`\n🎯 Processing ${champion.name} (${champion.role})...`);

        // Check if data already exists
        try {
          const existing = await counterService.findByChampionAndRole(
            champion.name,
            champion.role,
          );
          console.log(
            `⚠️ Data already exists for ${champion.name}, removing first...`,
          );
          await counterService.removeByChampionAndRole(
            champion.name,
            champion.role,
          );
          console.log(`✅ Removed existing data for ${champion.name}`);
        } catch (error) {
          // Data doesn't exist, which is fine
          console.log(`✅ No existing data for ${champion.name} (as expected)`);
        }

        // Crawl and save to database
        const result = await crawlerService.crawlCounterData(
          champion.name,
          champion.role,
        );

        console.log(`✅ Successfully crawled and saved ${champion.name}`);
        console.log(`   - WeakAgainst: ${result.weakAgainst?.length || 0}`);
        console.log(`   - StrongAgainst: ${result.strongAgainst?.length || 0}`);
        console.log(
          `   - BestLaneCounters: ${result.bestLaneCounters?.length || 0}`,
        );
        console.log(
          `   - WorstLaneCounters: ${result.worstLaneCounters?.length || 0}`,
        );

        // Add delay between requests
        console.log('⏳ Waiting 3 seconds before next champion...');
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`❌ Error processing ${champion.name}:`, error.message);
      }
    }

    console.log('\n📊 Phase 2: Retrieving from Database');
    console.log('------------------------------------------------------------');

    for (const champion of testChampions) {
      try {
        console.log(`\n🔍 Retrieving ${champion.name} (${champion.role})...`);

        const data = await counterService.findByChampionAndRole(
          champion.name,
          champion.role,
        );

        console.log(`✅ Successfully retrieved ${champion.name} from database`);
        console.log(`   - Champion: ${data.championName}`);
        console.log(`   - Role: ${data.role}`);
        console.log(`   - Patch: ${data.patch}`);
        console.log(`   - Rank: ${data.rank}`);
        console.log(`   - Region: ${data.region}`);
        console.log(`   - WeakAgainst: ${data.weakAgainst?.length || 0}`);
        console.log(`   - StrongAgainst: ${data.strongAgainst?.length || 0}`);
        console.log(
          `   - BestLaneCounters: ${data.bestLaneCounters?.length || 0}`,
        );
        console.log(
          `   - WorstLaneCounters: ${data.worstLaneCounters?.length || 0}`,
        );
        console.log(`   - Created At: ${data.createdAt}`);
        console.log(`   - Last Updated: ${data.lastUpdated}`);

        // Test specific queries
        console.log('\n   📋 Detailed Counter Information:');
        if (data.weakAgainst && data.weakAgainst.length > 0) {
          console.log('   🔴 Weak Against:');
          data.weakAgainst.forEach((counter: any, index: number) => {
            console.log(
              `      ${index + 1}. ${counter.championName} (Rating: ${counter.counterRating}/10, WR: ${counter.winRate}%)`,
            );
          });
        }

        if (data.strongAgainst && data.strongAgainst.length > 0) {
          console.log('   🟢 Strong Against:');
          data.strongAgainst.forEach((counter: any, index: number) => {
            console.log(
              `      ${index + 1}. ${counter.championName} (Rating: ${counter.counterRating}/10, WR: ${counter.winRate}%)`,
            );
          });
        }

        if (data.bestLaneCounters && data.bestLaneCounters.length > 0) {
          console.log('   ⭐ Best Lane Counters:');
          data.bestLaneCounters.forEach((counter: any, index: number) => {
            console.log(
              `      ${index + 1}. ${counter.championName} (Rating: ${counter.counterRating}/10, WR: ${counter.winRate}%)`,
            );
          });
        }
      } catch (error) {
        console.error(`❌ Error retrieving ${champion.name}:`, error.message);
      }
    }

    console.log('\n🧪 Phase 3: Testing Advanced Queries');
    console.log('------------------------------------------------------------');

    try {
      // Test search by champion name
      console.log('\n🔍 Testing search by champion name (case insensitive)...');
      const searchResults = await counterService.findByChampionName('zeri');
      console.log(
        `✅ Search results for "zeri": ${searchResults.length} items`,
      );
      searchResults.forEach((item: any) => {
        console.log(`   - ${item.championName} (${item.role}) - ${item.patch}`);
      });

      // Test get all with filters
      console.log('\n📊 Testing get all with filters...');
      const allCounters = await counterService.findAll({
        role: 'adc',
        limit: 10,
        skip: 0,
      });
      console.log(`✅ Found ${allCounters.total} ADC champions in database`);
      console.log(`   - Current page: ${allCounters.page}`);
      console.log(`   - Total pages: ${allCounters.totalPages}`);
      console.log(`   - Data count: ${allCounters.data.length}`);

      // Test best counters against specific champion
      console.log('\n🎯 Testing best counters against Zeri...');
      const bestCounters = await counterService.getBestCountersAgainst(
        'zeri',
        'adc',
      );
      console.log(`✅ Best counters against ${bestCounters.championName}:`);
      bestCounters.bestCounters.forEach((counter: any, index: number) => {
        console.log(
          `   ${index + 1}. ${counter.championName} (Rating: ${counter.counterRating}/10, WR: ${counter.winRate}%)`,
        );
      });
    } catch (error) {
      console.error('❌ Error in advanced queries:', error.message);
    }

    console.log('\n🎉 Database Integration Test Completed!');
    console.log('============================================================');

    // Close the application
    await app.close();
  } catch (error) {
    console.error('❌ Fatal error in database integration test:', error);
  }
}

// Run the test
testDatabaseIntegration().catch(console.error);
