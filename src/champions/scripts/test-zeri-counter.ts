import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { ChampionsService } from '../champions.service';
import { CounterCrawlerService } from '../services/counter-crawler.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const championsService = app.get(ChampionsService);
  const counterCrawlerService = app.get(CounterCrawlerService);

  try {
    console.log('🚀 Testing Zeri counter crawl...');

    // Find Zeri champion
    const champion = await championsService.findByName('Zeri');
    if (!champion) {
      console.error('❌ Zeri not found in database');
      return;
    }

    console.log(`✅ Found champion: ${champion.name}`);
    console.log(`📋 Champion ID: ${champion.id}`);
    console.log(`📋 Champion tags: ${champion.tags?.join(', ') || 'None'}`);

    // Crawl counter data for Zeri as ADC
    console.log('🔄 Crawling Zeri counter data...');

    const result = await counterCrawlerService.crawlCounterData(
      'Zeri',
      'adc',
      '15.10',
      'Emerald+',
    );

    console.log('✅ Successfully crawled Zeri counter data!');
    console.log('📊 Result summary:');
    console.log(`- Overall Win Rate: ${result.overallWinRate}%`);
    console.log(`- Pick Rate: ${result.pickRate}%`);
    console.log(`- Ban Rate: ${result.banRate}%`);
    console.log(`- Weak Against: ${result.weakAgainst?.length || 0} champions`);
    console.log(
      `- Strong Against: ${result.strongAgainst?.length || 0} champions`,
    );
    console.log(
      `- Best Lane Counters: ${result.bestLaneCounters?.length || 0} champions`,
    );
    console.log(
      `- Worst Lane Counters: ${result.worstLaneCounters?.length || 0} champions`,
    );

    // Log some counter details
    if (result.weakAgainst && result.weakAgainst.length > 0) {
      console.log('\n🔍 Weak Against (first 3):');
      result.weakAgainst.slice(0, 3).forEach((counter, index) => {
        console.log(
          `  ${index + 1}. ${counter.championName} (${counter.winRate}% win rate) - ${counter.imageUrl || 'No image'}`,
        );
      });
    }

    if (result.strongAgainst && result.strongAgainst.length > 0) {
      console.log('\n💪 Strong Against (first 3):');
      result.strongAgainst.slice(0, 3).forEach((counter, index) => {
        console.log(
          `  ${index + 1}. ${counter.championName} (${counter.winRate}% win rate) - ${counter.imageUrl || 'No image'}`,
        );
      });
    }

    if (result.bestLaneCounters && result.bestLaneCounters.length > 0) {
      console.log('\n🏆 Best Lane Counters (first 3):');
      result.bestLaneCounters.slice(0, 3).forEach((counter, index) => {
        console.log(
          `  ${index + 1}. ${counter.championName} (${counter.winRate}% win rate) - ${counter.imageUrl || 'No image'}`,
        );
      });
    }
  } catch (error) {
    console.error('❌ Error during Zeri counter crawl:', error.message);
  } finally {
    await app.close();
  }
}

main().catch(console.error);
