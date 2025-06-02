import * as cheerio from 'cheerio';
import { CounterCrawlerService } from '../services/counter-crawler.service';

// Simple mock cho CounterService
class MockCounterService {
  async create(data: any) {
    console.log('📝 MockCounterService.create called with:', {
      championId: data.championId,
      championName: data.championName,
      role: data.role,
      weakAgainstCount: data.weakAgainst?.length || 0,
      worstLaneCountersCount: data.worstLaneCounters?.length || 0,
    });

    return {
      _id: 'test-id-' + Date.now(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async findOne(query: any) {
    console.log('🔍 MockCounterService.findOne called with:', query);
    return null;
  }

  async update(id: string, data: any) {
    console.log('📝 MockCounterService.update called');
    return data;
  }

  async remove() {
    console.log('🗑️ MockCounterService.remove called');
    return { deleted: true };
  }
}

class CounterCrawlerTester {
  private service: CounterCrawlerService;

  constructor() {
    const mockCounterService = new MockCounterService();
    this.service = new CounterCrawlerService(mockCounterService as any);
  }

  // Test basic champion validation
  testChampionValidation() {
    console.log('\n🧪 Testing Champion Validation...');
    console.log('='.repeat(50));

    const validChampions = ['Caitlyn', 'Zeri', "Kai'Sa", 'Lee Sin', "Cho'Gath"];
    const invalidChampions = [
      'InvalidChamp',
      'NotAChampion',
      '123Invalid',
      'Test@Champion',
    ];

    console.log('\n✅ Valid Champions:');
    validChampions.forEach((name) => {
      const isValid = this.service['isChampionImage'](name, '', '');
      console.log(`   ${name}: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
    });

    console.log('\n❌ Invalid Champions (should return false):');
    invalidChampions.forEach((name) => {
      const isValid = this.service['isChampionImage'](name, '', '');
      console.log(
        `   ${name}: ${isValid ? '❌ FAIL (should be false)' : '✅ PASS'}`,
      );
    });
  }

  // Test champion name extraction
  testChampionNameExtraction() {
    console.log('\n🧪 Testing Champion Name Extraction...');
    console.log('='.repeat(50));

    const testCases = [
      { alt: 'Zeri', src: '', title: '', expected: 'Zeri' },
      { alt: "Kai'Sa", src: '', title: '', expected: "Kai'Sa" },
      {
        alt: '',
        src: '/champions/caitlyn.png',
        title: 'Caitlyn',
        expected: 'Caitlyn',
      },
      { alt: '', src: '/images/jinx.jpg', title: '', expected: '' },
      { alt: 'Invalid@Name!', src: '', title: '', expected: '' },
      { alt: "Cho'Gath", src: '', title: '', expected: "Cho'Gath" },
    ];

    testCases.forEach((testCase, index) => {
      const result = this.service['extractChampionNameFromImage'](
        testCase.alt,
        testCase.src,
        testCase.title,
      );

      const success = result === testCase.expected;
      console.log(`\n   Test ${index + 1}:`);
      console.log(
        `     Input: alt="${testCase.alt}", src="${testCase.src}", title="${testCase.title}"`,
      );
      console.log(`     Expected: "${testCase.expected}"`);
      console.log(`     Got: "${result}"`);
      console.log(`     Result: ${success ? '✅ PASS' : '❌ FAIL'}`);
    });
  }

  // Test context analysis logic
  testContextAnalysis() {
    console.log('\n🧪 Testing Context Analysis Logic...');
    console.log('='.repeat(50));

    // Mock cheerio object
    const mockImg = {
      attr: (attr: string) => {
        if (attr === 'alt') return 'Caitlyn';
        if (attr === 'src') return '/images/caitlyn.jpg';
        return '';
      },
      parent: () => ({
        text: () => 'Tướng khắc chế Zeri',
      }),
      closest: () => ({
        text: () => 'Section about champions that counter Zeri',
      }),
      siblings: () => ({
        each: () => {
          // Mock siblings
        },
      }),
    };

    const mockCheerio = {
      // Mock cheerio functions if needed
    };

    try {
      const context = this.service['getImageContext'](
        mockCheerio as any,
        mockImg,
      );
      console.log('   Context extraction: ✅ PASS');
      console.log(`   Context: "${context.substring(0, 100)}..."`);
    } catch (error) {
      console.log('   Context extraction: ❌ FAIL');
      console.log(`   Error: ${error.message}`);
    }

    try {
      const championData = this.service['createChampionCounterData'](
        'Caitlyn',
        mockImg,
      );
      console.log('   Champion data creation: ✅ PASS');
      console.log(`   Champion data: ${JSON.stringify(championData, null, 2)}`);
    } catch (error) {
      console.log('   Champion data creation: ❌ FAIL');
      console.log(`   Error: ${error.message}`);
    }
  }

  // Test với mock HTML data
  async testWithMockData() {
    console.log('\n🧪 Testing with Mock HTML Data...');
    console.log('='.repeat(50));

    // Tạo mock HTML để test
    const mockHtmlContent = `
      <html>
        <head><title>Zeri Counter - League of Legends</title></head>
        <body>
          <h1>Zeri Counter Guide</h1>
          
          <h2 class="chu_vang">Tướng khắc chế Zeri</h2>
          <div class="row">
            <div class="list_champ">
              <img alt="Caitlyn" src="/images/caitlyn.jpg" title="Caitlyn" />
            </div>
            <div class="list_champ">
              <img alt="Jinx" src="/images/jinx.jpg" title="Jinx" />
            </div>
            <div class="list_champ">
              <img alt="Draven" src="/images/draven.jpg" title="Draven" />
            </div>
          </div>
          
          <h2 class="chu_vang">Tướng yếu hơn Zeri</h2>
          <div class="row">
            <div class="list_champ">
              <img alt="Vayne" src="/images/vayne.jpg" title="Vayne" />
            </div>
            <div class="list_champ">
              <img alt="Twitch" src="/images/twitch.jpg" title="Twitch" />
            </div>
          </div>

          <h2 class="chu_vang">Tướng có tỷ lệ thắng cao khi đối đầu Zeri</h2>
          <div class="row">
            <div class="list_champ">
              <img alt="Ashe" src="/images/ashe.jpg" title="Ashe" />
            </div>
          </div>
          
          <h2>Điểm yếu của Zeri</h2>
          <p>Zeri dễ bị gank và yếu trong giai đoạn đầu game. Cô ấy cần thời gian để scale và có thể bị bắt khi positioning không tốt.</p>
          
          <h2>Trang bị khắc chế Zeri</h2>
          <p>Sử dụng Executioner's Calling để giảm healing của Zeri. Thornmail cũng hiệu quả để counter cô ấy.</p>

          <h2>Chiến thuật đối đầu Zeri</h2>
          <p>Focus vào early game pressure và không để Zeri farm tự do. Gank liên tục để ngăn cô ấy scale.</p>
        </body>
      </html>
    `;

    try {
      // Import cheerio
      const $ = cheerio.load(mockHtmlContent);

      // Test parse counter data
      console.log('\n📊 Testing parseCounterData...');
      const counterData = this.service['parseCounterData']($);

      console.log('   Parse result:');
      console.log(
        `     weakAgainst: ${counterData.weakAgainst.length} champions`,
      );
      console.log(
        `     strongAgainst: ${counterData.strongAgainst.length} champions`,
      );
      console.log(
        `     bestLaneCounters: ${counterData.bestLaneCounters.length} champions`,
      );
      console.log(
        `     worstLaneCounters: ${counterData.worstLaneCounters.length} champions`,
      );

      if (counterData.weakAgainst.length > 0) {
        console.log('     weakAgainst champions:');
        counterData.weakAgainst.forEach((champ: any, index: number) => {
          console.log(`       ${index + 1}. ${champ.championName}`);
        });
      }

      if (counterData.strongAgainst.length > 0) {
        console.log('     strongAgainst champions:');
        counterData.strongAgainst.forEach((champ: any, index: number) => {
          console.log(`       ${index + 1}. ${champ.championName}`);
        });
      }

      if (counterData.bestLaneCounters.length > 0) {
        console.log('     bestLaneCounters champions:');
        counterData.bestLaneCounters.forEach((champ: any, index: number) => {
          console.log(`       ${index + 1}. ${champ.championName}`);
        });
      }

      // Test content extraction
      console.log('\n📄 Testing content extraction...');
      const formattedContent = this.service['extractFormattedContent']($);
      const contentSections = this.service['extractContentSections']($);

      console.log('   Formatted content length:', formattedContent.length);
      console.log('   Content sections:');
      console.log(
        `     weaknessesContent: ${contentSections.weaknessesContent ? 'Found' : 'Not found'}`,
      );
      console.log(
        `     counterItemsContent: ${contentSections.counterItemsContent ? 'Found' : 'Not found'}`,
      );
      console.log(
        `     strategiesContent: ${contentSections.strategiesContent ? 'Found' : 'Not found'}`,
      );
      console.log(
        `     additionalTipsContent: ${contentSections.additionalTipsContent ? 'Found' : 'Not found'}`,
      );

      // Hiển thị một phần content để verify
      if (contentSections.weaknessesContent) {
        console.log('\n   Sample weaknessesContent:');
        console.log(
          `     "${contentSections.weaknessesContent.substring(0, 100)}..."`,
        );
      }

      console.log('\n   Mock data test: ✅ PASS');
    } catch (error) {
      console.log('\n   Mock data test: ❌ FAIL');
      console.log(`   Error: ${error.message}`);
      console.log(`   Stack: ${error.stack}`);
    }
  }

  // Chạy tất cả tests
  async runAllTests() {
    console.log('🚀 Starting Counter Crawler Service Tests');
    console.log('='.repeat(60));

    try {
      this.testChampionValidation();
      this.testChampionNameExtraction();
      this.testContextAnalysis();
      await this.testWithMockData();

      console.log('\n🎉 All tests completed!');
      console.log('='.repeat(60));
    } catch (error) {
      console.error('\n💥 Test suite failed:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

// Main execution
async function main() {
  const tester = new CounterCrawlerTester();
  await tester.runAllTests();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { CounterCrawlerTester };
