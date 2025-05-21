import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Define champion ability data structure
interface ChampionAbilities {
  [champion: string]: {
    passive: string;
    q: string;
    w: string;
    e: string;
    ultimate: string;
  };
}

// Define URL sources
enum UrlSource {
  CONTENTSTACK = 'contentstack',
  MOBAFIRE = 'mobafire',
  DDRAGON = 'ddragon',
}

// Comprehensive dictionary of correct ability names
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
  Draven: {
    passive: 'League of Draven',
    q: 'Spinning Axe',
    w: 'Blood Rush',
    e: 'Stand Aside',
    ultimate: 'Whirling Death',
  },
  Yasuo: {
    passive: 'Way of the Wanderer',
    q: 'Steel Tempest',
    w: 'Wind Wall',
    e: 'Sweeping Blade',
    ultimate: 'Last Breath',
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
  Fiora: {
    passive: "Duelist's Dance",
    q: 'Lunge',
    w: 'Riposte',
    e: 'Bladework',
    ultimate: 'Grand Challenge',
  },
  Ahri: {
    passive: 'Essence Theft',
    q: 'Orb of Deception',
    w: 'Fox-Fire',
    e: 'Charm',
    ultimate: 'Spirit Rush',
  },
  Akali: {
    passive: "Assassin's Mark",
    q: 'Five Point Strike',
    w: 'Twilight Shroud',
    e: 'Shuriken Flip',
    ultimate: 'Perfect Execution',
  },
  Darius: {
    passive: 'Hemorrhage',
    q: 'Decimate',
    w: 'Crippling Strike',
    e: 'Apprehend',
    ultimate: 'Noxian Guillotine',
  },
  Ezreal: {
    passive: 'Rising Spell Force',
    q: 'Mystic Shot',
    w: 'Essence Flux',
    e: 'Arcane Shift',
    ultimate: 'Trueshot Barrage',
  },
  Irelia: {
    passive: 'Ionian Fervor',
    q: 'Bladesurge',
    w: 'Defiant Dance',
    e: 'Flawless Duet',
    ultimate: "Vanguard's Edge",
  },
  Jinx: {
    passive: 'Get Excited!',
    q: 'Switcheroo!',
    w: 'Zap!',
    e: 'Flame Chompers!',
    ultimate: 'Super Mega Death Rocket!',
  },
  Katarina: {
    passive: 'Voracity',
    q: 'Bouncing Blade',
    w: 'Preparation',
    e: 'Shunpo',
    ultimate: 'Death Lotus',
  },
  LeeSin: {
    passive: 'Flurry',
    q: 'Sonic Wave / Resonating Strike',
    w: 'Safeguard / Iron Will',
    e: 'Tempest / Cripple',
    ultimate: "Dragon's Rage",
  },
  // Add more champions as needed
};

// Contentstack direct URLs for critical champions
const contentstackUrls = {
  Aatrox: {
    passive:
      'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt5e6165f11e1cdc95/638e5c065c935f338cbe099a/WR_GOS10_Aatrox_P.png',
    q: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt5a5e9ce6c16d8fa7/638e5c06c781b6637dee5d41/WR_GOS10_Aatrox_Q.png',
    w: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/bltd1a4ec75a6bb6e10/638e5c06bc3feb38d92addf0/WR_GOS10_Aatrox_W.png',
    e: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt4c0c9c0d464f86dd/638e5c06bc3feb38d92addf4/WR_GOS10_Aatrox_E.png',
    ultimate:
      'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt3c6a7cbe57beae8c/638e5c06c781b6637dee5d3d/WR_GOS10_Aatrox_R.png',
  },
  Yasuo: {
    passive:
      'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt68c1352b9e7f2dba/5f7f7bac70f9b644bb38b72a/WR_ChampionAbility_Yasuo_P.png',
    q: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/bltcb94d933e353b936/5f7f7bac85a641112d27ba19/WR_ChampionAbility_Yasuo_Q.png',
    w: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/bltff7ad60a1f04f6fd/5f7f7baceec33c79b2557058/WR_ChampionAbility_Yasuo_W.png',
    e: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt4e3c6e108908e41b/5f7f7bac85a641112d27ba1d/WR_ChampionAbility_Yasuo_E.png',
    ultimate:
      'https://images.contentstack.io/v3/assets/blt370612131b6e0756/bltba8d9226d67f3439/5f7f7baceec33c79b255705c/WR_ChampionAbility_Yasuo_R.png',
  },
  Draven: {
    passive:
      'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt24bd24c23bee1f75/5f7f7b8d7c5f4110cad8c767/WR_ChampionAbility_Draven_P.png',
    q: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blta89e3c9e8f24af3c/5f7f7b8c1972331def341f28/WR_ChampionAbility_Draven_Q.png',
    w: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt83ef545f5d9f2c2b/5f7f7b8d33abc34bfa412a83/WR_ChampionAbility_Draven_W.png',
    e: 'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt40c2957a87a35f5c/5f7f7b8d8fbce31c5e46f139/WR_ChampionAbility_Draven_E.png',
    ultimate:
      'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blt2507e5e80d69e4b7/5f7f7b8d197233eeaa388c4f/WR_ChampionAbility_Draven_R.png',
  },
};

/**
 * Generate Mobafire URL for champion ability
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
 * Generate Data Dragon URL for champion ability
 */
function generateDDragonUrl(championName: string, abilityKey: string): string {
  // Normalize champion name for Data Dragon format
  const normalizedName = championName
    .toLowerCase()
    .replace(/\s/g, '') // Remove spaces
    .replace(/'/g, '') // Remove apostrophes
    .replace(/\./g, '') // Remove periods
    .trim();

  // Map ability keys to Data Dragon format
  const keyMap: { [key: string]: string } = {
    passive: 'passive',
    q: 'q',
    w: 'w',
    e: 'e',
    ultimate: 'r',
  };

  const ddKey = keyMap[abilityKey] || abilityKey;

  return `https://ddragon.leagueoflegends.com/cdn/14.11.1/img/spell/${normalizedName}${ddKey.toUpperCase()}.png`;
}

/**
 * Check if a URL is valid (returns 200 status)
 */
async function isUrlValid(url: string): Promise<boolean> {
  try {
    // For contentstack.io URLs we need to use GET instead of HEAD
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
 * Try all URL generation methods and return the first valid URL
 */
async function findWorkingUrl(
  championName: string,
  abilityKey: string,
  abilityName: string,
): Promise<{ url: string; source: UrlSource } | null> {
  // Try contentstack direct URLs first for specific champions
  if (
    contentstackUrls[championName] &&
    contentstackUrls[championName][abilityKey]
  ) {
    const url = contentstackUrls[championName][abilityKey];
    const isValid = await isUrlValid(url);
    if (isValid) {
      return { url, source: UrlSource.CONTENTSTACK };
    }
  }

  // Try mobafire URL next
  const mobafireUrl = generateMobafireUrl(championName, abilityName);
  const isMobafireValid = await isUrlValid(mobafireUrl);
  if (isMobafireValid) {
    return { url: mobafireUrl, source: UrlSource.MOBAFIRE };
  }

  // Try Data Dragon URL last
  const ddragonUrl = generateDDragonUrl(championName, abilityKey);
  const isDDragonValid = await isUrlValid(ddragonUrl);
  if (isDDragonValid) {
    return { url: ddragonUrl, source: UrlSource.DDRAGON };
  }

  return null;
}

/**
 * Setup logger for tracking changes
 */
function setupLogger() {
  const logDir = path.resolve(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const logPath = path.resolve(
    logDir,
    `champion-ability-fix-${new Date().toISOString().replace(/:/g, '-')}.log`,
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
 * Main function to fix champion skill names and URLs
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = setupLogger();

  try {
    logger.log(
      'Starting comprehensive check of champion ability names and image URLs...',
    );

    // Get WrChampion model
    const wrChampionModel = app.get(getModelToken('WrChampion'));

    // Get all champions
    const champions = await wrChampionModel.find().lean();

    logger.log(`Found ${champions.length} total champions in the database.`);

    let totalNameFixed = 0;
    let totalUrlFixed = 0;
    let totalBroken = 0;
    let championsFixed = 0;

    // Process each champion
    for (const champion of champions) {
      logger.log(`\nProcessing ${champion.name}...`);

      if (!champion.abilities) {
        logger.log(`  Champion ${champion.name} has no abilities defined.`);
        continue;
      }

      const abilities = champion.abilities;
      let updated = false;
      let namesFixed = 0;
      let urlsFixed = 0;

      // Process each ability
      for (const abilityKey of ['passive', 'q', 'w', 'e', 'ultimate']) {
        const ability = abilities[abilityKey];

        if (!ability) {
          logger.log(`  No ${abilityKey} ability for ${champion.name}`);
          continue;
        }

        // Step 1: Check if we have correct name data for this champion
        const hasCorrectNameData =
          correctAbilityNames[champion.name] !== undefined;

        // Step 2: Check current URL validity
        const currentUrl = ability.imageUrl;
        const isCurrentUrlValid = currentUrl
          ? await isUrlValid(currentUrl)
          : false;

        // Step 3: If URL is valid, we can skip
        if (isCurrentUrlValid) {
          logger.log(`  ${abilityKey} URL is working: ${currentUrl}`);
          continue;
        }

        // Step 4: URL is not valid, we need to fix it
        logger.log(`  ${abilityKey} URL is broken: ${currentUrl || 'No URL'}`);
        totalBroken++;

        // Step 5: If we have correct name data, update the name
        let abilityName = ability.name;
        if (hasCorrectNameData) {
          const correctName = correctAbilityNames[champion.name][abilityKey];
          // Step 5.1: If name is different, update it
          if (ability.name !== correctName) {
            logger.log(
              `    Fixing name: "${ability.name || 'Unknown'}" -> "${correctName}"`,
            );
            ability.name = correctName;
            abilityName = correctName;
            namesFixed++;
            totalNameFixed++;
          }
        }

        // Step 6: Try to find a working URL using all methods
        const workingUrlData = await findWorkingUrl(
          champion.name,
          abilityKey,
          abilityName,
        );

        if (workingUrlData) {
          logger.log(
            `    Found working URL from ${workingUrlData.source}: ${workingUrlData.url}`,
          );
          ability.imageUrl = workingUrlData.url;
          urlsFixed++;
          totalUrlFixed++;
        } else {
          logger.log(
            `    Could not find working URL for ${champion.name} ${abilityKey}`,
          );
        }

        updated = true;
      }

      // Save changes if needed
      if (updated) {
        await wrChampionModel.updateOne({ _id: champion._id }, { abilities });
        championsFixed++;
        logger.log(
          `  Updated ${champion.name}: Fixed ${namesFixed} names and ${urlsFixed} URLs`,
        );
      } else {
        logger.log(`  No updates needed for ${champion.name}`);
      }
    }

    logger.log(`\nDone! Summary:`);
    logger.log(`Champions fixed: ${championsFixed}`);
    logger.log(`Names fixed: ${totalNameFixed}`);
    logger.log(`URLs fixed: ${totalUrlFixed}`);
    logger.log(`URLs still broken: ${totalBroken - totalUrlFixed}`);
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
