import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { InjectModel } from '@nestjs/mongoose';
import { Champion, ChampionDocument } from '../schemas/champion.schema';
import { Model } from 'mongoose';

async function checkCurrentData() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championModel = app.get('ChampionModel') as Model<ChampionDocument>;

    console.log('🔍 Checking current champion data structure...');
    console.log('================================================');

    // Get total count
    const totalCount = await championModel.countDocuments();
    console.log(`📊 Total champions in database: ${totalCount}`);

    if (totalCount === 0) {
      console.log('❌ No champions found. Run sync first:');
      console.log('npm run champions:sync');
      return;
    }

    // Get sample data
    const sampleChampions = await championModel.find().limit(5).lean();

    console.log('\n📋 Sample champion data:');
    console.log('========================');

    sampleChampions.forEach((champion: any, index: number) => {
      console.log(`\n${index + 1}. Champion ID: ${champion.id}`);

      // Check name structure
      if (typeof champion.name === 'string') {
        console.log(
          `   📝 Name: "${champion.name}" (String - Single Language)`,
        );

        // Detect language
        const isVietnamese =
          /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
            champion.name,
          );
        console.log(
          `   🌍 Detected Language: ${isVietnamese ? 'Vietnamese' : 'English'}`,
        );
      } else if (typeof champion.name === 'object') {
        console.log(
          `   📝 Name: EN="${champion.name.en}" / VI="${champion.name.vi}" (Object - Multilingual)`,
        );
      } else {
        console.log(`   ❓ Name: Unknown structure (${typeof champion.name})`);
      }

      // Check title structure
      if (typeof champion.title === 'string') {
        console.log(
          `   🏷️  Title: "${champion.title}" (String - Single Language)`,
        );
      } else if (typeof champion.title === 'object') {
        console.log(
          `   🏷️  Title: EN="${champion.title.en}" / VI="${champion.title.vi}" (Object - Multilingual)`,
        );
      } else {
        console.log(
          `   ❓ Title: Unknown structure (${typeof champion.title})`,
        );
      }
    });

    // Analyze overall structure
    console.log('\n📈 Overall Analysis:');
    console.log('====================');

    const allChampions = await championModel.find().select('name title').lean();

    let singleLanguageCount = 0;
    let multilingualCount = 0;
    let vietnameseCount = 0;
    let englishCount = 0;

    allChampions.forEach((champion: any) => {
      if (typeof champion.name === 'string') {
        singleLanguageCount++;
        const isVietnamese =
          /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
            champion.name,
          );
        if (isVietnamese) {
          vietnameseCount++;
        } else {
          englishCount++;
        }
      } else if (typeof champion.name === 'object') {
        multilingualCount++;
      }
    });

    console.log(`📊 Single Language: ${singleLanguageCount}/${totalCount}`);
    console.log(`📊 Multilingual: ${multilingualCount}/${totalCount}`);

    if (singleLanguageCount > 0) {
      console.log(`   └─ English: ${englishCount}`);
      console.log(`   └─ Vietnamese: ${vietnameseCount}`);
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('==================');

    if (multilingualCount === totalCount) {
      console.log('✅ All data is already in multilingual format!');
      console.log('🚀 You can use the i18n APIs:');
      console.log('   - GET /champions?lang=en');
      console.log('   - GET /champions?lang=vi');
    } else if (singleLanguageCount > 0) {
      const dominantLanguage =
        englishCount > vietnameseCount ? 'English' : 'Vietnamese';
      console.log(`🔄 Data needs migration to multilingual format`);
      console.log(`📊 Dominant language: ${dominantLanguage}`);
      console.log(`🚀 Run migration script:`);
      console.log(`   npm run migrate:champions-i18n`);
    } else {
      console.log('❓ Mixed or unknown data structure detected');
      console.log('🔧 Manual intervention may be required');
    }
  } catch (error) {
    console.error('❌ Error checking data:', error.message);
  } finally {
    await app.close();
  }
}

checkCurrentData().catch(console.error);
