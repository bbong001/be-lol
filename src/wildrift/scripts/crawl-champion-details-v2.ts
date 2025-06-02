import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { WildriftService } from '../wildrift.service';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { getModelToken } from '@nestjs/mongoose';
import * as fs from 'fs';
import * as path from 'path';

interface ChampionAbility {
  name: string;
  description: string;
  imageUrl: string;
  cooldown?: number[];
  cost?: number[];
}

interface ChampionStats {
  health: number;
  healthPerLevel?: number;
  mana?: number;
  manaPerLevel?: number;
  armor: number;
  armorPerLevel?: number;
  magicResist: number;
  magicResistPerLevel?: number;
  attackDamage: number;
  attackDamagePerLevel?: number;
  attackSpeed: number;
  attackSpeedPerLevel?: number;
  moveSpeed: number;
}

interface SkillOrder {
  // Array of 15 strings representing the skill leveling sequence
  // e.g. ['q', 'e', 'w', 'q', 'q', 'r', 'q', 'e', 'q', 'e', 'r', 'e', 'e', 'w', 'w']
  sequence: string[];

  // Array of skill keys in priority order (which to max first)
  // e.g. ['q', 'e', 'w']
  priority: string[];
}

interface ChampionDetail {
  name: string;
  title: string;
  description: string;
  roles: string[];
  abilities: {
    passive: ChampionAbility;
    q: ChampionAbility;
    w: ChampionAbility;
    e: ChampionAbility;
    ultimate: ChampionAbility;
  };
  stats: ChampionStats;
  recommendedItems: string[];
  imageUrl: string;
  splashUrl: string;
  patch: string;
  skillOrder: SkillOrder;
}

/**
 * Save HTML to file for debugging purposes
 */
function saveHtmlForDebug(html: string, championName: string) {
  const debugDir = path.resolve(process.cwd(), 'debug');
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir);
  }
  const filePath = path.resolve(debugDir, `${championName.toLowerCase()}.html`);
  fs.writeFileSync(filePath, html);
  console.log(`Saved HTML to ${filePath} for debugging`);
}

/**
 * Get ability image URL from mobafire.com
 * This is a fallback for when wildriftfire doesn't have proper images
 */
async function getMobafireAbilityImages(championName: string) {
  try {
    const formattedName = championName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[.']/g, '');
    const url = `https://www.mobafire.com/wild-rift/champion/${formattedName}`;

    console.log(`Fetching ability images from ${url}`);

    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const abilityImages = {
      passive: '',
      q: '',
      w: '',
      e: '',
      r: '',
    };

    // Try to find images in the skills order section
    $('.skills-mod__abilities__row').each((i, el) => {
      const img = $(el).find('img').first();
      const imgSrc = img.attr('src') || '';

      if (i === 0 && imgSrc.includes('passive')) {
        abilityImages.passive = imgSrc;
      } else if (i === 1) {
        abilityImages.q = imgSrc;
      } else if (i === 2) {
        abilityImages.w = imgSrc;
      } else if (i === 3) {
        abilityImages.e = imgSrc;
      } else if (i === 4) {
        abilityImages.r = imgSrc;
      }
    });

    // If some images are still missing, try the alternative method with ability names
    if (
      !abilityImages.passive ||
      !abilityImages.q ||
      !abilityImages.w ||
      !abilityImages.e ||
      !abilityImages.r
    ) {
      // Generate URLs based on pattern
      const baseUrl = 'https://www.mobafire.com/images/ability';

      if (!abilityImages.passive) {
        abilityImages.passive = `${baseUrl}/${formattedName}-deathbringer-stance.png`;
      }
      if (!abilityImages.q) {
        abilityImages.q = `${baseUrl}/${formattedName}-the-darkin-blade.png`;
      }
      if (!abilityImages.w) {
        abilityImages.w = `${baseUrl}/${formattedName}-infernal-chains.png`;
      }
      if (!abilityImages.e) {
        abilityImages.e = `${baseUrl}/${formattedName}-umbral-dash.png`;
      }
      if (!abilityImages.r) {
        abilityImages.r = `${baseUrl}/${formattedName}-world-ender.png`;
      }
    }

    console.log(`Found Mobafire ability images for ${championName}`);
    return abilityImages;
  } catch (error) {
    console.error(`Error fetching Mobafire ability images: ${error.message}`);
    return {
      passive: '',
      q: '',
      w: '',
      e: '',
      r: '',
    };
  }
}

/**
 * Extract skill order from the champion page
 */
function extractSkillOrder($: cheerio.CheerioAPI): SkillOrder {
  // Default skill order if we can't extract it
  const defaultSkillOrder: SkillOrder = {
    sequence: Array(15).fill(''),
    priority: ['q', 'e', 'w'],
  };

  try {
    // Initialize the skill sequence array with 15 empty strings
    const sequence: string[] = Array(15).fill('');

    // Extract skill leveling sequence by checking which levels have the "lit" class
    // We need to track which row maps to which ability (q, w, e, r)
    const skillRows = $('.skills-mod__abilities__row').toArray();

    // Skip the passive (first row) if it exists
    const startIndex = $(skillRows[0]).hasClass(
      'skills-mod__abilities__row--passive',
    )
      ? 1
      : 0;

    // Map row indices to ability keys
    const rowToAbility: Record<number, string> = {};
    for (let i = startIndex; i < skillRows.length; i++) {
      const row = skillRows[i];
      const abilityName = $(row)
        .find('span')
        .first()
        .text()
        .trim()
        .toLowerCase();

      if (abilityName.includes('darkin blade')) {
        rowToAbility[i] = 'q';
      } else if (abilityName.includes('infernal chains')) {
        rowToAbility[i] = 'w';
      } else if (abilityName.includes('umbral dash')) {
        rowToAbility[i] = 'e';
      } else if (abilityName.includes('world ender')) {
        rowToAbility[i] = 'r';
      }
    }

    // For each row, find which levels are lit
    for (let i = startIndex; i < skillRows.length; i++) {
      const row = skillRows[i];
      const ability = rowToAbility[i];

      if (!ability) continue;

      // Find all lit level indicators in this row
      $(row)
        .find('li[level]')
        .each((_, levelEl) => {
          const level = parseInt($(levelEl).attr('level') || '0', 10);
          const isLit = $(levelEl).hasClass('lit');

          if (isLit && level > 0 && level <= 15) {
            // Champion levels are 1-indexed but array is 0-indexed
            sequence[level - 1] = ability;
          }
        });
    }

    // Extract the priority order from the quick skill order section
    const priority: string[] = [];

    $('.skills-mod__quick__order .ico-holder').each((_, el) => {
      const imgSrc = $(el).find('img').attr('src') || '';

      if (imgSrc.includes('darkin-blade')) {
        priority.push('q');
      } else if (imgSrc.includes('infernal-chains')) {
        priority.push('w');
      } else if (imgSrc.includes('umbral-dash')) {
        priority.push('e');
      } else if (imgSrc.includes('world-ender')) {
        priority.push('r');
      }
    });

    // If we couldn't extract the priority order, use a default one
    if (priority.length === 0) {
      // Check if we have a "Quick Skill Order" text with ability names
      const quickSkillText = $('.skills-mod__quick').text().trim();

      if (quickSkillText.includes('The Darkin Blade')) priority.push('q');
      if (quickSkillText.includes('Umbral Dash')) priority.push('e');
      if (quickSkillText.includes('Infernal Chains')) priority.push('w');
    }

    // Fill in any missing slots in the sequence with our best guess based on priority
    for (let i = 0; i < sequence.length; i++) {
      if (!sequence[i]) {
        // For levels 5, 9, and 13, typically ultimate is taken
        if (i + 1 === 5 || i + 1 === 9 || i + 1 === 13) {
          sequence[i] = 'r';
        } else {
          // Otherwise follow the priority order for empty slots
          for (const ability of priority) {
            if (ability !== 'r') {
              sequence[i] = ability;
              break;
            }
          }
        }
      }
    }

    return {
      sequence,
      priority: priority.length > 0 ? priority : defaultSkillOrder.priority,
    };
  } catch (error) {
    console.error(`Error extracting skill order: ${error.message}`);
    return defaultSkillOrder;
  }
}

async function crawlChampionDetails(
  championUrl = 'https://www.wildriftfire.com/guide/aatrox',
) {
  try {
    console.log(`Crawling champion details from ${championUrl}...`);

    const response = await axios.get(championUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    // Save HTML for debugging
    const championNameFromUrl = championUrl.split('/').pop() || 'unknown';
    saveHtmlForDebug(html, championNameFromUrl);

    // Extract champion name and title
    let championName = $('h1.wf-page-header__champion-name').text().trim();
    if (!championName) {
      championName = $('.wf-page-header__champion-name').text().trim();
    }
    if (!championName) {
      // Extract from URL if not found in HTML
      championName =
        championUrl
          .split('/')
          .pop()
          ?.split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ') || 'Unknown Champion';
    }

    const championTitle = $('.wf-page-header__champion-title').text().trim();

    console.log(`Crawling details for ${championName} - ${championTitle}`);

    // Fetch Mobafire ability images as backup
    const mobafireImages = await getMobafireAbilityImages(championName);

    // Extract roles
    const roles: string[] = [];
    $('.wf-page-header__champion-roles span').each((i, el) => {
      const role = $(el).text().trim();
      if (role) roles.push(role);
    });

    // If no roles found via spans, try direct text
    if (roles.length === 0) {
      const rolesText = $('.wf-page-header__champion-roles').text().trim();
      if (rolesText) {
        rolesText.split(/[,\/]/).forEach((role) => {
          const trimmedRole = role.trim();
          if (trimmedRole) roles.push(trimmedRole);
        });
      }
    }

    // If still no roles, try to infer from other content
    if (roles.length === 0) {
      if (html.includes('Baron Lane') || html.includes('Solo Lane')) {
        roles.push('Baron Lane');
      }
      if (html.includes('Jungle')) {
        roles.push('Jungle');
      }
      if (html.includes('Mid Lane')) {
        roles.push('Mid Lane');
      }
      if (html.includes('Dragon Lane') || html.includes('ADC')) {
        roles.push('Dragon Lane');
      }
      if (html.includes('Support')) {
        roles.push('Support');
      }
    }

    // Default role if none found
    if (roles.length === 0) {
      roles.push('Unknown Role');
    }

    // Extract champion description
    let description = $('.wf-champion-lore').text().trim();
    if (!description) {
      description =
        $('.wf-champion-description').text().trim() ||
        'No description available';
    }

    // Extract stats
    const stats: ChampionStats = {
      health: 0,
      armor: 0,
      magicResist: 0,
      attackDamage: 0,
      attackSpeed: 0,
      moveSpeed: 0,
    };

    // Try different selectors for stats
    $('.wf-champion-stats .wf-stat').each((i, el) => {
      const statName = $(el).find('.wf-stat__name').text().trim();
      const statValue = $(el).find('.wf-stat__value').text().trim();

      if (statName && statValue) {
        const numValue = parseFloat(statValue);

        if (statName.includes('Health') && !statName.includes('Regen')) {
          stats.health = numValue || 0;
        } else if (statName.includes('Armor')) {
          stats.armor = numValue || 0;
        } else if (
          statName.includes('Magic Resist') ||
          statName.includes('MR')
        ) {
          stats.magicResist = numValue || 0;
        } else if (
          statName.includes('Attack Damage') ||
          statName.includes('AD')
        ) {
          stats.attackDamage = numValue || 0;
        } else if (
          statName.includes('Attack Speed') ||
          statName.includes('AS')
        ) {
          stats.attackSpeed = numValue || 0;
        } else if (statName.includes('Move Speed') || statName.includes('MS')) {
          stats.moveSpeed = numValue || 0;
        } else if (statName.includes('Mana') && !statName.includes('Regen')) {
          stats.mana = numValue || 0;
        }
      }
    });

    // Try alternative stats layout
    if (stats.health === 0) {
      $('.wf-champion-stats div').each((i, el) => {
        const text = $(el).text().trim();
        if (!text.includes(':')) return;

        const [statName, statValue] = text.split(':').map((s) => s.trim());
        const numValue = parseFloat(statValue);

        if (statName.includes('Health') && !statName.includes('Regen')) {
          stats.health = numValue || 630;
        } else if (statName.includes('Armor')) {
          stats.armor = numValue || 36;
        } else if (
          statName.includes('Magic Resist') ||
          statName.includes('MR')
        ) {
          stats.magicResist = numValue || 32;
        } else if (
          statName.includes('Attack Damage') ||
          statName.includes('AD')
        ) {
          stats.attackDamage = numValue || 60;
        } else if (
          statName.includes('Attack Speed') ||
          statName.includes('AS')
        ) {
          stats.attackSpeed = numValue || 0.7;
        } else if (statName.includes('Move Speed') || statName.includes('MS')) {
          stats.moveSpeed = numValue || 340;
        } else if (statName.includes('Mana') && !statName.includes('Regen')) {
          stats.mana = numValue || 0;
        }
      });
    }

    // Extract abilities
    const abilities = {
      passive: extractAbility(
        $,
        html,
        'passive',
        championName,
        mobafireImages.passive,
      ),
      q: extractAbility($, html, 'q', championName, mobafireImages.q),
      w: extractAbility($, html, 'w', championName, mobafireImages.w),
      e: extractAbility($, html, 'e', championName, mobafireImages.e),
      ultimate: extractAbility($, html, 'r', championName, mobafireImages.r),
    };

    // Extract champion images
    let imageUrl = $('.wf-page-header__champion-avatar img').attr('src') || '';
    if (!imageUrl) {
      imageUrl = $('.wf-guide__header img').attr('src') || '';
    }

    let splashUrl = $('.wf-page-header__champion-splash img').attr('src') || '';
    if (!splashUrl) {
      splashUrl = imageUrl;
    }

    // Extract recommended items
    const recommendedItems: string[] = [];
    $('.wf-item__name').each((i, el) => {
      const itemName = $(el).text().trim();
      if (itemName && !recommendedItems.includes(itemName)) {
        recommendedItems.push(itemName);
      }
    });

    // Extract current patch
    let patch = $('.wf-page-header__patch').text().trim();
    if (!patch) {
      patch = '14.0.0'; // Default patch if not found
    }

    // Extract skill order
    const skillOrder = extractSkillOrder($);

    return {
      name: championName,
      title: championTitle,
      description,
      roles,
      abilities,
      stats,
      recommendedItems,
      imageUrl,
      splashUrl,
      patch,
      skillOrder,
    };
  } catch (error) {
    console.error(`Error crawling champion details: ${error.message}`);
    return null;
  }
}

function extractAbility(
  $: cheerio.CheerioAPI,
  html: string,
  abilityKey: string,
  championName: string,
  mobafireImageUrl = '',
): ChampionAbility {
  // Default values in case extraction fails
  const defaultAbilities: Record<string, ChampionAbility> = {
    passive: {
      name: 'Unknown Passive',
      description: 'No description available',
      imageUrl: '',
    },
    q: {
      name: 'Unknown Q Ability',
      description: 'No description available',
      imageUrl: '',
      cooldown: [0],
      cost: [0],
    },
    w: {
      name: 'Unknown W Ability',
      description: 'No description available',
      imageUrl: '',
      cooldown: [0],
      cost: [0],
    },
    e: {
      name: 'Unknown E Ability',
      description: 'No description available',
      imageUrl: '',
      cooldown: [0],
      cost: [0],
    },
    r: {
      name: 'Unknown Ultimate',
      description: 'No description available',
      imageUrl: '',
      cooldown: [0],
      cost: [0],
    },
  };

  // For Aatrox, set default abilities (for fallback)
  if (championName === 'Aatrox') {
    defaultAbilities.passive = {
      name: 'Deathbringer Stance',
      description:
        "Aatrox periodically empowers his next attack to deal bonus damage and heal him based on the target's max health.",
      imageUrl:
        'https://www.mobafire.com/images/ability/aatrox-deathbringer-stance.png',
    };
    defaultAbilities.q = {
      name: 'The Darkin Blade',
      description:
        'Aatrox slams his greatsword, dealing damage. He can cast this ability two more times, each one hitting a different area.',
      imageUrl:
        'https://www.mobafire.com/images/ability/aatrox-the-darkin-blade.png',
      cooldown: [14, 12, 10, 8],
      cost: [0, 0, 0, 0],
    };
    defaultAbilities.w = {
      name: 'Infernal Chains',
      description:
        "Aatrox smashes the ground, dealing damage and slowing the first enemy hit. Champions and large monsters have to leave the impact area quickly or they're dragged back to the center.",
      imageUrl:
        'https://www.mobafire.com/images/ability/aatrox-infernal-chains.png',
      cooldown: [14, 13, 12, 11],
      cost: [0, 0, 0, 0],
    };
    defaultAbilities.e = {
      name: 'Umbral Dash',
      description:
        'Aatrox dashes in the target direction, gaining attack damage. This ability can store up to 2 charges.',
      imageUrl:
        'https://www.mobafire.com/images/ability/aatrox-umbral-dash.png',
      cooldown: [9, 8, 7, 6],
      cost: [0, 0, 0, 0],
    };
    defaultAbilities.r = {
      name: 'World Ender',
      description:
        'Aatrox unleashes his demonic form, gaining attack damage, increased healing, and movement speed. This effect refreshes on takedown.',
      imageUrl:
        'https://www.mobafire.com/images/ability/aatrox-world-ender.png',
      cooldown: [120, 100, 80],
      cost: [0, 0, 0],
    };
  }

  try {
    let name = '';
    let description = '';
    let imageUrl = '';
    let cooldown: number[] = [];
    let cost: number[] = [];

    // Find the ability section based on key
    const abilityKeyUpper = abilityKey.toUpperCase();
    const isPassive = abilityKey === 'passive';

    // Try different selectors based on the website structure
    const abilitySection = isPassive
      ? $('.wf-ability[data-ability="passive"]')
      : $(`.wf-ability[data-ability="${abilityKeyUpper}"]`);

    if (abilitySection.length > 0) {
      name = abilitySection.find('.wf-ability__name').text().trim();
      description = abilitySection
        .find('.wf-ability__description')
        .text()
        .trim();
      imageUrl = abilitySection.find('img').attr('src') || '';

      // Extract cooldown and costs if not passive
      if (!isPassive) {
        const cooldownText = abilitySection
          .find('.wf-ability__cooldown')
          .text()
          .trim();
        if (cooldownText) {
          cooldown = cooldownText
            .split('/')
            .map((cd) => parseFloat(cd.trim()))
            .filter((cd) => !isNaN(cd));
        }

        const costText = abilitySection.find('.wf-ability__cost').text().trim();
        if (costText) {
          cost = costText
            .split('/')
            .map((c) => parseFloat(c.trim()))
            .filter((c) => !isNaN(c));
        }
      }
    }

    // Try alternative selectors if the above didn't work
    if (!name) {
      // Try finding by class name pattern
      const alternativeSection = $(
        `.ability-${abilityKey}, .${abilityKey}-ability, .ability[data-key="${abilityKey}"]`,
      );

      if (alternativeSection.length > 0) {
        name = alternativeSection.find('.ability-name, .name').text().trim();
        description = alternativeSection
          .find('.ability-description, .description')
          .text()
          .trim();
        imageUrl = alternativeSection.find('img').attr('src') || '';

        if (!isPassive) {
          const cooldownText = alternativeSection
            .find('.cooldown, .cd')
            .text()
            .trim();
          if (cooldownText) {
            cooldown = cooldownText
              .split(/[\/\s]/)
              .map((cd) => parseFloat(cd.trim()))
              .filter((cd) => !isNaN(cd));
          }

          const costText = alternativeSection
            .find('.cost, .mana-cost')
            .text()
            .trim();
          if (costText) {
            cost = costText
              .split(/[\/\s]/)
              .map((c) => parseFloat(c.trim()))
              .filter((c) => !isNaN(c));
          }
        }
      }
    }

    // If image URL is still empty, use the mobafire image URL if provided
    if (!imageUrl && mobafireImageUrl) {
      imageUrl = mobafireImageUrl;
    }

    // Return available data or fall back to defaults
    return {
      name: name || defaultAbilities[abilityKey].name,
      description: description || defaultAbilities[abilityKey].description,
      imageUrl:
        imageUrl || mobafireImageUrl || defaultAbilities[abilityKey].imageUrl,
      ...(isPassive
        ? {}
        : {
            cooldown:
              cooldown.length > 0
                ? cooldown
                : defaultAbilities[abilityKey].cooldown,
            cost: cost.length > 0 ? cost : defaultAbilities[abilityKey].cost,
          }),
    };
  } catch (error) {
    console.error(`Error extracting ${abilityKey} ability: ${error.message}`);
    return defaultAbilities[abilityKey];
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('Starting to crawl Wild Rift champion details...');

    // Get the services and models
    const wildriftService = app.get(WildriftService);
    const championModel = app.get(getModelToken('WrChampion'));

    // Check if a specific champion was provided as command line argument
    const specificChampion = process.argv[2];

    if (specificChampion) {
      console.log(`Crawling specific champion: ${specificChampion}`);

      const championNameForUrl = specificChampion
        .replace(/\s+/g, '-')
        .replace(/[.']/g, '')
        .toLowerCase();
      const url = `https://www.wildriftfire.com/guide/${championNameForUrl}`;

      const championDetails = await crawlChampionDetails(url);

      if (championDetails) {
        console.log(`Successfully crawled data for ${championDetails.name}`);

        await championModel.findOneAndUpdate(
          { name: championDetails.name },
          {
            $set: {
              ...(championDetails.title
                ? { title: championDetails.title }
                : {}),
              ...(championDetails.description
                ? { description: championDetails.description }
                : {}),
              ...(championDetails.roles && championDetails.roles.length > 0
                ? { roles: championDetails.roles }
                : {}),
              ...(championDetails.abilities &&
              Object.keys(championDetails.abilities).length > 0
                ? { abilities: championDetails.abilities }
                : {}),
              ...(championDetails.stats
                ? { stats: championDetails.stats }
                : {}),
              ...(championDetails.recommendedItems &&
              championDetails.recommendedItems.length > 0
                ? { recommendedItems: championDetails.recommendedItems }
                : {}),
              ...(championDetails.patch
                ? { patch: championDetails.patch }
                : {}),
              ...(championDetails.skillOrder
                ? { skillOrder: championDetails.skillOrder }
                : {}),
              ...(championDetails.imageUrl &&
              championDetails.imageUrl.trim() !== ''
                ? { imageUrl: championDetails.imageUrl }
                : {}),
              ...(championDetails.splashUrl &&
              championDetails.splashUrl.trim() !== ''
                ? { splashUrl: championDetails.splashUrl }
                : {}),
            },
          },
          { upsert: true, new: true },
        );

        console.log(`Saved/updated ${championDetails.name} in database`);
      } else {
        console.error(`Failed to crawl data for ${specificChampion}`);
      }

      // Exit early
      await app.close();
      return;
    }

    // Get all champions from database
    const championsResult = await wildriftService.findAllChampions({
      limit: 1000,
    });
    const champions = championsResult.items;

    console.log(`Found ${champions.length} champions in the database.`);

    if (champions.length === 0) {
      console.log('No champions found. Crawling Aatrox as example...');

      // Crawl Aatrox as an example if no champions in database
      const championUrl = 'https://www.wildriftfire.com/guide/aatrox';
      const championDetails = await crawlChampionDetails(championUrl);

      if (championDetails) {
        console.log(`Successfully crawled data for ${championDetails.name}`);

        await championModel.findOneAndUpdate(
          { name: championDetails.name },
          {
            $set: {
              ...(championDetails.title
                ? { title: championDetails.title }
                : {}),
              ...(championDetails.description
                ? { description: championDetails.description }
                : {}),
              ...(championDetails.roles && championDetails.roles.length > 0
                ? { roles: championDetails.roles }
                : {}),
              ...(championDetails.abilities &&
              Object.keys(championDetails.abilities).length > 0
                ? { abilities: championDetails.abilities }
                : {}),
              ...(championDetails.stats
                ? { stats: championDetails.stats }
                : {}),
              ...(championDetails.recommendedItems &&
              championDetails.recommendedItems.length > 0
                ? { recommendedItems: championDetails.recommendedItems }
                : {}),
              ...(championDetails.patch
                ? { patch: championDetails.patch }
                : {}),
              ...(championDetails.skillOrder
                ? { skillOrder: championDetails.skillOrder }
                : {}),
              ...(championDetails.imageUrl &&
              championDetails.imageUrl.trim() !== ''
                ? { imageUrl: championDetails.imageUrl }
                : {}),
              ...(championDetails.splashUrl &&
              championDetails.splashUrl.trim() !== ''
                ? { splashUrl: championDetails.splashUrl }
                : {}),
            },
          },
          { upsert: true, new: true },
        );

        console.log(`Saved ${championDetails.name} to database`);
      } else {
        console.error('Failed to crawl Aatrox data');
      }
    } else {
      // Crawl details for all champions
      // Check if limit was provided (how many champions to process)
      const limitArg = process.argv[3];
      const limit = limitArg ? parseInt(limitArg) : undefined;
      const championsToCrawl = limit ? champions.slice(0, limit) : champions;

      console.log(
        `Will crawl details for ${championsToCrawl.length} champions...`,
      );

      let successCount = 0;
      let errorCount = 0;

      for (const champion of championsToCrawl) {
        try {
          const championNameForUrl = champion.name
            .replace(/\s+/g, '-')
            .replace(/[.']/g, '')
            .toLowerCase();
          const url = `https://www.wildriftfire.com/guide/${championNameForUrl}`;

          console.log(`Crawling details for ${champion.name} from ${url}`);

          // Add a small delay to avoid overwhelming the server
          await new Promise((resolve) => setTimeout(resolve, 1500));

          const championDetails = await crawlChampionDetails(url);

          if (championDetails) {
            console.log(`Successfully crawled data for ${champion.name}`);

            await championModel.findOneAndUpdate(
              { _id: champion._id },
              {
                $set: {
                  ...(championDetails.title
                    ? { title: championDetails.title }
                    : {}),
                  ...(championDetails.description
                    ? { description: championDetails.description }
                    : {}),
                  ...(championDetails.roles && championDetails.roles.length > 0
                    ? { roles: championDetails.roles }
                    : {}),
                  ...(championDetails.abilities &&
                  Object.keys(championDetails.abilities).length > 0
                    ? { abilities: championDetails.abilities }
                    : {}),
                  ...(championDetails.stats
                    ? { stats: championDetails.stats }
                    : {}),
                  ...(championDetails.recommendedItems &&
                  championDetails.recommendedItems.length > 0
                    ? { recommendedItems: championDetails.recommendedItems }
                    : {}),
                  ...(championDetails.patch
                    ? { patch: championDetails.patch }
                    : {}),
                  ...(championDetails.skillOrder
                    ? { skillOrder: championDetails.skillOrder }
                    : {}),
                  ...(championDetails.imageUrl &&
                  championDetails.imageUrl.trim() !== ''
                    ? { imageUrl: championDetails.imageUrl }
                    : {}),
                  ...(championDetails.splashUrl &&
                  championDetails.splashUrl.trim() !== ''
                    ? { splashUrl: championDetails.splashUrl }
                    : {}),
                },
              },
              { new: true },
            );

            console.log(`Updated ${champion.name} in database`);
            successCount++;
          } else {
            console.error(`Failed to crawl data for ${champion.name}`);
            errorCount++;
          }
        } catch (error) {
          console.error(`Error processing ${champion.name}: ${error.message}`);
          errorCount++;
        }
      }

      console.log(
        `Finished crawling champion details! Success: ${successCount}, Errors: ${errorCount}`,
      );
    }

    // Verify data by getting a count
    const totalChampions = await championModel.countDocuments();
    console.log(`Total champions in database: ${totalChampions}`);

    // Check one champion as example
    const aatrox = await championModel.findOne({ name: 'Aatrox' }).lean();
    if (aatrox) {
      console.log('Example champion data (Aatrox):');
      console.log(`- Name: ${aatrox.name}`);
      console.log(`- Title: ${aatrox.title}`);
      console.log(`- Roles: ${aatrox.roles.join(', ')}`);
      console.log(`- Abilities: ${Object.keys(aatrox.abilities).join(', ')}`);
      console.log(`- Skill Order: ${aatrox.skillOrder.priority.join(' > ')}`);
      console.log(`- Skill Sequence: ${aatrox.skillOrder.sequence.join(', ')}`);
      console.log(
        `- Stats: Health ${aatrox.stats.health}, AD ${aatrox.stats.attackDamage}`,
      );
    } else {
      console.log('Aatrox not found in database');
    }
  } catch (error) {
    console.error('Error in bootstrap function:', error);
  } finally {
    await app.close();
  }
}

// Execute the script
bootstrap();
