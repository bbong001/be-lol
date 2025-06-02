import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CounterCrawlerService } from '../services/counter-crawler.service';
import { ChampionsService } from '../champions.service';
import { Champion } from '../schemas/champion.schema';

// Define roles for each position
const ROLE_MAPPINGS = {
  jungle: ['Jungle'],
  top: ['Top', 'Tank', 'Fighter'],
  mid: ['Mage', 'Assassin'],
  adc: ['Marksman'],
  support: ['Support'],
};

// Popular roles for specific champion types
const CHAMPION_ROLE_OVERRIDES: Record<string, string[]> = {
  // Jungle specific
  Graves: ['jungle'],
  Kindred: ['jungle'],
  Hecarim: ['jungle'],
  RekSai: ['jungle'],
  Ivern: ['jungle'],
  KhaZix: ['jungle'],
  Rengar: ['jungle'],

  // Multi-role champions
  Yasuo: ['mid', 'top'],
  Yone: ['mid', 'top'],
  Irelia: ['mid', 'top'],
  Akali: ['mid', 'top'],
  Sylas: ['mid', 'jungle'],
  Pyke: ['support', 'mid'],
  Senna: ['support', 'adc'],

  // ADC
  Jinx: ['adc'],
  Caitlyn: ['adc'],
  Vayne: ['adc'],
  Ezreal: ['adc'],

  // Support
  Thresh: ['support'],
  Leona: ['support'],
  Nautilus: ['support'],
  Braum: ['support'],

  // Top lane
  Fiora: ['top'],
  Camille: ['top'],
  Garen: ['top'],
  Darius: ['top'],
};

async function crawlAllChampionsCounterData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const counterCrawlerService = app.get(CounterCrawlerService);
  const championsService = app.get(ChampionsService);

  try {
    console.log(
      '🚀 Starting comprehensive champion counter data crawling...\n',
    );

    // Get all champions from database
    console.log('📊 Fetching all champions from database...');
    const championsResult = await championsService.findAll(1, 1000); // Get all champions
    const champions = championsResult.data;

    if (!champions || champions.length === 0) {
      console.log(
        '⚠️ No champions found in database. Please sync from Riot API first.',
      );
      console.log('Run: npm run sync:champions');
      return;
    }

    console.log(`Found ${champions.length} champions in database\n`);

    // Prepare crawling list
    const crawlList: Array<{ champion: Champion; roles: string[] }> = [];

    for (const champion of champions) {
      let roles: string[] = [];

      // Check if we have specific role overrides for this champion
      if (CHAMPION_ROLE_OVERRIDES[champion.id]) {
        roles = CHAMPION_ROLE_OVERRIDES[champion.id];
      } else {
        // Determine roles based on champion tags
        for (const [role, tags] of Object.entries(ROLE_MAPPINGS)) {
          if (
            champion.tags &&
            champion.tags.some((tag) => tags.includes(tag))
          ) {
            roles.push(role);
          }
        }

        // If no roles found, assign based on common patterns
        if (roles.length === 0) {
          if (champion.tags?.includes('Tank')) {
            roles = ['top', 'support'];
          } else if (champion.tags?.includes('Fighter')) {
            roles = ['top', 'jungle'];
          } else if (champion.tags?.includes('Mage')) {
            roles = ['mid'];
          } else if (champion.tags?.includes('Marksman')) {
            roles = ['adc'];
          } else if (champion.tags?.includes('Support')) {
            roles = ['support'];
          } else if (champion.tags?.includes('Assassin')) {
            roles = ['mid', 'jungle'];
          } else {
            // Default to mid if unclear
            roles = ['mid'];
          }
        }
      }

      crawlList.push({ champion, roles });
    }

    console.log('📋 Crawling plan:');
    crawlList.forEach((item) => {
      console.log(
        `  ${item.champion.name} (${item.champion.id}): ${item.roles.join(', ')}`,
      );
    });

    console.log(
      `\n🎯 Total crawl tasks: ${crawlList.reduce((sum, item) => sum + item.roles.length, 0)}\n`,
    );

    // Start crawling with batches to avoid overwhelming the server
    const BATCH_SIZE = 5;
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < crawlList.length; i += BATCH_SIZE) {
      const batch = crawlList.slice(i, i + BATCH_SIZE);

      console.log(
        `\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(crawlList.length / BATCH_SIZE)}`,
      );

      // Process each champion in the batch
      for (const { champion, roles } of batch) {
        console.log(`\n🔍 Crawling ${champion.name} (${champion.id})...`);

        for (const role of roles) {
          try {
            console.log(`  ➡️ Role: ${role}`);

            await counterCrawlerService.crawlCounterData(
              champion.id,
              role,
              '15.10', // Current patch
              'Emerald+', // Target rank
            );

            successCount++;
            console.log(`  ✅ Successfully crawled ${champion.name} ${role}`);

            // Delay between requests to be respectful to the server
            await sleep(2000);
          } catch (error) {
            errorCount++;
            const errorMsg = `Failed to crawl ${champion.name} (${champion.id}) ${role}: ${error.message}`;
            errors.push(errorMsg);
            console.error(`  ❌ ${errorMsg}`);

            // Continue with next role/champion on error
            continue;
          }
        }
      }

      // Longer delay between batches
      if (i + BATCH_SIZE < crawlList.length) {
        console.log(`\n⏳ Waiting 10 seconds before next batch...`);
        await sleep(10000);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 CRAWLING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successful crawls: ${successCount}`);
    console.log(`❌ Failed crawls: ${errorCount}`);
    console.log(
      `📈 Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`,
    );

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.slice(0, 10).forEach((error) => console.log(`  • ${error}`));
      if (errors.length > 10) {
        console.log(`  ... and ${errors.length - 10} more errors`);
      }
    }

    console.log('\n✅ Champion counter data crawling completed!');
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

async function crawlSpecificChampions(
  championIds: string[],
  patch = '15.10',
  rank = 'Emerald+',
) {
  const app = await NestFactory.createApplicationContext(AppModule);
  const counterCrawlerService = app.get(CounterCrawlerService);
  const championsService = app.get(ChampionsService);

  try {
    console.log(`🎯 Crawling specific champions: ${championIds.join(', ')}\n`);

    for (const championId of championIds) {
      try {
        // Find champion in database
        const champion = await championsService.findByName(championId);
        if (!champion) {
          console.error(`❌ Champion not found: ${championId}`);
          continue;
        }

        console.log(`\n🔍 Crawling ${champion.name} (${champion.id})...`);

        // Determine roles for this champion
        let roles: string[] = [];
        if (CHAMPION_ROLE_OVERRIDES[champion.id]) {
          roles = CHAMPION_ROLE_OVERRIDES[champion.id];
        } else {
          // Default roles based on tags
          for (const [role, tags] of Object.entries(ROLE_MAPPINGS)) {
            if (
              champion.tags &&
              champion.tags.some((tag) => tags.includes(tag))
            ) {
              roles.push(role);
            }
          }
          if (roles.length === 0) roles = ['mid']; // fallback
        }

        for (const role of roles) {
          try {
            console.log(`  ➡️ Role: ${role}`);

            await counterCrawlerService.crawlCounterData(
              champion.id,
              role,
              patch,
              rank,
            );

            console.log(`  ✅ Successfully crawled ${champion.name} ${role}`);
            await sleep(2000);
          } catch (error) {
            console.error(
              `  ❌ Failed ${champion.name} ${role}: ${error.message}`,
            );
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${championId}: ${error.message}`);
      }
    }

    console.log('\n✅ Specific champions crawling completed!');
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  } finally {
    await app.close();
  }
}

async function crawlPopularChampions() {
  // Popular champions for each role
  const popularChampions = [
    'Graves',
    'Kindred',
    'Hecarim',
    'RekSai', // Jungle
    'Yasuo',
    'Yone',
    'Akali',
    'Zed',
    'Ahri', // Mid
    'Jinx',
    'Caitlyn',
    'Vayne',
    'Ezreal',
    'KaiSa', // ADC
    'Thresh',
    'Leona',
    'Nautilus',
    'Pyke', // Support
    'Fiora',
    'Camille',
    'Garen',
    'Darius',
    'Irelia', // Top
  ];

  console.log('🌟 Crawling popular champions first...\n');
  await crawlSpecificChampions(popularChampions);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Export functions for external use
export {
  crawlAllChampionsCounterData,
  crawlSpecificChampions,
  crawlPopularChampions,
};

// Run the script based on command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--popular')) {
    crawlPopularChampions()
      .then(() => {
        console.log('✅ Popular champions crawling completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Popular champions crawling failed:', error);
        process.exit(1);
      });
  } else if (args.includes('--specific')) {
    const championIds = args.filter((arg) => !arg.startsWith('--'));
    if (championIds.length === 0) {
      console.error(
        '❌ Please provide champion IDs when using --specific flag',
      );
      console.error(
        'Example: npm run crawl:champions-counter-data --specific Yasuo Jinx Thresh',
      );
      process.exit(1);
    }

    crawlSpecificChampions(championIds)
      .then(() => {
        console.log('✅ Specific champions crawling completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Specific champions crawling failed:', error);
        process.exit(1);
      });
  } else {
    crawlAllChampionsCounterData()
      .then(() => {
        console.log('✅ All champions counter data crawling completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ All champions crawling failed:', error);
        process.exit(1);
      });
  }
}
