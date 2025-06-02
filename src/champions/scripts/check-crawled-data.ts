import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CounterService } from '../services/counter.service';

async function checkCrawledData() {
  console.log('🔍 Checking Crawled Counter Data');
  console.log('='.repeat(60));

  const app = await NestFactory.createApplicationContext(AppModule);
  const counterService = app.get(CounterService);

  try {
    // Check for test champions
    const testChampions = ['Zeri', 'Caitlyn', 'Jinx'];

    for (const championName of testChampions) {
      console.log(`\n📊 Checking ${championName}...`);

      try {
        // Look for counter data
        const counterData = await counterService.findByChampionAndRole(
          championName,
          'adc',
          '15.10',
          'Emerald+',
          'World',
        );

        if (counterData) {
          console.log(`✅ Found counter data for ${championName}:`);
          console.log(`   🆔 ID: ${(counterData as any)._id}`);
          console.log(
            `   🏷️ Champion: ${counterData.championName} (${counterData.championId})`,
          );
          console.log(`   🎭 Role: ${counterData.role}`);
          console.log(`   📊 Stats:`);
          console.log(`      Overall Win Rate: ${counterData.overallWinRate}%`);
          console.log(`      Pick Rate: ${counterData.pickRate}%`);
          console.log(`      Ban Rate: ${counterData.banRate}%`);

          console.log(
            `   🔴 Weak Against (${counterData.weakAgainst.length}):`,
          );
          counterData.weakAgainst
            .slice(0, 5)
            .forEach((counter: any, index: number) => {
              console.log(
                `      ${index + 1}. ${counter.championName} (WR: ${counter.winRate || 'N/A'}%)`,
              );
            });

          console.log(
            `   🟢 Strong Against (${counterData.strongAgainst.length}):`,
          );
          counterData.strongAgainst
            .slice(0, 5)
            .forEach((counter: any, index: number) => {
              console.log(
                `      ${index + 1}. ${counter.championName} (WR: ${counter.winRate || 'N/A'}%)`,
              );
            });

          console.log(
            `   🔵 Best Lane Counters (${counterData.bestLaneCounters.length}):`,
          );
          counterData.bestLaneCounters
            .slice(0, 5)
            .forEach((counter: any, index: number) => {
              console.log(
                `      ${index + 1}. ${counter.championName} (WR: ${counter.winRate || 'N/A'}%)`,
              );
            });

          console.log(
            `   🟡 Worst Lane Counters (${counterData.worstLaneCounters.length}):`,
          );
          counterData.worstLaneCounters
            .slice(0, 5)
            .forEach((counter: any, index: number) => {
              console.log(
                `      ${index + 1}. ${counter.championName} (WR: ${counter.winRate || 'N/A'}%)`,
              );
            });

          console.log(`   📝 Content:`);
          console.log(
            `      Formatted Content: ${counterData.formattedContent ? 'Yes' : 'No'} (${counterData.formattedContent?.length || 0} chars)`,
          );
          console.log(
            `      Weaknesses Content: ${counterData.weaknessesContent ? 'Yes' : 'No'} (${counterData.weaknessesContent?.length || 0} chars)`,
          );
          console.log(
            `      Counter Items Content: ${counterData.counterItemsContent ? 'Yes' : 'No'} (${counterData.counterItemsContent?.length || 0} chars)`,
          );
          console.log(
            `      Strategies Content: ${counterData.strategiesContent ? 'Yes' : 'No'} (${counterData.strategiesContent?.length || 0} chars)`,
          );

          console.log(`   📅 Timestamps:`);
          console.log(`      Created: ${counterData.createdAt}`);
          console.log(`      Last Updated: ${counterData.lastUpdated}`);

          // Show sample content
          if (counterData.weaknessesContent) {
            console.log(`   📄 Sample Weaknesses Content:`);
            console.log(
              `      "${counterData.weaknessesContent.substring(0, 200)}..."`,
            );
          }
        } else {
          console.log(`❌ No counter data found for ${championName} (adc)`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${championName}: ${error.message}`);
      }
    }

    // Check for duplicates
    console.log('\n🔍 Checking for duplicates...');

    // Get all counter data
    const allCountersResult = await counterService.findAll({});
    const allCounters = allCountersResult.data;
    console.log(`📊 Total counter records: ${allCounters.length}`);

    // Group by champion and role
    const groupedCounters = new Map();
    allCounters.forEach((counter: any) => {
      const key = `${counter.championName}-${counter.role}`;
      if (!groupedCounters.has(key)) {
        groupedCounters.set(key, []);
      }
      groupedCounters.get(key).push(counter);
    });

    console.log('\n🎯 Grouped counters:');
    groupedCounters.forEach((counters, key) => {
      if (counters.length > 1) {
        console.log(`⚠️ Duplicate: ${key} has ${counters.length} records`);
        counters.forEach((counter: any, index: number) => {
          console.log(
            `   ${index + 1}. ID: ${counter._id}, Created: ${counter.createdAt}`,
          );
        });
      } else {
        console.log(`✅ Unique: ${key}`);
      }
    });
  } catch (error) {
    console.error('❌ Error during check:', error);
  } finally {
    await app.close();
  }
}

// Main execution
async function main() {
  await checkCrawledData();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { checkCrawledData };
