import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';

/**
 * This script specifically fixes Ambessa's abilities and image URLs
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('Starting to fix Ambessa ability image URLs...');

    // Get WrChampion model
    const wrChampionModel = app.get(getModelToken('WrChampion'));

    // Find Ambessa
    const ambessa = await wrChampionModel.findOne({ name: 'Ambessa' });

    if (!ambessa) {
      console.log('Champion Ambessa not found in database.');
      return;
    }

    if (!ambessa.abilities) {
      console.log('Champion Ambessa has no abilities data.');
      return;
    }

    console.log('Current Ambessa ability data:');
    console.log(JSON.stringify(ambessa.abilities, null, 2));

    // Fix Ambessa's abilities with correct image URLs
    const updatedAbilities = {
      passive: {
        ...ambessa.abilities.passive,
        name: 'Combat Prowess',
        imageUrl:
          'https://ddragon.leagueoflegends.com/cdn/14.11.1/img/passive/Ambessa_P.png',
      },
      q: {
        ...ambessa.abilities.q,
        name: 'Grappling Strike',
        imageUrl:
          'https://ddragon.leagueoflegends.com/cdn/14.11.1/img/spell/AmbessaQ.png',
      },
      w: {
        ...ambessa.abilities.w,
        name: 'Precise Cuts',
        imageUrl:
          'https://ddragon.leagueoflegends.com/cdn/14.11.1/img/spell/AmbessaW.png',
      },
      e: {
        ...ambessa.abilities.e,
        name: "Warrior's Advance",
        imageUrl:
          'https://ddragon.leagueoflegends.com/cdn/14.11.1/img/spell/AmbessaE.png',
      },
      ultimate: {
        ...ambessa.abilities.ultimate,
        name: 'Dauntless Charge',
        imageUrl:
          'https://ddragon.leagueoflegends.com/cdn/14.11.1/img/spell/AmbessaR.png',
      },
    };

    // Update the champion abilities
    await wrChampionModel.updateOne(
      { _id: ambessa._id },
      { $set: { abilities: updatedAbilities } },
    );

    console.log('Ambessa ability images fixed successfully!');

    // Verify the update
    const updatedAmbessa = await wrChampionModel.findOne({ name: 'Ambessa' });
    console.log('Updated Ambessa ability data:');
    console.log(JSON.stringify(updatedAmbessa.abilities, null, 2));
  } catch (error) {
    console.error('Error fixing Ambessa abilities:', error);
  } finally {
    await app.close();
  }
}

// Run the bootstrap function
bootstrap();
