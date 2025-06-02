import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CounterService } from '../services/counter.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const counterService = app.get(CounterService);

  try {
    console.log('🔍 Checking Zeri counter data details...');

    // Find Zeri counter data
    const counterData = await counterService.findByChampionAndRole(
      'Zeri',
      'adc',
    );

    if (!counterData) {
      console.error('❌ No counter data found for Zeri (adc)');
      return;
    }

    console.log('✅ Found Zeri counter data!');
    console.log('\n📊 Basic Stats:');
    console.log(`- Overall Win Rate: ${counterData.overallWinRate}%`);
    console.log(`- Pick Rate: ${counterData.pickRate}%`);
    console.log(`- Ban Rate: ${counterData.banRate}%`);
    console.log(`- Patch: ${counterData.patch}`);
    console.log(`- Rank: ${counterData.rank}`);

    console.log('\n🔍 Counter Champions Analysis:');
    console.log(
      `- Weak Against: ${counterData.weakAgainst?.length || 0} champions`,
    );
    console.log(
      `- Strong Against: ${counterData.strongAgainst?.length || 0} champions`,
    );
    console.log(
      `- Best Lane Counters: ${counterData.bestLaneCounters?.length || 0} champions`,
    );
    console.log(
      `- Worst Lane Counters: ${counterData.worstLaneCounters?.length || 0} champions`,
    );

    // Show detailed weak against
    if (counterData.weakAgainst && counterData.weakAgainst.length > 0) {
      console.log('\n🔍 Weak Against Details:');
      counterData.weakAgainst.forEach((counter, index) => {
        console.log(`  ${index + 1}. ${counter.championName}`);
        console.log(`     - Win Rate: ${counter.winRate}%`);
        console.log(`     - Game Count: ${counter.gameCount || 'N/A'}`);
        console.log(`     - Image: ${counter.imageUrl || 'No image'}`);
        console.log(`     - Tips: ${counter.tips || 'No tips'}`);
      });
    }

    // Show detailed strong against
    if (counterData.strongAgainst && counterData.strongAgainst.length > 0) {
      console.log('\n💪 Strong Against Details:');
      counterData.strongAgainst.forEach((counter, index) => {
        console.log(`  ${index + 1}. ${counter.championName}`);
        console.log(`     - Win Rate: ${counter.winRate}%`);
        console.log(`     - Game Count: ${counter.gameCount || 'N/A'}`);
        console.log(`     - Image: ${counter.imageUrl || 'No image'}`);
        console.log(`     - Tips: ${counter.tips || 'No tips'}`);
      });
    }

    // Show detailed best lane counters
    if (
      counterData.bestLaneCounters &&
      counterData.bestLaneCounters.length > 0
    ) {
      console.log('\n🏆 Best Lane Counters Details:');
      counterData.bestLaneCounters.forEach((counter, index) => {
        console.log(`  ${index + 1}. ${counter.championName}`);
        console.log(`     - Win Rate: ${counter.winRate}%`);
        console.log(`     - Game Count: ${counter.gameCount || 'N/A'}`);
        console.log(`     - Image: ${counter.imageUrl || 'No image'}`);
        console.log(`     - Tips: ${counter.tips || 'No tips'}`);
      });
    }

    console.log('\n📝 Content Analysis:');
    console.log(
      `- Weaknesses: ${counterData.weaknessesContent ? 'Available' : 'Missing'}`,
    );
    console.log(
      `- Counter Items: ${counterData.counterItemsContent ? 'Available' : 'Missing'}`,
    );
    console.log(
      `- Strategies: ${counterData.strategiesContent ? 'Available' : 'Missing'}`,
    );
    console.log(
      `- Additional Tips: ${counterData.additionalTipsContent ? 'Available' : 'Missing'}`,
    );

    if (counterData.weaknessesContent) {
      console.log('\n🔍 Weaknesses Content (first 200 chars):');
      console.log(counterData.weaknessesContent.substring(0, 200) + '...');
    }
  } catch (error) {
    console.error('❌ Error checking Zeri counter data:', error.message);
  } finally {
    await app.close();
  }
}

main().catch(console.error);
