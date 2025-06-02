import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { ChampionsService } from '../champions.service';
import { CounterCrawlerService } from '../services/counter-crawler.service';
import { CounterService } from '../services/counter.service';

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testUpdateChampionsCounter() {
  console.log('🧪 Testing Update Champions Counter Script');
  console.log('='.repeat(60));

  const app = await NestFactory.createApplicationContext(AppModule);
  const championsService = app.get(ChampionsService);
  const counterCrawlerService = app.get(CounterCrawlerService);
  const counterService = app.get(CounterService);

  try {
    // Test với một vài champions để demo
    const testChampions = ['Zeri', 'Caitlyn', 'Jinx'];

    console.log('📊 Demo with test champions:', testChampions.join(', '));
    console.log('\n📋 Fetching champions from database...');

    for (const championName of testChampions) {
      console.log(`\n🔍 Processing ${championName}...`);

      try {
        // Find champion in database
        const champion = await championsService.findByName(championName);

        if (!champion) {
          console.log(`  ❌ Champion ${championName} not found in database`);
          continue;
        }

        console.log(`  ✅ Found champion: ${champion.name} (${champion.id})`);
        console.log(`  📋 Tags: ${champion.tags?.join(', ') || 'None'}`);

        // Determine role (simple logic for demo)
        const role = 'adc'; // Giả sử tất cả test champions đều là ADC
        console.log(`  📋 Role: ${role}`);

        // Check if counter data already exists
        try {
          const existingCounter = await counterService.findByChampionAndRole(
            champion.id,
            role,
            '15.10',
            'Emerald+',
            'World',
          );

          if (existingCounter) {
            console.log(`  ✅ Counter data already exists:`);
            console.log(
              `     🔴 Weak Against: ${existingCounter.weakAgainst.length}`,
            );
            console.log(
              `     🟢 Strong Against: ${existingCounter.strongAgainst.length}`,
            );
            console.log(
              `     🔵 Best Lane: ${existingCounter.bestLaneCounters.length}`,
            );
            console.log(
              `     🟡 Worst Lane: ${existingCounter.worstLaneCounters.length}`,
            );
            console.log(`     📅 Last Updated: ${existingCounter.lastUpdated}`);
            continue;
          }
        } catch {
          console.log(`  📝 No existing counter data found, will crawl...`);
        }

        // Crawl counter data
        console.log(
          `  🔄 Crawling counter data for ${champion.name.en} (${role})...`,
        );

        const startTime = Date.now();
        const result = await counterCrawlerService.crawlCounterData(
          champion.name.en,
          role,
          '15.10',
          'Emerald+',
        );
        const crawlTime = Date.now() - startTime;

        if (result) {
          console.log(`  ✅ Successfully crawled in ${crawlTime}ms`);

          // Show detailed results
          const totalCounters =
            (result.weakAgainst?.length || 0) +
            (result.strongAgainst?.length || 0) +
            (result.bestLaneCounters?.length || 0) +
            (result.worstLaneCounters?.length || 0);

          console.log(`     📊 Summary:`);
          console.log(`        Total counters: ${totalCounters}`);
          console.log(
            `        🔴 Weak Against: ${result.weakAgainst?.length || 0}`,
          );
          console.log(
            `        🟢 Strong Against: ${result.strongAgainst?.length || 0}`,
          );
          console.log(
            `        🔵 Best Lane: ${result.bestLaneCounters?.length || 0}`,
          );
          console.log(
            `        🟡 Worst Lane: ${result.worstLaneCounters?.length || 0}`,
          );
          console.log(
            `        📄 Content available: ${result.formattedContent ? 'Yes' : 'No'}`,
          );

          // Show some sample counter champions
          if (result.weakAgainst && result.weakAgainst.length > 0) {
            console.log(`     🔴 Sample counters against ${champion.name.en}:`);
            result.weakAgainst
              .slice(0, 3)
              .forEach((counter: any, index: number) => {
                console.log(
                  `        ${index + 1}. ${counter.championName} (${counter.winRate || 'N/A'}% WR)`,
                );
              });
          }

          if (result.strongAgainst && result.strongAgainst.length > 0) {
            console.log(
              `     🟢 Sample champions ${champion.name.en} is strong against:`,
            );
            result.strongAgainst
              .slice(0, 3)
              .forEach((counter: any, index: number) => {
                console.log(
                  `        ${index + 1}. ${counter.championName} (${counter.winRate || 'N/A'}% WR)`,
                );
              });
          }
        } else {
          console.log(
            `  ❌ Failed to crawl counter data for ${champion.name.en}`,
          );
        }

        // Delay between champions to be respectful
        console.log(`  ⏳ Waiting 3 seconds before next champion...`);
        await sleep(3000);
      } catch (error) {
        console.log(`  ❌ Error processing ${championName}: ${error.message}`);
      }
    }

    console.log('\n✅ Test completed!');
    console.log('\n💡 To run full update, use:');
    console.log('   npm run update:all-champions-counter:popular');
    console.log(
      '   npm run update:all-champions-counter:specific --champions="Zeri,Caitlyn"',
    );
    console.log('   npm run update:all-champions-counter');
  } catch (error) {
    console.error('❌ Critical error during test:', error);
  } finally {
    await app.close();
  }
}

// Main execution
async function main() {
  await testUpdateChampionsCounter();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { testUpdateChampionsCounter };
