import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CounterCrawlerService } from '../services/counter-crawler.service';

// Danh sách champions và roles để test
const CHAMPION_LIST = [
  // ADC Champions - chọn những cái phổ biến
  { name: 'Caitlyn', roles: ['adc'] },
  { name: 'Jinx', roles: ['adc'] },
  { name: 'Zeri', roles: ['adc'] },
  { name: 'Ashe', roles: ['adc'] },
  { name: 'Varus', roles: ['adc'] },

  // Support Champions
  { name: 'Thresh', roles: ['support'] },
  { name: 'Lulu', roles: ['support'] },
  { name: 'Braum', roles: ['support'] },
  { name: 'Nami', roles: ['support'] },

  // Mid Lane Champions
  { name: 'Yasuo', roles: ['mid'] },
  { name: 'Zed', roles: ['mid'] },
  { name: 'Ahri', roles: ['mid'] },
  { name: 'Veigar', roles: ['mid'] },

  // Top Lane Champions
  { name: 'Garen', roles: ['top'] },
  { name: 'Darius', roles: ['top'] },
  { name: 'Fiora', roles: ['top'] },

  // Jungle Champions
  { name: 'Lee Sin', roles: ['jungle'] },
  { name: 'Graves', roles: ['jungle'] },
];

async function batchUpdateCounters() {
  console.log('🚀 Starting Batch Counter Update');
  console.log('='.repeat(60));
  console.log(`📊 Total Champions to process: ${CHAMPION_LIST.length}`);
  console.log(
    `🎯 Estimated time: ${Math.ceil(CHAMPION_LIST.length * 0.5)} minutes`,
  );
  console.log('='.repeat(60));

  try {
    // Initialize NestJS application
    const app = await NestFactory.createApplicationContext(AppModule);
    const counterCrawlerService = app.get(CounterCrawlerService);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < CHAMPION_LIST.length; i++) {
      const champion = CHAMPION_LIST[i];
      const progress = (((i + 1) / CHAMPION_LIST.length) * 100).toFixed(1);

      console.log(
        `\n[${i + 1}/${CHAMPION_LIST.length}] (${progress}%) Processing ${champion.name}...`,
      );
      console.log('-'.repeat(50));

      for (const role of champion.roles) {
        try {
          console.log(`  🎯 Crawling ${champion.name} (${role})...`);

          // Crawl counter data
          const result = await counterCrawlerService.crawlCounterData(
            champion.name,
            role,
            '15.10',
            'Emerald+',
          );

          if (result) {
            successCount++;
            console.log(`  ✅ Success: ${champion.name} (${role})`);

            // Show brief summary
            const totalCounters =
              (result.weakAgainst?.length || 0) +
              (result.strongAgainst?.length || 0) +
              (result.bestLaneCounters?.length || 0);
            console.log(`     📊 Total counters found: ${totalCounters}`);

            // Show detailed breakdown
            console.log(
              `     🔴 Weak Against: ${result.weakAgainst?.length || 0}`,
            );
            console.log(
              `     🟢 Strong Against: ${result.strongAgainst?.length || 0}`,
            );
            console.log(
              `     🔵 Best Lane: ${result.bestLaneCounters?.length || 0}`,
            );
          } else {
            errorCount++;
            const errorMsg = `Failed to crawl ${champion.name} (${role}) - No result`;
            errors.push(errorMsg);
            console.log(`  ❌ ${errorMsg}`);
          }

          // Delay between requests to be respectful to the server
          await new Promise((resolve) => setTimeout(resolve, 3000));
        } catch (error) {
          errorCount++;
          const errorMsg = `${champion.name} (${role}): ${error.message}`;
          errors.push(errorMsg);
          console.log(`  ❌ Error: ${errorMsg}`);

          // Wait a bit longer on error
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Batch Update Completed!');
    console.log('='.repeat(60));
    console.log(`✅ Successful updates: ${successCount}`);
    console.log(`❌ Failed updates: ${errorCount}`);
    const successRate = (
      (successCount / (successCount + errorCount)) *
      100
    ).toFixed(1);
    console.log(`📊 Success rate: ${successRate}%`);

    if (errors.length > 0) {
      console.log('\n❌ Error Summary:');
      errors.slice(0, 10).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });

      if (errors.length > 10) {
        console.log(`   ... and ${errors.length - 10} more errors`);
      }
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Check MongoDB for updated counter data');
    console.log('2. Verify data quality through API endpoints');
    console.log('3. Run any failed champions manually if needed');

    await app.close();
  } catch (error) {
    console.error('💥 Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the batch update
if (require.main === module) {
  batchUpdateCounters();
}
