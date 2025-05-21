import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Dictionary of Champion to Abilities mappings
interface ChampionAbilities {
  [champion: string]: {
    passive: string;
    q: string;
    w: string;
    e: string;
    ultimate: string;
  };
}

// Define a dictionary of champion ability names
const correctAbilityNames: ChampionAbilities = {
  Aatrox: {
    passive: 'Deathbringer Stance',
    q: 'The Darkin Blade',
    w: 'Infernal Chains',
    e: 'Umbral Dash',
    ultimate: 'World Ender',
  },
  Akshan: {
    passive: 'Dirty Fighting',
    q: 'Avengerang',
    w: 'Going Rogue',
    e: 'Heroic Swing',
    ultimate: 'Comeuppance',
  },
  Alistar: {
    passive: 'Triumphant Roar',
    q: 'Pulverize',
    w: 'Headbutt',
    e: 'Trample',
    ultimate: 'Unbreakable Will',
  },
  Amumu: {
    passive: 'Cursed Touch',
    q: 'Bandage Toss',
    w: 'Despair',
    e: 'Tantrum',
    ultimate: 'Curse of the Sad Mummy',
  },
  Annie: {
    passive: 'Pyromania',
    q: 'Disintegrate',
    w: 'Incinerate',
    e: 'Molten Shield',
    ultimate: 'Summon: Tibbers',
  },
  Ashe: {
    passive: 'Frost Shot',
    q: "Ranger's Focus",
    w: 'Volley',
    e: 'Hawkshot',
    ultimate: 'Enchanted Crystal Arrow',
  },
  Garen: {
    passive: 'Perseverance',
    q: 'Decisive Strike',
    w: 'Courage',
    e: 'Judgment',
    ultimate: 'Demacian Justice',
  },
  Jax: {
    passive: 'Relentless Assault',
    q: 'Leap Strike',
    w: 'Empower',
    e: 'Counter Strike',
    ultimate: "Grandmaster's Might",
  },
  Leona: {
    passive: 'Sunlight',
    q: 'Shield of Daybreak',
    w: 'Eclipse',
    e: 'Zenith Blade',
    ultimate: 'Solar Flare',
  },
  Lux: {
    passive: 'Illumination',
    q: 'Light Binding',
    w: 'Prismatic Barrier',
    e: 'Lucent Singularity',
    ultimate: 'Final Spark',
  },
  Yasuo: {
    passive: 'Way of the Wanderer',
    q: 'Steel Tempest',
    w: 'Wind Wall',
    e: 'Sweeping Blade',
    ultimate: 'Last Breath',
  },
  Draven: {
    passive: 'League of Draven',
    q: 'Spinning Axe',
    w: 'Blood Rush',
    e: 'Stand Aside',
    ultimate: 'Whirling Death',
  },
  Fiora: {
    passive: "Duelist's Dance",
    q: 'Lunge',
    w: 'Riposte',
    e: 'Bladework',
    ultimate: 'Grand Challenge',
  },
};

/**
 * Generate mobafire URL for champion ability
 * @param championName The champion name
 * @param abilityName The ability name
 */
function generateMobafireUrl(
  championName: string,
  abilityName: string,
): string {
  // Normalize names for URL
  const normalizedChampName = championName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[.']/g, '');

  // Normalize ability name for URL format
  const normalizedAbilityName = abilityName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();

  return `https://www.mobafire.com/images/ability/${normalizedChampName}-${normalizedAbilityName}.png`;
}

/**
 * Check if a URL exists
 */
async function isUrlValid(url: string): Promise<boolean> {
  try {
    const response = await axios.head(url, { timeout: 3000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

/**
 * Setup logging
 */
function setupLogger() {
  const logDir = path.resolve(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const logPath = path.resolve(
    logDir,
    `mobafire-skill-fix-${new Date().toISOString().replace(/:/g, '-')}.log`,
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
 * Main function to fix champion abilities
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = setupLogger();

  try {
    logger.log(
      'Starting to fix champion skill names and URLs with mobafire.com...',
    );

    // Get WrChampion model
    const wrChampionModel = app.get(getModelToken('WrChampion'));

    // Get all champions
    const champions = await wrChampionModel.find().lean();

    logger.log(`Found ${champions.length} total champions in the database.`);

    let totalFixed = 0;
    let totalBroken = 0;
    let championsFixed = 0;

    // Process each champion
    for (const champion of champions) {
      logger.log(`\nProcessing ${champion.name}...`);

      // Skip champions with no abilities
      if (!champion.abilities) {
        logger.log(`  Champion ${champion.name} has no abilities defined.`);
        continue;
      }

      // Skip champions not in our dictionary
      if (!correctAbilityNames[champion.name]) {
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

        // Get the correct ability name
        const correctName = correctAbilityNames[champion.name][abilityKey];

        // If the name is already correct and URL is working, skip
        if (ability.name === correctName && ability.imageUrl) {
          const isCurrentUrlValid = await isUrlValid(ability.imageUrl);
          if (isCurrentUrlValid) {
            logger.log(
              `  ${abilityKey} is already correct and URL is working: ${ability.imageUrl}`,
            );
            continue;
          }
        }

        // In all other cases (name wrong or URL not working), update both
        const oldName = ability.name || 'Unknown';
        const oldUrl = ability.imageUrl || 'No URL';

        // Update name
        ability.name = correctName;

        // Generate and set new URL
        const newUrl = generateMobafireUrl(champion.name, correctName);

        // Verify if the URL exists
        const isNewUrlValid = await isUrlValid(newUrl);

        if (isNewUrlValid) {
          ability.imageUrl = newUrl;
          fixedUrls++;
          logger.log(`  Fixed ${abilityKey} for ${champion.name}:`);
          logger.log(`    Name: ${oldName} -> ${correctName}`);
          logger.log(`    URL: ${oldUrl} -> ${newUrl}`);
        } else {
          brokenUrls++;
          totalBroken++;
          logger.log(`  Could not fix ${abilityKey} for ${champion.name}:`);
          logger.log(`    Name updated: ${oldName} -> ${correctName}`);
          logger.log(`    URL is not valid: ${newUrl}`);
        }

        updated = true;
      }

      // Save the changes if anything was updated
      if (updated) {
        await wrChampionModel.updateOne({ _id: champion._id }, { abilities });
        championsFixed++;
        totalFixed += fixedUrls;
        logger.log(
          `  Updated abilities for ${champion.name}. Fixed ${fixedUrls}/${brokenUrls + fixedUrls} URLs.`,
        );
      } else {
        logger.log(`  No updates needed for ${champion.name}`);
      }
    }

    logger.log(
      `\nDone! Fixed ${totalFixed} URLs across ${championsFixed} champions.`,
    );
    logger.log(`${totalBroken} URLs could not be fixed.`);
  } catch (error) {
    logger.log(`Error: ${error.message}`);
    console.error(error);
  } finally {
    logger.close();
    await app.close();
  }
}

// Run the script
bootstrap().catch((error) => console.error('Fatal error:', error));
