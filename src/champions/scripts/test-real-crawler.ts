import { CounterCrawlerService } from '../services/counter-crawler.service';

// Simple mock cho CounterService
class MockCounterService {
  async create(data: any) {
    console.log('\n📝 Final Counter Data Created:');
    console.log('='.repeat(50));
    console.log(`Champion: ${data.championName} (${data.role})`);
    console.log(`Patch: ${data.patch} | Rank: ${data.rank}`);
    console.log(
      `Total Content Length: ${data.formattedContent?.length || 0} characters`,
    );

    console.log('\n📊 Champion Counters:');
    console.log(`✅ Weak Against (${data.weakAgainst?.length || 0}):`);
    data.weakAgainst?.forEach((champ: any, i: number) => {
      console.log(
        `   ${i + 1}. ${champ.championName} (Rating: ${champ.counterRating}/10)`,
      );
    });

    console.log(`🔥 Strong Against (${data.strongAgainst?.length || 0}):`);
    data.strongAgainst?.forEach((champ: any, i: number) => {
      console.log(
        `   ${i + 1}. ${champ.championName} (Rating: ${champ.counterRating}/10)`,
      );
    });

    console.log(
      `⭐ Best Lane Counters (${data.bestLaneCounters?.length || 0}):`,
    );
    data.bestLaneCounters?.forEach((champ: any, i: number) => {
      console.log(
        `   ${i + 1}. ${champ.championName} (Win Rate: ${champ.winRate}%)`,
      );
    });

    console.log(
      `💔 Worst Lane Counters (${data.worstLaneCounters?.length || 0}):`,
    );
    data.worstLaneCounters?.forEach((champ: any, i: number) => {
      console.log(
        `   ${i + 1}. ${champ.championName} (Win Rate: ${champ.winRate}%)`,
      );
    });

    console.log('\n📋 Content Sections:');
    console.log(`   Weaknesses: ${data.weaknessesContent ? '✅' : '❌'}`);
    console.log(`   Counter Items: ${data.counterItemsContent ? '✅' : '❌'}`);
    console.log(`   Strategies: ${data.strategiesContent ? '✅' : '❌'}`);
    console.log(
      `   Additional Tips: ${data.additionalTipsContent ? '✅' : '❌'}`,
    );

    if (data.errors && data.errors.length > 0) {
      console.log('\n⚠️ Errors encountered:');
      data.errors.forEach((error: string, i: number) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }

    return {
      _id: 'test-id-' + Date.now(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async findOne() {
    return null;
  }
  async update() {
    return {};
  }
  async remove() {
    return {};
  }
}

async function testRealCrawler() {
  console.log('🌐 Testing Real Counter Crawler');
  console.log('='.repeat(60));

  const mockCounterService = new MockCounterService();
  const service = new CounterCrawlerService(mockCounterService as any);

  // Test với các champions khác nhau
  const testCases = [
    { name: 'Zeri', role: 'adc' },
    { name: 'Caitlyn', role: 'adc' },
    { name: 'Jinx', role: 'adc' },
  ];

  for (const testCase of testCases) {
    console.log(`\n🎯 Testing ${testCase.name} (${testCase.role})`);
    console.log('-'.repeat(40));

    try {
      const result = await service.crawlCounterData(
        testCase.name,
        testCase.role,
        '15.10',
        'Emerald+',
      );

      if (result) {
        console.log(`✅ Successfully crawled data for ${testCase.name}`);

        // Kiểm tra data quality
        const totalCounters =
          (result.weakAgainst?.length || 0) +
          (result.strongAgainst?.length || 0) +
          (result.bestLaneCounters?.length || 0) +
          (result.worstLaneCounters?.length || 0);

        console.log(`📊 Data Quality Assessment:`);
        console.log(`   Total Champions Found: ${totalCounters}`);
        console.log(
          `   Content Available: ${result.formattedContent ? 'Yes' : 'No'}`,
        );
        console.log(`   Errors: ${result.errors?.length || 0}`);

        if (totalCounters === 0) {
          console.log('⚠️ WARNING: No counter champions found!');
        } else if (totalCounters < 5) {
          console.log('⚠️ WARNING: Very few counter champions found!');
        } else {
          console.log('✅ Good amount of counter data found');
        }
      } else {
        console.log(`❌ Failed to crawl data for ${testCase.name}`);
      }
    } catch (error) {
      console.log(`💥 Error crawling ${testCase.name}:`, error.message);
    }

    // Wait between requests để không spam server
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log('\n🎉 Real crawler test completed!');
}

// Chạy test nếu được gọi trực tiếp
if (require.main === module) {
  testRealCrawler().catch(console.error);
}

export { testRealCrawler };
