import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { ChampionDocument } from '../schemas/champion.schema';

async function checkChampionStructure() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championModel = app.get('ChampionModel') as Model<ChampionDocument>;

    const champion = await championModel.findOne({ id: 'Ahri' }).lean();

    console.log('🔍 Champion Structure Analysis');
    console.log('==============================');
    console.log('ID:', champion?.id);
    console.log('Name:', JSON.stringify(champion?.name, null, 2));
    console.log('Title:', JSON.stringify(champion?.title, null, 2));
    console.log('Abilities length:', champion?.abilities?.length || 0);
    console.log(
      'Recommended Runes length:',
      champion?.recommendedRunes?.length || 0,
    );
    console.log(
      'Recommended Items length:',
      champion?.recommendedItems?.length || 0,
    );

    if (champion?.abilities?.length > 0) {
      console.log(
        '\nFirst Ability:',
        JSON.stringify(champion.abilities[0], null, 2),
      );
    }

    if (champion?.recommendedRunes?.length > 0) {
      console.log(
        '\nFirst Rune:',
        JSON.stringify(champion.recommendedRunes[0], null, 2),
      );
    }

    if (champion?.recommendedItems?.length > 0) {
      console.log(
        '\nFirst Item:',
        JSON.stringify(champion.recommendedItems[0], null, 2),
      );
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await app.close();
  }
}

checkChampionStructure().catch(console.error);
