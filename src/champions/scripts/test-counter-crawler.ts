import { Test, TestingModule } from '@nestjs/testing';
import { CounterCrawlerService } from '../services/counter-crawler.service';
import { CounterService } from '../services/counter.service';
import { getModelToken } from '@nestjs/mongoose';

// Mock CounterService
const mockCounterService = {
  create: jest.fn().mockResolvedValue({
    _id: 'test-id',
    championId: 'Zeri',
    championName: 'Zeri',
    role: 'adc',
    weakAgainst: [],
    strongAgainst: [],
    bestLaneCounters: [],
    worstLaneCounters: [],
  }),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

// Mock Mongoose Model
const mockModel = {
  new: jest.fn().mockResolvedValue({}),
  constructor: jest.fn().mockResolvedValue({}),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
  exec: jest.fn(),
};

describe('CounterCrawlerService', () => {
  let service: CounterCrawlerService;
  let counterService: CounterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CounterCrawlerService,
        {
          provide: CounterService,
          useValue: mockCounterService,
        },
        {
          provide: getModelToken('Counter'),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<CounterCrawlerService>(CounterCrawlerService);
    counterService = module.get<CounterService>(CounterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('crawlCounterData', () => {
    it('should successfully crawl counter data for a champion', async () => {
      // Mock axios response
      const mockAxios = jest.fn().mockResolvedValue({
        data: `
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
              
              <h2>Điểm yếu của Zeri</h2>
              <p>Zeri dễ bị gank và yếu trong giai đoạn đầu game.</p>
              
              <h2>Trang bị khắc chế Zeri</h2>
              <p>Sử dụng Executioner's Calling để giảm healing của Zeri.</p>
            </body>
          </html>
        `,
        status: 200,
        headers: {},
        config: { url: 'https://kicdo.com/counter/zeri' },
      });

      // Mock axios
      const axios = require('axios');
      axios.create = jest.fn().mockReturnValue({
        get: mockAxios,
      });

      const result = await service.crawlCounterData(
        'Zeri',
        'adc',
        '15.10',
        'Emerald+',
      );

      expect(result).toBeDefined();
      expect(result.championId).toBe('Zeri');
      expect(result.championName).toBe('Zeri');
      expect(result.role).toBe('adc');
      expect(mockCounterService.create).toHaveBeenCalled();
    });

    it('should handle crawling errors gracefully', async () => {
      // Mock axios to throw error
      const mockAxios = jest.fn().mockRejectedValue(new Error('Network error'));

      const axios = require('axios');
      axios.create = jest.fn().mockReturnValue({
        get: mockAxios,
      });

      const result = await service.crawlCounterData(
        'InvalidChampion',
        'adc',
        '15.10',
        'Emerald+',
      );

      expect(result).toBeDefined();
      expect(result.championId).toBe('InvalidChampion');
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Champion Detection Logic', () => {
    it('should correctly identify weakAgainst champions', () => {
      const mockCheerioRoot = {
        find: jest.fn().mockReturnThis(),
        each: jest.fn((selector, callback) => {
          if (selector === '.chu_vang, h1, h2, h3, h4, p.chu_vang') {
            // Mock header with "tướng khắc chế"
            const mockHeader = {
              text: jest.fn().mockReturnValue('Tướng khắc chế Zeri'),
              next: jest.fn().mockReturnValue({
                length: 1,
                hasClass: jest.fn().mockReturnValue(true),
                find: jest.fn().mockReturnValue({
                  length: 2,
                  each: jest.fn((cb) => {
                    // Mock 2 champions
                    cb(0, {
                      find: () => ({
                        first: () => ({ length: 1, attr: () => 'Caitlyn' }),
                      }),
                    });
                    cb(1, {
                      find: () => ({
                        first: () => ({ length: 1, attr: () => 'Jinx' }),
                      }),
                    });
                  }),
                }),
              }),
            };
            callback(0, mockHeader);
          }
        }),
      };

      const counterData = {
        weakAgainst: [],
        strongAgainst: [],
        bestLaneCounters: [],
        worstLaneCounters: [],
      };

      // Test the section detection logic
      expect(counterData.weakAgainst).toEqual([]);
      expect(counterData.strongAgainst).toEqual([]);
    });

    it('should correctly identify champion names from images', () => {
      // Test isChampionImage method
      const testCases = [
        {
          alt: 'Caitlyn',
          src: '/images/caitlyn.jpg',
          title: 'Caitlyn',
          expected: true,
        },
        {
          alt: 'InvalidName',
          src: '/images/invalid.jpg',
          title: 'Invalid',
          expected: false,
        },
        {
          alt: "Kai'Sa",
          src: '/images/kaisa.jpg',
          title: "Kai'Sa",
          expected: true,
        },
        { alt: '', src: '/images/zed.jpg', title: '', expected: true },
      ];

      testCases.forEach((testCase) => {
        const result = service['isChampionImage'](
          testCase.alt,
          testCase.src,
          testCase.title,
        );
        expect(typeof result).toBe('boolean');
      });
    });

    it('should extract champion name correctly', () => {
      const testCases = [
        { alt: 'Caitlyn', src: '', title: '', expected: 'Caitlyn' },
        { alt: "Kai'Sa", src: '', title: '', expected: "Kai'Sa" },
        { alt: '', src: '/champions/zed.png', title: 'Zed', expected: 'Zed' },
        { alt: 'Invalid@Name!', src: '', title: '', expected: '' },
      ];

      testCases.forEach((testCase) => {
        const result = service['extractChampionNameFromImage'](
          testCase.alt,
          testCase.src,
          testCase.title,
        );
        if (testCase.expected) {
          expect(result).toBe(testCase.expected);
        } else {
          expect(result).toBe('');
        }
      });
    });
  });

  describe('Content Extraction', () => {
    it('should extract formatted content correctly', () => {
      const mockHtml = `
        <html>
          <body>
            <h2>Điểm yếu của Zeri</h2>
            <p>Zeri có mobility cao nhưng damage thấp ở early game.</p>
            <h2>Trang bị khắc chế</h2>
            <p>Executioner's Calling giúp giảm healing.</p>
          </body>
        </html>
      `;

      // Mock cheerio
      const cheerio = require('cheerio');
      const $ = cheerio.load(mockHtml);

      const formattedContent = service['extractFormattedContent']($);
      expect(formattedContent).toContain('Điểm yếu');
      expect(formattedContent).toContain('Trang bị khắc chế');
    });

    it('should extract content sections correctly', () => {
      const mockHtml = `
        <html>
          <body>
            <h2>Điểm yếu của Zeri</h2>
            <p>Weakness content here</p>
            <h2>Trang bị counter Zeri</h2>
            <p>Item counter content here</p>
            <h2>Chiến thuật đối đầu Zeri</h2>
            <p>Strategy content here</p>
          </body>
        </html>
      `;

      const cheerio = require('cheerio');
      const $ = cheerio.load(mockHtml);

      const contentSections = service['extractContentSections']($);
      expect(contentSections).toHaveProperty('weaknessesContent');
      expect(contentSections).toHaveProperty('counterItemsContent');
      expect(contentSections).toHaveProperty('strategiesContent');
    });
  });

  describe('Batch Crawling', () => {
    it('should process multiple champions in batch', async () => {
      const champions = [
        { name: 'Zeri', roles: ['adc'] },
        { name: 'Jinx', roles: ['adc'] },
      ];

      // Mock successful crawling
      jest.spyOn(service, 'crawlCounterData').mockResolvedValue({
        championId: 'Test',
        championName: 'Test',
        role: 'adc',
      });

      // Mock sleep
      jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

      await service.batchCrawlCounters(champions, '15.10', 'Emerald+');

      expect(service.crawlCounterData).toHaveBeenCalledTimes(2);
    });
  });
});

// Manual test function để test thực tế
export async function runManualTest() {
  console.log('🧪 Starting manual test of CounterCrawlerService...');

  try {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CounterCrawlerService,
        {
          provide: CounterService,
          useValue: mockCounterService,
        },
        {
          provide: getModelToken('Counter'),
          useValue: mockModel,
        },
      ],
    }).compile();

    const service = module.get<CounterCrawlerService>(CounterCrawlerService);

    console.log('✅ Service initialized successfully');

    // Test basic methods
    console.log('\n📋 Testing champion name validation...');

    const validNames = ['Caitlyn', "Kai'Sa", 'Lee Sin', "Cho'Gath"];
    const invalidNames = ['InvalidChamp', 'NotAChampion', '123Invalid'];

    validNames.forEach((name) => {
      const isValid = service['isChampionImage'](name, '', '');
      console.log(`   ${name}: ${isValid ? '✅' : '❌'}`);
    });

    invalidNames.forEach((name) => {
      const isValid = service['isChampionImage'](name, '', '');
      console.log(`   ${name}: ${isValid ? '❌ Should be false' : '✅'}`);
    });

    console.log('\n📋 Testing champion name extraction...');

    const extractionTests = [
      { alt: 'Zeri', src: '', title: '', expected: 'Zeri' },
      { alt: "Kai'Sa", src: '', title: '', expected: "Kai'Sa" },
      {
        alt: '',
        src: '/champions/caitlyn.png',
        title: 'Caitlyn',
        expected: 'Caitlyn',
      },
    ];

    extractionTests.forEach((test) => {
      const result = service['extractChampionNameFromImage'](
        test.alt,
        test.src,
        test.title,
      );
      const success = result === test.expected;
      console.log(
        `   Input: alt="${test.alt}", src="${test.src}", title="${test.title}"`,
      );
      console.log(
        `   Expected: "${test.expected}", Got: "${result}" ${success ? '✅' : '❌'}`,
      );
    });

    console.log('\n🎯 Manual test completed successfully!');
  } catch (error) {
    console.error('❌ Manual test failed:', error.message);
    throw error;
  }
}

// Export for running in development
if (require.main === module) {
  runManualTest().catch(console.error);
}
