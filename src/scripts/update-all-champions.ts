import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ChampionBuildCrawlerService } from '../champions/services/champion-build-crawler.service';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  try {
    // Create a NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get the ChampionBuildCrawlerService
    const championBuildCrawlerService = app.get(ChampionBuildCrawlerService);

    // Read champion.json file
    const championJsonPath = path.resolve(
      __dirname,
      '../data/lol/champion.json',
    );
    const championData = JSON.parse(fs.readFileSync(championJsonPath, 'utf8'));

    // Get all champion IDs
    const championIds = Object.keys(championData.data);

    console.log(`Found ${championIds.length} champions to update`);

    // Process champions with a delay between requests to avoid rate limiting
    let successCount = 0;
    const failedChampions = [];

    // Process champions one by one
    for (const championId of championIds) {
      try {
        console.log(`Processing champion: ${championId}`);

        // Crawl build data
        const buildData =
          await championBuildCrawlerService.crawlChampionBuild(championId);

        // Save to a file (optional)
        const outputDir = path.resolve(__dirname, '../data/builds');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(
          path.resolve(outputDir, `${championId.toLowerCase()}.json`),
          JSON.stringify(buildData, null, 2),
          'utf8',
        );

        console.log(`✅ Successfully updated ${championId}`);
        successCount++;

        // Add a delay between requests (2 seconds)
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`❌ Error updating ${championId}: ${error.message}`);
        failedChampions.push(championId);
      }
    }

    // Output summary
    console.log('\n=== Update Summary ===');
    console.log(`Total champions: ${championIds.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Failed: ${failedChampions.length}`);

    if (failedChampions.length > 0) {
      console.log('Failed champions:');
      console.log(failedChampions.join(', '));
    }

    await app.close();
  } catch (error) {
    console.error(`Error running script: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
