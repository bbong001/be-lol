import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CounterCrawlerService } from '../services/counter-crawler.service';

// Test với một vài champions
const TEST_CHAMPIONS = [
  { name: 'Caitlyn', roles: ['adc'] },
  { name: 'Zeri', roles: ['adc'] },
  { name: 'Thresh', roles: ['support'] },
];

async function quickTest() {
  console.log('🧪 Quick Counter Test');
  console.log('='.repeat(40));

  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const counterCrawlerService = app.get(CounterCrawlerService);

    for (const champion of TEST_CHAMPIONS) {
      for (const role of champion.roles) {
        console.log(`\n🎯 Testing ${champion.name} (${role})...`);

        try {
          const result = await counterCrawlerService.crawlCounterData(
            champion.name,
            role,
            '15.10',
            'Emerald+',
          );

          if (result) {
            console.log(`✅ Success for ${champion.name} (${role})`);
            console.log(
              `   Weak Against: ${result.weakAgainst?.length || 0} champions`,
            );
            console.log(
              `   Strong Against: ${result.strongAgainst?.length || 0} champions`,
            );
            console.log(
              `   Best Lane: ${result.bestLaneCounters?.length || 0} champions`,
            );

            // Show sample champions
            if (result.weakAgainst?.length > 0) {
              const sampleWeak = result.weakAgainst
                .slice(0, 3)
                .map((c) => c.championName)
                .join(', ');
              console.log(`   Sample Weak: ${sampleWeak}`);
            }

            if (result.strongAgainst?.length > 0) {
              const sampleStrong = result.strongAgainst
                .slice(0, 3)
                .map((c) => c.championName)
                .join(', ');
              console.log(`   Sample Strong: ${sampleStrong}`);
            }
          } else {
            console.log(`❌ No result for ${champion.name} (${role})`);
          }
        } catch (error) {
          console.log(
            `❌ Error for ${champion.name} (${role}): ${error.message}`,
          );
        }

        // Delay giữa các request
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    await app.close();
    console.log('\n✅ Quick test completed!');
  } catch (error) {
    console.error('💥 Fatal Error:', error.message);
    process.exit(1);
  }
}

// Run test
if (require.main === module) {
  quickTest();
}
