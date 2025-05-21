import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Champions list we need to crawl
const MISSING_CHAMPIONS = ['Varus', 'Vayne', 'Ziggs', 'Zilean', 'Teemo'];

// Map Wild Rift champion names to PC LoL Data Dragon names
const nameMapWildRiftToPC = {
  Varus: 'Varus',
  Vayne: 'Vayne',
  Ziggs: 'Ziggs',
  Zilean: 'Zilean',
  Teemo: 'Teemo',
};

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('Starting to crawl missing champions ability data...');

    // Get WrChampion model
    const wrChampionModel = app.get(getModelToken('WrChampion'));

    // Get latest version of Data Dragon
    const versionResponse = await axios.get(
      'https://ddragon.leagueoflegends.com/api/versions.json',
    );
    const latestVersion = versionResponse.data[0];
    console.log(`Using Data Dragon version: ${latestVersion}`);

    // Process all missing champions
    for (const championName of MISSING_CHAMPIONS) {
      console.log(`Processing ${championName}...`);

      // Find champion in the database
      const champion = await wrChampionModel.findOne({ name: championName });

      if (!champion) {
        console.log(
          `Champion ${championName} not found in database. Skipping.`,
        );
        continue;
      }

      // Get PC LoL name for Data Dragon
      const pcName = nameMapWildRiftToPC[championName] || championName;

      // First, get champion data to verify it exists and get ability IDs
      try {
        const championDataResponse = await axios.get(
          `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion/${pcName}.json`,
        );

        const championData = championDataResponse.data.data[pcName];

        if (!championData) {
          console.log(`No Data Dragon data for ${championName}. Skipping.`);
          continue;
        }

        // Process abilities
        const abilities = {
          passive: {
            name: championData.passive.name,
            description: championData.passive.description.replace(
              /<[^>]*>/g,
              '',
            ),
            imageUrl: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/passive/${championData.passive.image.full}`,
          },
          q: {
            name: championData.spells[0].name,
            description: championData.spells[0].description.replace(
              /<[^>]*>/g,
              '',
            ),
            cooldown: championData.spells[0].cooldown,
            cost: championData.spells[0].cost,
            imageUrl: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/spell/${championData.spells[0].image.full}`,
          },
          w: {
            name: championData.spells[1].name,
            description: championData.spells[1].description.replace(
              /<[^>]*>/g,
              '',
            ),
            cooldown: championData.spells[1].cooldown,
            cost: championData.spells[1].cost,
            imageUrl: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/spell/${championData.spells[1].image.full}`,
          },
          e: {
            name: championData.spells[2].name,
            description: championData.spells[2].description.replace(
              /<[^>]*>/g,
              '',
            ),
            cooldown: championData.spells[2].cooldown,
            cost: championData.spells[2].cost,
            imageUrl: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/spell/${championData.spells[2].image.full}`,
          },
          ultimate: {
            name: championData.spells[3].name,
            description: championData.spells[3].description.replace(
              /<[^>]*>/g,
              '',
            ),
            cooldown: championData.spells[3].cooldown,
            cost: championData.spells[3].cost,
            imageUrl: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/spell/${championData.spells[3].image.full}`,
          },
        };

        // Update champion with abilities data
        await wrChampionModel.updateOne({ _id: champion._id }, { abilities });

        console.log(`  Updated abilities for ${championName}`);
        console.log(`  Passive: ${abilities.passive.name}`);
        console.log(`  Q: ${abilities.q.name}`);
        console.log(`  W: ${abilities.w.name}`);
        console.log(`  E: ${abilities.e.name}`);
        console.log(`  Ultimate: ${abilities.ultimate.name}`);
      } catch (error) {
        console.error(`Error processing ${championName}: ${error.message}`);
      }

      // Add a delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log('Finished crawling missing champions ability data.');
  } catch (error) {
    console.error('Error in bootstrap:', error);
  } finally {
    await app.close();
  }
}

// Run the script
bootstrap();
