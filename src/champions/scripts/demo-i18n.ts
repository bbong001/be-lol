import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { ChampionsService } from '../champions.service';

async function demoI18n() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const championsService = app.get(ChampionsService);

  console.log('🚀 Demo I18n for Champions Module');
  console.log('=====================================');

  try {
    // 1. Sync champions with multilingual data
    console.log('\n1. Syncing champions from Riot API...');
    await championsService.syncFromRiotApi();
    console.log('✅ Champions synced successfully!');

    // 2. Test finding all champions in English
    console.log('\n2. Testing findAll with English (en)...');
    const enChampions = await championsService.findAll(1, 5, 'en');
    console.log(`Found ${enChampions.total} champions in English:`);
    enChampions.data.slice(0, 3).forEach((champ: any) => {
      console.log(`- ${champ.name} (${champ.title})`);
    });

    // 3. Test finding all champions in Vietnamese
    console.log('\n3. Testing findAll with Vietnamese (vi)...');
    const viChampions = await championsService.findAll(1, 5, 'vi');
    console.log(`Found ${viChampions.total} champions in Vietnamese:`);
    viChampions.data.slice(0, 3).forEach((champ: any) => {
      console.log(`- ${champ.name} (${champ.title})`);
    });

    // 4. Test finding by name in different languages
    console.log('\n4. Testing findByName...');

    // Search for "Ahri" in English
    const ahriEn = await championsService.findByName('Ahri', 'en');
    if (ahriEn) {
      console.log(`Ahri in English: ${ahriEn.name} - ${ahriEn.title}`);
    }

    // Search for "Ahri" in Vietnamese
    const ahriVi = await championsService.findByName('Ahri', 'vi');
    if (ahriVi) {
      console.log(`Ahri in Vietnamese: ${ahriVi.name} - ${ahriVi.title}`);
    }

    // 5. Test finding details by name
    console.log('\n5. Testing findDetailsByName...');

    try {
      const detailsEn = await championsService.findDetailsByName('Ahri', 'en');
      console.log(`Details found in English: ${detailsEn.results} champion(s)`);

      const detailsVi = await championsService.findDetailsByName('Ahri', 'vi');
      console.log(
        `Details found in Vietnamese: ${detailsVi.results} champion(s)`,
      );
    } catch (error) {
      console.log('Error in findDetailsByName:', error.message);
    }

    console.log('\n✅ Demo completed successfully!');
    console.log('\n📖 How to use the API:');
    console.log('- GET /champions?lang=en (English champions)');
    console.log('- GET /champions?lang=vi (Vietnamese champions)');
    console.log('- GET /champions/name/Ahri?lang=vi (Vietnamese Ahri)');
    console.log('- GET /champions/details/Ahri?lang=en (English Ahri details)');
  } catch (error) {
    console.error('❌ Error during demo:', error.message);
  } finally {
    await app.close();
  }
}

// Run the demo
demoI18n().catch(console.error);
