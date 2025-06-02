import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { ChampionDocument } from '../schemas/champion.schema';

async function quickCheck() {
  console.log('🔍 Quick Champion Data Check');
  console.log('============================');

  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championModel = app.get('ChampionModel') as Model<ChampionDocument>;

    // Count total champions
    const count = await championModel.countDocuments();
    console.log(`📊 Total champions: ${count}`);

    if (count === 0) {
      console.log('❌ No champions found in database');
      console.log('🚀 Run: npm run champions:sync');
      return;
    }

    // Get first champion
    const firstChampion = await championModel.findOne().lean();
    console.log('\n📋 Sample Champion:');
    console.log(`ID: ${firstChampion.id}`);

    // Check structure
    if (typeof firstChampion.name === 'string') {
      console.log(`Name: "${firstChampion.name}" (String)`);
      console.log(`Title: "${firstChampion.title}" (String)`);
      console.log('📝 Structure: Single Language');
    } else if (typeof firstChampion.name === 'object') {
      console.log(`Name EN: "${firstChampion.name.en}"`);
      console.log(`Name VI: "${firstChampion.name.vi}"`);
      console.log(`Title EN: "${firstChampion.title?.en}"`);
      console.log(`Title VI: "${firstChampion.title?.vi}"`);
      console.log('📝 Structure: Multilingual');
    }

    console.log('\n✅ Check completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await app.close();
  }
}

quickCheck().catch(console.error);
