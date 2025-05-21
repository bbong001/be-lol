import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Data structure to represent champion skills information
interface ChampionData {
  [champion: string]: {
    passive: { name: string; url: string };
    q: { name: string; url: string };
    w: { name: string; url: string };
    e: { name: string; url: string };
    ultimate: { name: string; url: string };
  };
}

// Wild Rift official data for champions with image problems
const correctChampionData: ChampionData = {
  Aatrox: {
    passive: {
      name: 'Deathbringer Stance',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt5e6165f11e1cdc95/638e5c065c935f338cbe099a/WR_GOS10_Aatrox_P.png',
    },
    q: {
      name: 'The Darkin Blade',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt5a5e9ce6c16d8fa7/638e5c06c781b6637dee5d41/WR_GOS10_Aatrox_Q.png',
    },
    w: {
      name: 'Infernal Chains',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/bltd1a4ec75a6bb6e10/638e5c06bc3feb38d92addf0/WR_GOS10_Aatrox_W.png',
    },
    e: {
      name: 'Umbral Dash',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt4c0c9c0d464f86dd/638e5c06bc3feb38d92addf4/WR_GOS10_Aatrox_E.png',
    },
    ultimate: {
      name: 'World Ender',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt3c6a7cbe57beae8c/638e5c06c781b6637dee5d3d/WR_GOS10_Aatrox_R.png',
    },
  },
  Akshan: {
    passive: {
      name: 'Dirty Fighting',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/bltf2291d2ed8e47e58/6101d38fd9879d5b61b1a097/WR_ChampionAbility_Akshan_P.png',
    },
    q: {
      name: 'Avengerang',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt6cea44f3bcffd28f/6101d38c25a49d3b7ad184a7/WR_ChampionAbility_Akshan_Q.png',
    },
    w: {
      name: 'Going Rogue',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt0efd74791317dfb1/6101d38cdd1f8f3ee5a0db86/WR_ChampionAbility_Akshan_W.png',
    },
    e: {
      name: 'Heroic Swing',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt7e09707a7143601e/6101d38dd1e4d03e1c3dba3d/WR_ChampionAbility_Akshan_E.png',
    },
    ultimate: {
      name: 'Comeuppance',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt8c4136fc1ad1bbd5/6101d38fdd1f8f3ee5a0db8a/WR_ChampionAbility_Akshan_R.png',
    },
  },
  Alistar: {
    passive: {
      name: 'Triumphant Roar',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt02f2bf4752140ae4/5f83d3ae33abc34bfa412bdf/WR_ChampionAbility_Alistar_P.png',
    },
    q: {
      name: 'Pulverize',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt3cad3d8328d30eff/5f83d3ae70f9b644bb38b9e8/WR_ChampionAbility_Alistar_Q.png',
    },
    w: {
      name: 'Headbutt',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt4f7c0c7b8135e691/5f83d3ae7c5f4110cad8cc05/WR_ChampionAbility_Alistar_W.png',
    },
    e: {
      name: 'Trample',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt517c61e1b8fa7a30/5f83d3ae85a641112d27bddb/WR_ChampionAbility_Alistar_E.png',
    },
    ultimate: {
      name: 'Unbreakable Will',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt37494e9cdd5a0f4e/5f83d3ae85a641112d27bddf/WR_ChampionAbility_Alistar_R.png',
    },
  },
  Amumu: {
    passive: {
      name: 'Cursed Touch',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blta6f75f38c71a0fc6/5f83d3ae38ab3e7a65ddbcd2/WR_ChampionAbility_Amumu_P.png',
    },
    q: {
      name: 'Bandage Toss',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt43e8c9a3ca15788b/5f83d3ae70f9b644bb38b9ec/WR_ChampionAbility_Amumu_Q.png',
    },
    w: {
      name: 'Despair',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt4dd521be4a4608a7/5f83d3ae8fbce31c5e46f58b/WR_ChampionAbility_Amumu_W.png',
    },
    e: {
      name: 'Tantrum',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/bltb429c9a06cd01c2b/5f83d3ae6af6e65a3dbd4817/WR_ChampionAbility_Amumu_E.png',
    },
    ultimate: {
      name: 'Curse of the Sad Mummy',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt17ed2d8f7e66950e/5f83d3ae8fbce31c5e46f58f/WR_ChampionAbility_Amumu_R.png',
    },
  },
  Annie: {
    passive: {
      name: 'Pyromania',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt5c6f5ac7f60bcae6/61139ce27da45e6a88659b96/WR_ChampionAbility_Annie_P.png',
    },
    q: {
      name: 'Disintegrate',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt30e0c934d2c89a55/61139ce2fd99465c8756da92/WR_ChampionAbility_Annie_Q.png',
    },
    w: {
      name: 'Incinerate',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt62cc2ce4e462e14e/61139ce2a708f65a9659a07e/WR_ChampionAbility_Annie_W.png',
    },
    e: {
      name: 'Molten Shield',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt8cda74eb8ff2bcbb/61139ce206dd717d5359d5fd/WR_ChampionAbility_Annie_E.png',
    },
    ultimate: {
      name: 'Summon: Tibbers',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt2dce7c9b3acdb2fa/61139ce3ee55b84cea61f9b6/WR_ChampionAbility_Annie_R.png',
    },
  },
  Ashe: {
    passive: {
      name: 'Frost Shot',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt7d722d64a246e28a/5f83d3aede85a97cc535f4f3/WR_ChampionAbility_Ashe_P.png',
    },
    q: {
      name: "Ranger's Focus",
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/bltf9fca09f5a722267/5f83d3ae38ab3e7a65ddbcd6/WR_ChampionAbility_Ashe_Q.png',
    },
    w: {
      name: 'Volley',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt9b9020d2a2f7ac83/5f83d3ae8fbce31c5e46f593/WR_ChampionAbility_Ashe_W.png',
    },
    e: {
      name: 'Hawkshot',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt5a3fd5b38d4b49e7/5f83d3ae70f9b644bb38b9f0/WR_ChampionAbility_Ashe_E.png',
    },
    ultimate: {
      name: 'Enchanted Crystal Arrow',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt47f9e56b2136d789/5f83d3ae7c5f4110cad8cc09/WR_ChampionAbility_Ashe_R.png',
    },
  },
  Draven: {
    passive: {
      name: 'League of Draven',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt24bd24c23bee1f75/5f7f7b8d7c5f4110cad8c767/WR_ChampionAbility_Draven_P.png',
    },
    q: {
      name: 'Spinning Axe',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blta89e3c9e8f24af3c/5f7f7b8c1972331def341f28/WR_ChampionAbility_Draven_Q.png',
    },
    w: {
      name: 'Blood Rush',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt83ef545f5d9f2c2b/5f7f7b8d33abc34bfa412a83/WR_ChampionAbility_Draven_W.png',
    },
    e: {
      name: 'Stand Aside',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt40c2957a87a35f5c/5f7f7b8d8fbce31c5e46f139/WR_ChampionAbility_Draven_E.png',
    },
    ultimate: {
      name: 'Whirling Death',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt2507e5e80d69e4b7/5f7f7b8d197233eeaa388c4f/WR_ChampionAbility_Draven_R.png',
    },
  },
  Yasuo: {
    passive: {
      name: 'Way of the Wanderer',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt68c1352b9e7f2dba/5f7f7bac70f9b644bb38b72a/WR_ChampionAbility_Yasuo_P.png',
    },
    q: {
      name: 'Steel Tempest',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/bltcb94d933e353b936/5f7f7bac85a641112d27ba19/WR_ChampionAbility_Yasuo_Q.png',
    },
    w: {
      name: 'Wind Wall',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/bltff7ad60a1f04f6fd/5f7f7baceec33c79b2557058/WR_ChampionAbility_Yasuo_W.png',
    },
    e: {
      name: 'Sweeping Blade',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt4e3c6e108908e41b/5f7f7bac85a641112d27ba1d/WR_ChampionAbility_Yasuo_E.png',
    },
    ultimate: {
      name: 'Last Breath',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/bltba8d9226d67f3439/5f7f7baceec33c79b255705c/WR_ChampionAbility_Yasuo_R.png',
    },
  },
  Garen: {
    passive: {
      name: 'Perseverance',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt2a1d89d7ae1c532f/5f7f7b907c5f4110cad8c76b/WR_ChampionAbility_Garen_P.png',
    },
    q: {
      name: 'Decisive Strike',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/bltf4d4d2e50d7bd73c/5f7f7b8f8fbce31c5e46f13d/WR_ChampionAbility_Garen_Q.png',
    },
    w: {
      name: 'Courage',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt66ab4d8dc3e9e56a/5f7f7b8f6af6e65a3dbd44a7/WR_ChampionAbility_Garen_W.png',
    },
    e: {
      name: 'Judgment',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt51fcecc7ab69cc5e/5f7f7b8f1972331def341f2c/WR_ChampionAbility_Garen_E.png',
    },
    ultimate: {
      name: 'Demacian Justice',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt41d39d7e8bed7ad6/5f7f7b8fde85a97cc535f098/WR_ChampionAbility_Garen_R.png',
    },
  },
  Jax: {
    passive: {
      name: 'Relentless Assault',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt7bc11794e5e70bc6/5f7f7b9344d85a6a8c6751e4/WR_ChampionAbility_Jax_P.png',
    },
    q: {
      name: 'Leap Strike',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt1c85ee8e0a8225c8/5f7f7b9444d85a6a8c6751e8/WR_ChampionAbility_Jax_Q.png',
    },
    w: {
      name: 'Empower',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/bltd7b0b5a1d0042826/5f7f7b947c5f4110cad8c76f/WR_ChampionAbility_Jax_W.png',
    },
    e: {
      name: 'Counter Strike',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt18b1e9eff4f42e16/5f7f7b946af6e65a3dbd44ab/WR_ChampionAbility_Jax_E.png',
    },
    ultimate: {
      name: "Grandmaster's Might",
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt3fbbec8cfc0793d5/5f7f7b9488d27e7f387b24d5/WR_ChampionAbility_Jax_R.png',
    },
  },
  Leona: {
    passive: {
      name: 'Sunlight',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/bltf6d5b0aef5500d35/5f7f7b95de85a97cc535f09c/WR_ChampionAbility_Leona_P.png',
    },
    q: {
      name: 'Shield of Daybreak',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt38d58fad15d73e0a/5f7f7b956af6e65a3dbd44af/WR_ChampionAbility_Leona_Q.png',
    },
    w: {
      name: 'Eclipse',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt6c4664bc8a4452f9/5f7f7b958fbce31c5e46f141/WR_ChampionAbility_Leona_W.png',
    },
    e: {
      name: 'Zenith Blade',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/bltf7d44c26d0d5916f/5f7f7b9588d27e7f387b24d9/WR_ChampionAbility_Leona_E.png',
    },
    ultimate: {
      name: 'Solar Flare',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt8f1a9b7d49af9df3/5f7f7b9544d85a6a8c6751ec/WR_ChampionAbility_Leona_R.png',
    },
  },
  Lux: {
    passive: {
      name: 'Illumination',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt2c2b7b00ed2af1b5/5f7f7b956af6e65a3dbd44b3/WR_ChampionAbility_Lux_P.png',
    },
    q: {
      name: 'Light Binding',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt9d8ce56b3452afb8/5f7f7b957c5f4110cad8c773/WR_ChampionAbility_Lux_Q.png',
    },
    w: {
      name: 'Prismatic Barrier',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt9fbe27de23ed1e89/5f7f7b9588d27e7f387b24dd/WR_ChampionAbility_Lux_W.png',
    },
    e: {
      name: 'Lucent Singularity',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt53b07d11fba8187c/5f7f7b9533abc34bfa412a87/WR_ChampionAbility_Lux_E.png',
    },
    ultimate: {
      name: 'Final Spark',
      url: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt46eb9f88d8f5e67c/5f7f7b956af6e65a3dbd44b7/WR_ChampionAbility_Lux_R.png',
    },
  },
  // Add more champions as needed
};

/**
 * Check if a URL is valid (returns 200 status)
 */
async function isUrlValid(url: string): Promise<boolean> {
  try {
    // For contentstack.io URLs we need to use GET instead of HEAD
    // as HEAD requests may not be properly supported
    if (url.includes('contentstack.io')) {
      const response = await axios.get(url, {
        timeout: 5000,
        responseType: 'arraybuffer',
      });
      return response.status === 200;
    } else {
      const response = await axios.head(url, { timeout: 5000 });
      return response.status === 200;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Log file for tracking changes
 */
function setupLogFile() {
  const logDir = path.resolve(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const logPath = path.resolve(
    logDir,
    `champion-skill-fix-${new Date().toISOString().replace(/:/g, '-')}.log`,
  );
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });

  return {
    log: (message: string) => {
      console.log(message);
      logStream.write(message + '\n');
    },
    close: () => {
      logStream.end();
    },
  };
}

/**
 * Main function to find and fix champion skill URLs
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = setupLogFile();

  try {
    logger.log('Starting to fix champion skill names and image URLs...');

    // Get WrChampion model
    const wrChampionModel = app.get(getModelToken('WrChampion'));

    // Get all champions
    const champions = await wrChampionModel.find().lean();

    logger.log(`Found ${champions.length} total champions in the database.`);

    let totalFixed = 0;
    let totalBroken = 0;

    // Process each champion
    for (const champion of champions) {
      logger.log(`\nProcessing ${champion.name}...`);

      if (!champion.abilities) {
        logger.log(`  Champion ${champion.name} has no abilities defined.`);
        continue;
      }

      // Check if this champion has corrected data
      const hasCorrectData = correctChampionData[champion.name] !== undefined;

      if (!hasCorrectData) {
        logger.log(
          `  No correct data available for ${champion.name}, skipping.`,
        );
        continue;
      }

      const abilities = champion.abilities;
      let updated = false;
      let brokenUrls = 0;
      let fixedUrls = 0;

      // Process each ability
      for (const abilityKey of ['passive', 'q', 'w', 'e', 'ultimate']) {
        const ability = abilities[abilityKey];

        if (!ability) {
          logger.log(`  No ${abilityKey} ability for ${champion.name}`);
          continue;
        }

        // Check if the current URL is valid
        const currentUrl = ability.imageUrl;
        const isCurrentUrlValid = currentUrl
          ? await isUrlValid(currentUrl)
          : false;

        if (!isCurrentUrlValid) {
          brokenUrls++;
          totalBroken++;

          // Get the correct data
          const correctData = correctChampionData[champion.name][abilityKey];

          // Update the ability data
          const oldName = ability.name || 'Unknown';
          const oldUrl = ability.imageUrl || 'No URL';

          ability.name = correctData.name;
          ability.imageUrl = correctData.url;

          logger.log(`  Fixed ${abilityKey} for ${champion.name}:`);
          logger.log(`    Name: ${oldName} -> ${ability.name}`);
          logger.log(`    URL: ${oldUrl} -> ${ability.imageUrl}`);

          // Verify the new URL
          const isNewUrlValid = await isUrlValid(correctData.url);
          if (isNewUrlValid) {
            fixedUrls++;
            totalFixed++;
          } else {
            logger.log(`    Warning: New URL may not be valid.`);
          }

          updated = true;
        } else {
          logger.log(`  URL for ${abilityKey} is working: ${currentUrl}`);
        }
      }

      // Save changes if needed
      if (updated) {
        await wrChampionModel.updateOne({ _id: champion._id }, { abilities });
        logger.log(
          `  Updated abilities for ${champion.name}. Fixed ${fixedUrls}/${brokenUrls} URLs.`,
        );
      } else {
        logger.log(`  No updates needed for ${champion.name}`);
      }
    }

    logger.log(`\nDone! Fixed ${totalFixed}/${totalBroken} broken URLs.`);
  } catch (error) {
    logger.log(`Error: ${error.message}`);
    console.error(error);
  } finally {
    logger.close();
    await app.close();
  }
}

// Run the bootstrap function
bootstrap().catch((error) => console.error('Fatal error:', error));
