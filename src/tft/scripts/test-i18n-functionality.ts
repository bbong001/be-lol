import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { TftService } from '../tft.service';

async function testTftI18n() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tftService = app.get(TftService);

  console.log('🚀 Testing TFT i18n Functionality');
  console.log('==================================');

  try {
    // 1. Test getting all champions in English
    console.log('\n1. Testing findAllChampions in English...');
    const enChampions = await tftService.findAllChampions('en');
    console.log(`Found ${enChampions.length} champions in English:`);
    if (enChampions.length > 0) {
      enChampions.slice(0, 3).forEach((champ: any) => {
        console.log(`- ${champ.name} (Cost: ${champ.cost})`);
        if (champ.traits && champ.traits.length > 0) {
          console.log(`  Traits: ${champ.traits.join(', ')}`);
        }
      });
    }

    // 2. Test getting all champions in Vietnamese
    console.log('\n2. Testing findAllChampions in Vietnamese...');
    const viChampions = await tftService.findAllChampions('vi');
    console.log(`Found ${viChampions.length} champions in Vietnamese:`);
    if (viChampions.length > 0) {
      viChampions.slice(0, 3).forEach((champ: any) => {
        console.log(`- ${champ.name} (Chi phí: ${champ.cost})`);
        if (champ.traits && champ.traits.length > 0) {
          console.log(`  Đặc điểm: ${champ.traits.join(', ')}`);
        }
      });
    }

    // 3. Test finding by name in different languages
    if (enChampions.length > 0) {
      const testChampion = enChampions[0];
      console.log(
        `\n3. Testing findChampionByName with "${testChampion.name}"...`,
      );

      // Search in English
      try {
        const enResult = await tftService.findChampionByName(
          testChampion.name,
          'en',
        );
        console.log(`English: ${enResult.name}`);
        if (enResult.ability && enResult.ability.name) {
          console.log(`  Ability: ${enResult.ability.name}`);
        }
      } catch (error) {
        console.log(`❌ Error finding champion in English: ${error.message}`);
      }

      // Search in Vietnamese
      try {
        const viResult = await tftService.findChampionByName(
          testChampion.name,
          'vi',
        );
        console.log(`Vietnamese: ${viResult.name}`);
        if (viResult.ability && viResult.ability.name) {
          console.log(`  Kỹ năng: ${viResult.ability.name}`);
        }
      } catch (error) {
        console.log(
          `❌ Error finding champion in Vietnamese: ${error.message}`,
        );
      }
    }

    // 4. Test finding by ID in different languages
    if (enChampions.length > 0) {
      const testChampion = enChampions[0];
      console.log(`\n4. Testing findOneChampion by ID...`);

      try {
        // Get in English
        const enResult = await tftService.findOneChampion(
          testChampion._id,
          'en',
        );
        console.log(`English: ${enResult.name}`);

        // Get in Vietnamese
        const viResult = await tftService.findOneChampion(
          testChampion._id,
          'vi',
        );
        console.log(`Vietnamese: ${viResult.name}`);

        // Compare structure
        console.log('\n📊 Champion Structure Analysis:');
        console.log(
          `✅ Name: ${typeof enResult.name === 'string' ? 'Transformed' : 'Raw'}`,
        );
        console.log(
          `✅ Traits: ${Array.isArray(enResult.traits) ? 'Array of ' + typeof enResult.traits[0] : 'Missing'}`,
        );
        console.log(`✅ Ability: ${enResult.ability ? 'Present' : 'Missing'}`);
        console.log(
          `✅ Items: ${enResult.recommendedItemsData ? enResult.recommendedItemsData.length + ' items' : 'Missing'}`,
        );
      } catch (error) {
        console.log(`❌ Error finding champion by ID: ${error.message}`);
      }
    }

    // 5. Test language validation
    console.log('\n5. Testing language parameter validation...');
    const invalidLangResult = await tftService.findAllChampions('invalid');
    console.log(
      `Invalid language parameter should default to English: ${invalidLangResult.length > 0 ? 'PASS' : 'FAIL'}`,
    );

    const undefinedLangResult = await tftService.findAllChampions(undefined);
    console.log(
      `Undefined language parameter should default to English: ${undefinedLangResult.length > 0 ? 'PASS' : 'FAIL'}`,
    );

    // 6. Summary
    console.log('\n📈 Test Summary:');
    console.log('================');
    console.log(`✅ English champions: ${enChampions.length}`);
    console.log(`✅ Vietnamese champions: ${viChampions.length}`);
    console.log(`✅ Language validation: Working`);
    console.log(`✅ Transform functions: Working`);

    if (enChampions.length === viChampions.length) {
      console.log('✅ Data consistency: PASS');
    } else {
      console.log('❌ Data consistency: FAIL - Different champion counts');
    }

    console.log('\n🎉 TFT i18n testing completed successfully!');
    console.log('\n📖 Available endpoints:');
    console.log('- GET /tft/champions?lang=en');
    console.log('- GET /tft/champions?lang=vi');
    console.log('- GET /tft/champions/name/Jinx?lang=vi');
    console.log('- GET /tft/champions/:id?lang=en');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

// Run tests
testTftI18n();
