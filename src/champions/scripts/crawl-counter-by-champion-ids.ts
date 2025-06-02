import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { ChampionsService } from '../champions.service';
import { CounterCrawlerService } from '../services/counter-crawler.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const championsService = app.get(ChampionsService);
  const counterCrawlerService = app.get(CounterCrawlerService);

  try {
    console.log('🚀 Starting counter crawl by champion IDs...');

    // Parse command line arguments
    const args = process.argv.slice(2);
    console.log('📋 Arguments:', args);

    const isSpecific = args.includes('--specific');
    const isPopular = args.includes('--popular');

    console.log('📋 isSpecific:', isSpecific);
    console.log('📋 isPopular:', isPopular);

    let championFilter: string[] = [];

    // Extract champion names from --champions argument
    const championsArg = args.find((arg) => arg.startsWith('--champions='));
    console.log('📋 championsArg:', championsArg);

    if (championsArg) {
      const championsStr = championsArg.split('=')[1];
      championFilter = championsStr
        .split(',')
        .map((name) => name.trim().replace(/"/g, ''));
    }

    console.log('📋 championFilter:', championFilter);

    let champions: any[] = [];

    if (isSpecific && championFilter.length > 0) {
      console.log(
        `📋 Crawling specific champions: ${championFilter.join(', ')}`,
      );
      // Fetch specific champions by name
      for (const championName of championFilter) {
        try {
          const champion = await championsService.findByName(championName);
          if (champion) {
            champions.push(champion);
            console.log(`✅ Found champion: ${champion.name}`);
          } else {
            console.warn(`⚠️ Champion not found: ${championName}`);
          }
        } catch (error) {
          console.warn(
            `⚠️ Error finding champion ${championName}:`,
            error.message,
          );
        }
      }
    } else if (isPopular) {
      console.log('📋 Crawling popular champions...');
      // Get popular champions (you can define your own criteria)
      const popularChampionNames = [
        'Jinx',
        'Yasuo',
        'Zed',
        'Lee Sin',
        'Thresh',
        'Vayne',
        'Katarina',
        'Ezreal',
        'Lux',
        'Ahri',
        'Darius',
        'Garen',
        'Master Yi',
        'Ashe',
      ];

      for (const championName of popularChampionNames) {
        try {
          const champion = await championsService.findByName(championName);
          if (champion) {
            champions.push(champion);
          }
        } catch (error) {
          console.warn(
            `⚠️ Error finding champion ${championName}:`,
            error.message,
          );
        }
      }
    } else {
      console.log('📋 Crawling all champions...');
      const result = await championsService.findAll(1, 1000); // Get all champions
      champions = result.data;
    }

    if (champions.length === 0) {
      console.log('❌ No champions found to crawl');
      return;
    }

    console.log(`📊 Found ${champions.length} champions to crawl`);

    // Primary role mapping based on champion tags
    const primaryRoleMapping = {
      Assassin: 'mid',
      Fighter: 'top',
      Mage: 'mid',
      Marksman: 'adc',
      Support: 'support',
      Tank: 'top',
    };

    // Override mappings for specific champions (chỉ lấy role chính)
    const championPrimaryRole = {
      Graves: 'jungle',
      Kindred: 'jungle',
      Karthus: 'jungle',
      Twitch: 'adc',
      Yasuo: 'mid',
      Yone: 'mid',
      Irelia: 'top',
      Akali: 'mid',
      Sylas: 'mid',
      Ekko: 'mid',
      Fizz: 'mid',
      Katarina: 'mid',
      Zed: 'mid',
      Talon: 'mid',
      Qiyana: 'mid',
      Pyke: 'support',
      Thresh: 'support',
      Blitzcrank: 'support',
      Leona: 'support',
      Nautilus: 'support',
      Alistar: 'support',
      Braum: 'support',
      Rakan: 'support',
      Lulu: 'support',
      Janna: 'support',
      Nami: 'support',
      Soraka: 'support',
      Sona: 'support',
      Yuumi: 'support',
      Zeri: 'adc',
    };

    let processedCount = 0;
    const totalChampions = champions.length;

    for (const champion of champions) {
      processedCount++;
      console.log(
        `\n[${processedCount}/${totalChampions}] 🔍 Processing ${champion.name}...`,
      );

      // Determine primary role for this champion
      let primaryRole = 'mid'; // Default role

      if (championPrimaryRole[champion.name]) {
        primaryRole = championPrimaryRole[champion.name];
      } else if (champion.tags && champion.tags.length > 0) {
        const primaryTag = champion.tags[0];
        primaryRole = primaryRoleMapping[primaryTag] || 'mid';
      }

      console.log(`  📋 Primary role for ${champion.name}: ${primaryRole}`);

      // Crawl counter data for primary role only
      try {
        console.log(`    🔄 Crawling ${champion.name} - ${primaryRole}...`);

        await counterCrawlerService.crawlCounterData(
          champion.name,
          primaryRole,
          '15.10',
          'Emerald+',
        );

        console.log(
          `    ✅ Successfully crawled ${champion.name} - ${primaryRole}`,
        );

        // Delay between requests to be respectful
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(
          `    ❌ Failed to crawl ${champion.name} - ${primaryRole}:`,
          error.message,
        );
        continue;
      }
    }

    console.log('\n🎉 Counter crawl completed!');
    console.log(`📊 Processed ${processedCount} champions`);
  } catch (error) {
    console.error('❌ Error during counter crawl:', error);
  } finally {
    await app.close();
  }
}

main().catch(console.error);
