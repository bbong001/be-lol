import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ChampionsService } from '../champions/champions.service';

// Mapping of champion.json IDs to op.gg URLs
const CHAMPION_NAME_MAPPING = {
  AurelionSol: 'aurelionsol',
  Belveth: 'belveth',
  Chogath: 'chogath',
  DrMundo: 'drmundo',
  JarvanIV: 'jarvaniv',
  Kaisa: 'kaisa',
  Khazix: 'khazix',
  KogMaw: 'kogmaw',
  KSante: 'ksante',
  LeeSin: 'leesin',
  MasterYi: 'masteryi',
  MissFortune: 'missfortune',
  MonkeyKing: 'wukong', // This is actually Wukong in op.gg
  RekSai: 'reksai',
  TahmKench: 'tahmkench',
  TwistedFate: 'twistedfate',
  Velkoz: 'velkoz',
  XinZhao: 'xinzhao',
};

async function main() {
  try {
    console.time();
    // Create a NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get the ChampionsService
    const championsService = app.get(ChampionsService);

    console.log(
      `Found ${Object.keys(CHAMPION_NAME_MAPPING).length} champions to fix`,
    );

    // Process champions with a delay between requests to avoid rate limiting
    let successCount = 0;
    const failedChampions = [];

    // Process champions one by one
    for (const [championId, opggName] of Object.entries(
      CHAMPION_NAME_MAPPING,
    )) {
      try {
        console.log(`Processing champion: ${championId} -> ${opggName}`);

        // Get champion build data for the specific champion with custom op.gg name
        const result = await championsService.getChampionBuildWithCustomName(
          championId,
          opggName,
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
    console.log(
      `Total champions to fix: ${Object.keys(CHAMPION_NAME_MAPPING).length}`,
    );
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Failed: ${failedChampions.length}`);

    if (failedChampions.length > 0) {
      console.log('Failed champions:');
      console.log(failedChampions.join(', '));
    }

    await app.close();
    console.timeEnd();
  } catch (error) {
    console.error(`Error running script: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
