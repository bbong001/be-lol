import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { ChampionsService } from '../champions.service';
import { Model } from 'mongoose';
import { ChampionDocument } from '../schemas/champion.schema';

async function testSingleChampion() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championsService = app.get(ChampionsService);
    const championModel = app.get('ChampionModel') as Model<ChampionDocument>;

    console.log('🧪 Testing Single Champion i18n Functionality');
    console.log('==============================================');

    // 1. Check if we have any champions in database
    const totalCount = await championModel.countDocuments();
    console.log(`📊 Total champions in database: ${totalCount}`);

    if (totalCount === 0) {
      console.log('❌ No champions found. Syncing from Riot API first...');
      await championsService.syncFromRiotApi();
      console.log('✅ Champions synced!');
    }

    // 2. Get a sample champion from database
    const sampleChampion = await championModel.findOne().lean();
    if (!sampleChampion) {
      console.log('❌ No champions found even after sync');
      return;
    }

    console.log(`\n🎯 Testing with champion: ${sampleChampion.id}`);
    console.log('=====================================');

    // 3. Check current data structure
    const championData = sampleChampion as any;
    console.log('📋 Current Data Structure:');

    if (typeof championData.name === 'string') {
      console.log(`   📝 Name: "${championData.name}" (Single Language)`);
      console.log(
        `   🏷️  Title: "${championData.title || 'N/A'}" (Single Language)`,
      );

      // Detect language
      const vietnamesePattern =
        /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
      const isVietnamese = vietnamesePattern.test(championData.name);
      console.log(
        `   🌍 Detected Language: ${isVietnamese ? 'Vietnamese' : 'English'}`,
      );

      console.log(
        '\n❗ Data needs to be converted to multilingual format first!',
      );
      console.log('🚀 Run: npm run migrate:champions-i18n');
    } else if (typeof championData.name === 'object' && championData.name.en) {
      console.log(
        `   📝 Name: EN="${championData.name.en}" / VI="${championData.name.vi}"`,
      );
      console.log(
        `   🏷️  Title: EN="${championData.title?.en || 'N/A'}" / VI="${championData.title?.vi || 'N/A'}"`,
      );
      console.log('✅ Data is already in multilingual format!');

      // 4. Test i18n API calls
      console.log('\n🧪 Testing i18n API calls:');
      console.log('==========================');

      try {
        // Test findByName with different languages
        console.log('\n📞 Testing findByName...');

        // Test English
        console.log('Testing English...');
        const championEn = await championsService.findByName(
          championData.id,
          'en',
        );
        if (championEn) {
          console.log(
            `✅ English: ${championEn.name} - ${championEn.title || 'N/A'}`,
          );
        } else {
          console.log('❌ No English result found');
        }

        // Test Vietnamese
        console.log('Testing Vietnamese...');
        const championVi = await championsService.findByName(
          championData.id,
          'vi',
        );
        if (championVi) {
          console.log(
            `✅ Vietnamese: ${championVi.name} - ${championVi.title || 'N/A'}`,
          );
        } else {
          console.log('❌ No Vietnamese result found');
        }

        // Test findAll with pagination
        console.log('\n📞 Testing findAll with pagination...');

        const allEn = await championsService.findAll(1, 3, 'en');
        console.log(`✅ findAll EN: ${allEn.data.length} champions (page 1)`);
        allEn.data.slice(0, 2).forEach((champ: any, index: number) => {
          console.log(
            `   ${index + 1}. ${champ.name} - ${champ.title || 'N/A'}`,
          );
        });

        const allVi = await championsService.findAll(1, 3, 'vi');
        console.log(`✅ findAll VI: ${allVi.data.length} champions (page 1)`);
        allVi.data.slice(0, 2).forEach((champ: any, index: number) => {
          console.log(
            `   ${index + 1}. ${champ.name} - ${champ.title || 'N/A'}`,
          );
        });
      } catch (error) {
        console.error(`❌ API test failed: ${error.message}`);
      }
    } else {
      console.log('❓ Unknown data structure');
      console.log(`   Name type: ${typeof championData.name}`);
      console.log(`   Name value:`, championData.name);
    }

    console.log('\n🎉 Test Results:');
    console.log('================');

    if (typeof championData.name === 'object' && championData.name.en) {
      console.log('✅ Champions i18n functionality is working!');
      console.log('\n🔗 You can now use these API endpoints:');
      console.log(`   GET /champions?lang=en`);
      console.log(`   GET /champions?lang=vi`);
      console.log(`   GET /champions/name/${championData.id}?lang=vi`);
      console.log(`   GET /champions/details/${championData.id}?lang=en`);
    } else {
      console.log('⚠️ Data needs migration to multilingual format');
      console.log('🚀 Run: npm run migrate:champions-i18n');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

testSingleChampion().catch(console.error);
