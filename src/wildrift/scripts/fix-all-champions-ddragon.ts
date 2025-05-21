import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Champions with specific name mappings from Wild Rift to PC LoL
const nameMapWildRiftToPC = {
  Akshan: 'Akshan',
  Ambessa: 'Ambessa',
  Amumu: 'Amumu',
  Ahri: 'Ahri',
  Aatrox: 'Aatrox',
  Alistar: 'Alistar',
  Ashe: 'Ashe',
  'Aurelion Sol': 'AurelionSol',
  Annie: 'Annie',
  Akali: 'Akali',
  Blitzcrank: 'Blitzcrank',
  Braum: 'Braum',
  Brand: 'Brand',
  Caitlyn: 'Caitlyn',
  Camille: 'Camille',
  Corki: 'Corki',
  Diana: 'Diana',
  'Dr. Mundo': 'DrMundo',
  Darius: 'Darius',
  Draven: 'Draven',
  Ekko: 'Ekko',
  Evelynn: 'Evelynn',
  Ezreal: 'Ezreal',
  Fiora: 'Fiora',
  Fizz: 'Fizz',
  Galio: 'Galio',
  Garen: 'Garen',
  Gragas: 'Gragas',
  Graves: 'Graves',
  Gwen: 'Gwen',
  Hecarim: 'Hecarim',
  Heimerdinger: 'Heimerdinger',
  Irelia: 'Irelia',
  Janna: 'Janna',
  'Jarvan IV': 'JarvanIV',
  Jax: 'Jax',
  Jayce: 'Jayce',
  Jhin: 'Jhin',
  Jinx: 'Jinx',
  "Kai'Sa": 'Kaisa',
  Karma: 'Karma',
  Kassadin: 'Kassadin',
  Katarina: 'Katarina',
  Kayle: 'Kayle',
  Kayn: 'Kayn',
  Kennen: 'Kennen',
  "Kha'Zix": 'Khazix',
  Leona: 'Leona',
  'Lee Sin': 'LeeSin',
  Lucian: 'Lucian',
  Lulu: 'Lulu',
  Lux: 'Lux',
  'Master Yi': 'MasterYi',
  Malphite: 'Malphite',
  'Miss Fortune': 'MissFortune',
  Morgana: 'Morgana',
  Nami: 'Nami',
  Nasus: 'Nasus',
  Nautilus: 'Nautilus',
  Nilah: 'Nilah',
  'Nunu & Willump': 'Nunu',
  Olaf: 'Olaf',
  Orianna: 'Orianna',
  Pantheon: 'Pantheon',
  Pyke: 'Pyke',
  Rammus: 'Rammus',
  Renekton: 'Renekton',
  Rengar: 'Rengar',
  Riven: 'Riven',
  Samira: 'Samira',
  Senna: 'Senna',
  Seraphine: 'Seraphine',
  Sett: 'Sett',
  Shen: 'Shen',
  Shyvana: 'Shyvana',
  Singed: 'Singed',
  Sion: 'Sion',
  Sona: 'Sona',
  Soraka: 'Soraka',
  Teemo: 'Teemo',
  Thresh: 'Thresh',
  Tristana: 'Tristana',
  Tryndamere: 'Tryndamere',
  'Twisted Fate': 'TwistedFate',
  Varus: 'Varus',
  Vayne: 'Vayne',
  Veigar: 'Veigar',
  Vi: 'Vi',
  Viego: 'Viego',
  Vladimir: 'Vladimir',
  Volibear: 'Volibear',
  Wukong: 'MonkeyKing',
  Xayah: 'Xayah',
  'Xin Zhao': 'XinZhao',
  Yasuo: 'Yasuo',
  Yone: 'Yone',
  Yuumi: 'Yuumi',
  Zed: 'Zed',
  Ziggs: 'Ziggs',
  Zoe: 'Zoe',
  Zyra: 'Zyra',
};

// Cache for DDragon data
const championDataCache = new Map();

/**
 * Set up logger for tracking changes
 */
function setupLogger() {
  const logDir = path.resolve(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  const logPath = path.resolve(
    logDir,
    `fix-all-champions-ddragon-${new Date().toISOString().replace(/:/g, '-')}.log`,
  );

  const logStream = fs.createWriteStream(logPath, { flags: 'a' });

  return {
    log: (message: string) => {
      console.log(message);
      logStream.write(message + '\\n');
    },
    close: () => {
      logStream.end();
    },
  };
}

/**
 * Get champion data from Data Dragon API
 */
async function getChampionDataFromDDragon(championName: string): Promise<any> {
  try {
    // If already cached, return from cache
    if (championDataCache.has(championName)) {
      return championDataCache.get(championName);
    }

    // Map Wild Rift name to PC LoL name if needed
    const pcName =
      nameMapWildRiftToPC[championName] ||
      championName.replace(/\\s+/g, '').replace(/[.']/g, '');

    // Get all champions first to validate if this champion exists
    const allChampionsResponse = await axios.get(
      'https://ddragon.leagueoflegends.com/cdn/14.11.1/data/en_US/champion.json',
    );
    const allChampions = allChampionsResponse.data.data;

    // Check if champion exists
    if (!allChampions[pcName]) {
      return null;
    }

    // Get detailed champion data
    const response = await axios.get(
      `https://ddragon.leagueoflegends.com/cdn/14.11.1/data/en_US/champion/${pcName}.json`,
    );
    const championData = response.data.data[pcName];

    // Cache the data
    championDataCache.set(championName, championData);

    return championData;
  } catch (error) {
    console.error(`Error fetching data for ${championName}:`, error.message);
    return null;
  }
}

/**
 * Map Wild Rift ability keys to Data Dragon ability keys
 */
function mapAbilityKeyToDDragon(abilityKey: string): string {
  const keyMap = {
    passive: 'passive',
    q: 'Q',
    w: 'W',
    e: 'E',
    ultimate: 'R',
  };

  return keyMap[abilityKey] || abilityKey;
}

/**
 * Generate Data Dragon URL for champion ability
 */
function generateAbilityImageUrl(
  championName: string,
  abilityKey: string,
  ddSpellId: string,
): string {
  const ddKey = mapAbilityKeyToDDragon(abilityKey);

  if (ddKey === 'passive') {
    return `https://ddragon.leagueoflegends.com/cdn/14.11.1/img/passive/${ddSpellId}`;
  } else {
    return `https://ddragon.leagueoflegends.com/cdn/14.11.1/img/spell/${ddSpellId}`;
  }
}

/**
 * Fix champion abilities using Data Dragon
 */
async function fixChampionAbilities(
  champion: any,
  logger: any,
  wrChampionModel: any,
): Promise<{ namesFixed: number; urlsFixed: number }> {
  const result = {
    namesFixed: 0,
    urlsFixed: 0,
  };

  if (!champion.abilities) {
    logger.log(`  Champion ${champion.name} has no abilities defined`);
    return result;
  }

  // Get champion data from Data Dragon
  const ddChampionData = await getChampionDataFromDDragon(champion.name);

  if (!ddChampionData) {
    logger.log(`  Could not find Data Dragon data for ${champion.name}`);
    return result;
  }

  let updated = false;

  // Extract spells and passive from Data Dragon
  const ddPassive = ddChampionData.passive;
  const ddSpells = ddChampionData.spells; // [Q, W, E, R]

  // Map ability keys
  const abilityKeys = ['passive', 'q', 'w', 'e', 'ultimate'];
  const ddKeys = ['passive', 'Q', 'W', 'E', 'R'];

  // Update each ability
  for (let i = 0; i < abilityKeys.length; i++) {
    const abilityKey = abilityKeys[i];
    const ddKey = ddKeys[i];

    // Skip if ability doesn't exist
    if (!champion.abilities[abilityKey]) {
      logger.log(`  No ${abilityKey} ability defined for ${champion.name}`);
      continue;
    }

    const ability = champion.abilities[abilityKey];

    // Get correct data from Data Dragon
    let ddAbilityData;
    let ddImageId;

    if (abilityKey === 'passive') {
      ddAbilityData = ddPassive;
      ddImageId = ddPassive?.image?.full;
    } else {
      const spellIndex = ['q', 'w', 'e', 'ultimate'].indexOf(abilityKey);
      if (spellIndex >= 0 && spellIndex < ddSpells.length) {
        ddAbilityData = ddSpells[spellIndex];
        ddImageId = ddSpells[spellIndex]?.image?.full;
      }
    }

    if (!ddAbilityData || !ddImageId) {
      logger.log(`  No Data Dragon data for ${champion.name} ${abilityKey}`);
      continue;
    }

    // Update name if different
    if (ddAbilityData.name && ability.name !== ddAbilityData.name) {
      logger.log(
        `  Fixing ${abilityKey} name: "${ability.name || 'Unknown'}" -> "${ddAbilityData.name}"`,
      );
      ability.name = ddAbilityData.name;
      result.namesFixed++;
      updated = true;
    }

    // Update image URL
    const newImageUrl = generateAbilityImageUrl(
      champion.name,
      abilityKey,
      ddImageId,
    );
    if (ability.imageUrl !== newImageUrl) {
      logger.log(
        `  Fixing ${abilityKey} image URL: ${ability.imageUrl || 'None'} -> ${newImageUrl}`,
      );
      ability.imageUrl = newImageUrl;
      result.urlsFixed++;
      updated = true;
    }
  }

  // Save changes if needed
  if (updated) {
    await wrChampionModel.updateOne(
      { _id: champion._id },
      { abilities: champion.abilities },
    );
    logger.log(
      `  Updated ${champion.name}: Fixed ${result.namesFixed} names and ${result.urlsFixed} URLs`,
    );
  } else {
    logger.log(`  No updates needed for ${champion.name}`);
  }

  return result;
}

/**
 * Main function
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const logger = setupLogger();

  try {
    logger.log('Starting to fix all champions using Data Dragon API...');

    // Get WrChampion model
    const wrChampionModel = app.get(getModelToken('WrChampion'));

    // Get all champions
    const champions = await wrChampionModel.find();

    logger.log(`Found ${champions.length} champions in database`);

    let totalChampionsFixed = 0;
    let totalNamesFixed = 0;
    let totalUrlsFixed = 0;

    // Process all champions
    for (const champion of champions) {
      logger.log(`\nProcessing ${champion.name}...`);

      const result = await fixChampionAbilities(
        champion,
        logger,
        wrChampionModel,
      );

      if (result.namesFixed > 0 || result.urlsFixed > 0) {
        totalChampionsFixed++;
        totalNamesFixed += result.namesFixed;
        totalUrlsFixed += result.urlsFixed;
      }
    }

    logger.log('\nDone! Summary:');
    logger.log(`Champions fixed: ${totalChampionsFixed}`);
    logger.log(`Names fixed: ${totalNamesFixed}`);
    logger.log(`URLs fixed: ${totalUrlsFixed}`);
  } catch (error) {
    logger.log(`Error: ${error.message}`);
    console.error(error);
  } finally {
    logger.close();
    await app.close();
  }
}

// Run the main function
bootstrap().catch((error) => console.error('Fatal error:', error));
