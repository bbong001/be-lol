import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ChampionsService } from '../champions/champions.service';

async function main() {
  try {
    // Create a NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get the ChampionsService
    const championsService = app.get(ChampionsService);

    // Define which champion to crawl
    const championName = process.argv[2] || 'aatrox';

    console.log(`Crawling build data for ${championName}...`);

    // Fetch the build data
    const buildData = await championsService.getChampionBuild(championName);

    // Output the result
    console.log(JSON.stringify(buildData, null, 2));

    // Close the application
    await app.close();
  } catch (error) {
    console.error('Error in crawl script:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
