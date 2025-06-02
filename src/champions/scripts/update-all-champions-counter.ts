import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { ChampionsService } from '../champions.service';
import { CounterCrawlerService } from '../services/counter-crawler.service';
import { CounterService } from '../services/counter.service';

// Role mapping based on champion tags
const primaryRoleMapping: Record<string, string> = {
  Marksman: 'adc',
  Assassin: 'mid',
  Mage: 'mid',
  Tank: 'top',
  Fighter: 'top',
  Support: 'support',
};

// Specific champion role overrides (based on meta)
const championPrimaryRole: Record<string, string> = {
  // ADC Champions
  Jinx: 'adc',
  Caitlyn: 'adc',
  Zeri: 'adc',
  Ezreal: 'adc',
  Vayne: 'adc',
  Ashe: 'adc',
  Jhin: 'adc',
  "Kai'Sa": 'adc',
  Lucian: 'adc',
  Tristana: 'adc',
  Sivir: 'adc',
  "Kog'Maw": 'adc',
  Twitch: 'adc',
  Varus: 'adc',
  Draven: 'adc',
  'Miss Fortune': 'adc',
  Samira: 'adc',
  Aphelios: 'adc',
  Xayah: 'adc',

  // Jungle Champions
  Graves: 'jungle',
  Kindred: 'jungle',
  "Kha'Zix": 'jungle',
  Hecarim: 'jungle',
  Ekko: 'jungle',
  Evelynn: 'jungle',
  Nidalee: 'jungle',
  Elise: 'jungle',
  Lillia: 'jungle',
  Kayn: 'jungle',
  'Master Yi': 'jungle',
  Viego: 'jungle',
  Diana: 'jungle',
  Fiddlesticks: 'jungle',
  Warwick: 'jungle',
  Shyvana: 'jungle',
  Ammu: 'jungle',
  Rammus: 'jungle',
  'Nunu & Willump': 'jungle',
  Ivern: 'jungle',
  Briar: 'jungle',
  "Rek'Sai": 'jungle',
  'Jarvan IV': 'jungle',
  Volibear: 'jungle',
  Udyr: 'jungle',
  'Lee Sin': 'jungle',
  Sejuani: 'jungle',
  Zac: 'jungle',

  // Support Champions
  Thresh: 'support',
  Blitzcrank: 'support',
  Leona: 'support',
  Braum: 'support',
  Alistar: 'support',
  Nautilus: 'support',
  Pyke: 'support',
  Rakan: 'support',
  Lulu: 'support',
  Janna: 'support',
  Soraka: 'support',
  Nami: 'support',
  Sona: 'support',
  Yuumi: 'support',
  Karma: 'support',
  Morgana: 'support',
  Zyra: 'support',
  "Vel'Koz": 'support',
  Brand: 'support',
  Xerath: 'support',
  Zilean: 'support',
  Bard: 'support',
  Taric: 'support',
  Senna: 'support',
  Seraphine: 'support',
  Renata: 'support',

  // Top Lane Champions
  Darius: 'top',
  Garen: 'top',
  Fiora: 'top',
  Camille: 'top',
  Jax: 'top',
  Irelia: 'top',
  Riven: 'top',
  Aatrox: 'top',
  Shen: 'top',
  Malphite: 'top',
  Ornn: 'top',
  Maokai: 'top',
  Sion: 'top',
  "Cho'Gath": 'top',
  Nasus: 'top',
  Renekton: 'top',
  Kled: 'top',
  Urgot: 'top',
  Singed: 'top',
  Teemo: 'top',
  Kennen: 'top',
  Gnar: 'top',
  Jayce: 'top',
  Gangplank: 'top',
  Tryndamere: 'top',
  Yorick: 'top',
  Illaoi: 'top',
  Mordekaiser: 'top',
  'Dr. Mundo': 'top',
  Poppy: 'top',
  Tahm: 'top',
  Gragas: 'top',

  // Mid Lane Champions
  Yasuo: 'mid',
  Yone: 'mid',
  Zed: 'mid',
  Talon: 'mid',
  Katarina: 'mid',
  Akali: 'mid',
  LeBlanc: 'mid',
  Fizz: 'mid',
  Kassadin: 'mid',
  Ahri: 'mid',
  Lux: 'mid',
  Syndra: 'mid',
  Orianna: 'mid',
  Azir: 'mid',
  Ryze: 'mid',
  Cassiopeia: 'mid',
  'Twisted Fate': 'mid',
  Zoe: 'mid',
  Neeko: 'mid',
  Sylas: 'mid',
  Qiyana: 'mid',
  Akshan: 'mid',
  Vex: 'mid',
  Viktor: 'mid',
  Ziggs: 'mid',
  Anivia: 'mid',
  Malzahar: 'mid',
  'Aurelion Sol': 'mid',
  Galio: 'mid',
  Corki: 'mid',
  Heimerdinger: 'mid',
  Swain: 'mid',
};

// Sleep utility
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function updateAllChampionsCounter() {
  console.log('🚀 Starting Update All Champions Counter Data');
  console.log('='.repeat(60));

  const app = await NestFactory.createApplicationContext(AppModule);
  const championsService = app.get(ChampionsService);
  const counterCrawlerService = app.get(CounterCrawlerService);
  const counterService = app.get(CounterService);

  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const isSpecific = args.includes('--specific');
    const isPopular = args.includes('--popular');
    const isUpdate = args.includes('--update');
    const batchSize = parseInt(
      args.find((arg) => arg.startsWith('--batch='))?.split('=')[1] || '5',
    );

    console.log('📋 Command Arguments:');
    console.log(`   - Specific champions only: ${isSpecific}`);
    console.log(`   - Popular champions only: ${isPopular}`);
    console.log(`   - Update existing: ${isUpdate}`);
    console.log(`   - Batch size: ${batchSize}`);

    // Get champion filter if specified
    let championFilter: string[] = [];
    const championsArg = args.find((arg) => arg.startsWith('--champions='));
    if (championsArg) {
      const championsStr = championsArg.split('=')[1];
      championFilter = championsStr
        .split(',')
        .map((name) => name.trim().replace(/"/g, ''));
    }

    console.log(
      `   - Champion filter: ${championFilter.length > 0 ? championFilter.join(', ') : 'None'}\n`,
    );

    // Get all champions from database
    console.log('📊 Fetching champions from database...');
    const championsResult = await championsService.findAll(1, 1000);
    let champions = championsResult.data;

    if (!champions || champions.length === 0) {
      console.log(
        '⚠️ No champions found in database. Please sync from Riot API first.',
      );
      console.log('💡 Run: npm run sync:champions');
      return;
    }

    console.log(`✅ Found ${champions.length} champions in database`);

    // Apply filters
    if (isSpecific && championFilter.length > 0) {
      champions = champions.filter((champ) =>
        championFilter.some(
          (name) =>
            champ.name.en.toLowerCase().includes(name.toLowerCase()) ||
            champ.id.toLowerCase().includes(name.toLowerCase()),
        ),
      );
      console.log(`🔍 Filtered to ${champions.length} specific champions`);
    } else if (isPopular) {
      // Filter popular champions based on tags and known meta
      const popularChampions = Object.keys(championPrimaryRole);
      champions = champions.filter(
        (champ) =>
          popularChampions.includes(champ.name.en) ||
          popularChampions.includes(champ.id),
      );
      console.log(`🔥 Filtered to ${champions.length} popular champions`);
    }

    const totalChampions = champions.length;
    console.log(`📈 Processing ${totalChampions} champions\n`);

    // Process champions in batches
    for (let i = 0; i < champions.length; i += batchSize) {
      const batch = champions.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(champions.length / batchSize);

      console.log(
        `\n📦 Processing Batch ${batchNum}/${totalBatches} (${batch.length} champions)`,
      );
      console.log('-'.repeat(50));

      for (const champion of batch) {
        processedCount++;
        console.log(
          `\n[${processedCount}/${totalChampions}] 🔍 Processing ${champion.name.en}...`,
        );

        // Determine primary role for this champion
        let primaryRole = 'mid'; // Default role

        if (championPrimaryRole[champion.name.en]) {
          primaryRole = championPrimaryRole[champion.name.en];
        } else if (championPrimaryRole[champion.id]) {
          primaryRole = championPrimaryRole[champion.id];
        } else if (champion.tags && champion.tags.length > 0) {
          const primaryTag = champion.tags[0];
          primaryRole = primaryRoleMapping[primaryTag] || 'mid';
        }

        console.log(`  📋 Primary role: ${primaryRole}`);

        // Check if counter data already exists
        if (!isUpdate) {
          try {
            const existingCounter = await counterService.findByChampionAndRole(
              champion.id,
              primaryRole,
              '15.10',
              'Emerald+',
              'World',
            );

            if (existingCounter) {
              console.log(`  ⏭️ Counter data already exists, skipping...`);
              skippedCount++;
              continue;
            }
          } catch (error) {
            // Counter not found, continue with crawling
          }
        }

        // Crawl counter data
        try {
          console.log(
            `  🔄 Crawling counter data for ${champion.name.en} (${primaryRole})...`,
          );

          const result = await counterCrawlerService.crawlCounterData(
            champion.name.en,
            primaryRole,
            '15.10',
            'Emerald+',
          );

          if (result) {
            successCount++;
            console.log(
              `  ✅ Successfully crawled ${champion.name.en} (${primaryRole})`,
            );

            // Show brief summary
            const totalCounters =
              (result.weakAgainst?.length || 0) +
              (result.strongAgainst?.length || 0) +
              (result.bestLaneCounters?.length || 0) +
              (result.worstLaneCounters?.length || 0);

            console.log(`     📊 Total counters found: ${totalCounters}`);
            console.log(
              `     🔴 Weak Against: ${result.weakAgainst?.length || 0}`,
            );
            console.log(
              `     🟢 Strong Against: ${result.strongAgainst?.length || 0}`,
            );
            console.log(
              `     🔵 Best Lane: ${result.bestLaneCounters?.length || 0}`,
            );
            console.log(
              `     🟡 Worst Lane: ${result.worstLaneCounters?.length || 0}`,
            );
          } else {
            errorCount++;
            const errorMsg = `Failed to crawl ${champion.name.en} (${primaryRole}) - No result`;
            errors.push(errorMsg);
            console.log(`  ❌ ${errorMsg}`);
          }

          // Delay between requests to be respectful
          await sleep(3000);
        } catch (error) {
          errorCount++;
          const errorMsg = `${champion.name.en} (${primaryRole}): ${error.message}`;
          errors.push(errorMsg);
          console.log(`  ❌ Error: ${errorMsg}`);

          // Wait longer on error
          await sleep(5000);
        }
      }

      // Longer delay between batches
      if (i + batchSize < champions.length) {
        console.log(`\n⏳ Waiting 15 seconds before next batch...`);
        await sleep(15000);
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`⏭️ Skipped (already exists): ${skippedCount}`);
    console.log(`📈 Total processed: ${processedCount}`);
    console.log(
      `🎯 Success rate: ${((successCount / (successCount + errorCount)) * 100).toFixed(1)}%`,
    );

    if (errors.length > 0) {
      console.log('\n❌ ERRORS:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    console.log('\n🎉 Update completed!');
  } catch (error) {
    console.error('❌ Critical error during update:', error);
  } finally {
    await app.close();
  }
}

// Main execution
async function main() {
  await updateAllChampionsCounter();
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { updateAllChampionsCounter };
