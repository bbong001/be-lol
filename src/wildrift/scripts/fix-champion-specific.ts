import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import axios from 'axios';

/**
 * This script specifically fixes Ambessa's ability names and URLs
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('Starting to fix Ambessa ability names and URLs...');

    // Get WrChampion model
    const wrChampionModel = app.get(getModelToken('WrChampion'));

    // Find Ambessa
    const ambessa = await wrChampionModel.findOne({ name: 'Ambessa' });

    if (!ambessa) {
      console.log('Champion Ambessa not found in database.');
      return;
    }

    if (!ambessa.abilities) {
      console.log('Champion Ambessa has no abilities defined.');
      return;
    }

    // Correct ability names and descriptions
    const correctAbilities = {
      passive: {
        name: "Drakehound's Step",
        description:
          "Passive: Upon casting an ability, Ambessa dashes a short distance in the specified direction (Feint). Her next attack within 4 seconds of triggering Feint has increased range, attacks 50% faster, deals bonus physical damage based on target's max health, and restores Energy to herself.",
        imageUrl:
          'https://ddragon.leagueoflegends.com/cdn/14.11.1/img/champion/Ambessa.png',
      },
      q: {
        name: 'Grappling Strike',
        description:
          'Ambessa dashes forward and cleaves enemies in front of her, dealing physical damage and applying Repudiation stacks. Enemies hit at the edge receive additional damage.',
        imageUrl:
          'https://ddragon.leagueoflegends.com/cdn/14.11.1/img/champion/Ambessa.png',
        cooldown: [9, 8, 7, 6],
        cost: [0, 0, 0, 0],
      },
      w: {
        name: 'Precise Cuts',
        description:
          'Ambessa slashes in a cone, dealing physical damage and applying Repudiation stacks. If she hits an enemy champion, she gains a shield based on her maximum health.',
        imageUrl:
          'https://ddragon.leagueoflegends.com/cdn/14.11.1/img/champion/Ambessa.png',
        cooldown: [14, 13, 12, 11],
        cost: [0, 0, 0, 0],
      },
      e: {
        name: "Warrior's Advance",
        description:
          "Passive: Ambessa's champion takedowns within 3 seconds of damaging them restore her Energy, heal her based on missing health, and reset her basic ability cooldowns. Active: Ambessa charges in the specified direction, dealing physical damage to enemies hit.",
        imageUrl:
          'https://ddragon.leagueoflegends.com/cdn/14.11.1/img/champion/Ambessa.png',
        cooldown: [16, 14, 12, 10],
        cost: [0, 0, 0, 0],
      },
      ultimate: {
        name: 'Public Execution',
        description:
          "Ambessa seizes an enemy champion in front of her and blinks to their location, suppressing them for 1 second. She then slams the target, dealing physical damage based on the target's missing health and stunning them.",
        imageUrl:
          'https://ddragon.leagueoflegends.com/cdn/14.11.1/img/champion/Ambessa.png',
        cooldown: [70, 60, 50],
        cost: [0, 0, 0],
      },
    };

    // Update Ambessa's abilities
    ambessa.abilities = correctAbilities;

    // Save changes
    await ambessa.save();

    console.log("Successfully updated Ambessa's abilities.");
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await app.close();
  }
}

// Run the bootstrap function
bootstrap().catch((error) => console.error('Fatal error:', error));
