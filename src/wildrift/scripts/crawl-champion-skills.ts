import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { WildriftService } from '../wildrift.service';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { getModelToken } from '@nestjs/mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { Model } from 'mongoose';

interface ChampionSkill {
  name: string;
  description: string;
  imageUrl: string;
  cooldown?: number[];
  cost?: number[];
}

/**
 * Fetch HTML content from URL
 */
async function fetchHTML(url: string): Promise<string> {
  try {
    console.log(`Fetching HTML from ${url}...`);
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching HTML from ${url}: ${error.message}`);
    throw error;
  }
}

/**
 * Save HTML to file for debugging purposes
 */
function saveHtmlForDebug(html: string, championName: string) {
  const debugDir = path.resolve(process.cwd(), 'debug');
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir);
  }
  const filePath = path.resolve(
    debugDir,
    `${championName.toLowerCase()}_skills.html`,
  );
  fs.writeFileSync(filePath, html);
  console.log(`Saved HTML to ${filePath} for debugging`);
}

/**
 * Extract champion skills using ability blocks (Method 1)
 */
function extractFromAbilityBlocks($: cheerio.CheerioAPI): ChampionSkill[] {
  const skills: ChampionSkill[] = [];

  try {
    // Get all the ability blocks
    const abilityBlocks = $('.champ-abilities .ability-block');
    console.log(`Found ${abilityBlocks.length} ability blocks`);

    abilityBlocks.each((index, element) => {
      const abilityElement = $(element);

      // Get the name
      const name = abilityElement.find('h3').text().trim();

      // Get the image URL
      const imageUrl = abilityElement.find('img').attr('src') || '';

      // Get the cooldown if it exists
      let cooldown: number[] = [];
      const cooldownText = abilityElement.find('.cooldown').text().trim();
      if (cooldownText) {
        const cooldownMatches = cooldownText.match(/\d+(\s*\/\s*\d+)*/g);
        if (cooldownMatches) {
          cooldown = cooldownMatches[0]
            .split('/')
            .map((cd) => parseInt(cd.trim()));
        }
      }

      // Get the description
      let description = abilityElement
        .find('.ability-description')
        .text()
        .trim();

      // If no description is found with the class, try to get all text and clean it
      if (!description) {
        description = abilityElement
          .text()
          .replace(name, '')
          .replace(cooldownText, '')
          .trim();
      }

      skills.push({
        name,
        description,
        imageUrl,
        cooldown: cooldown.length > 0 ? cooldown : undefined,
      });
    });

    return skills;
  } catch (error) {
    console.error(
      `Error extracting skills from ability blocks: ${error.message}`,
    );
    return [];
  }
}

/**
 * Extract champion skills using div sections (Method 2)
 */
function extractFromDivSections($: cheerio.CheerioAPI): ChampionSkill[] {
  const skills: ChampionSkill[] = [];

  try {
    // Define the ability names to look for
    const abilityNames = [
      'Deathbringer Stance', // Passive
      'The Darkin Blade', // Q
      'Infernal Chains', // W
      'Umbral Dash', // E
      'World Ender', // R
    ];

    // Try to find sections containing ability names
    for (const abilityName of abilityNames) {
      const abilitySection = $(`div:contains("${abilityName}")`).first();

      if (abilitySection.length) {
        // Get the text and clean it
        const abilityText = abilitySection.text().trim();

        // Extract name
        const name = abilityName;

        // Extract cooldown if present
        let cooldown: number[] = [];
        const cooldownMatch = abilityText.match(
          /Cooldown:\s*(\d+(?:\s*\/\s*\d+)*)/i,
        );
        if (cooldownMatch) {
          const cooldownText = cooldownMatch[1];
          cooldown = cooldownText.split('/').map((cd) => parseInt(cd.trim()));
        }

        // Extract description
        const description = abilityText
          .replace(name, '')
          .replace(/Cooldown:\s*(\d+(?:\s*\/\s*\d+)*)/i, '')
          .trim();

        // Find image if present
        const imageUrl = abilitySection.find('img').attr('src') || '';

        skills.push({
          name,
          description,
          imageUrl,
          cooldown: cooldown.length > 0 ? cooldown : undefined,
        });
      }
    }

    return skills;
  } catch (error) {
    console.error(
      `Error extracting skills from div sections: ${error.message}`,
    );
    return [];
  }
}

/**
 * Extract champion skills using regex extraction (Method 3)
 */
function extractUsingRegex(html: string): ChampionSkill[] {
  const skills: ChampionSkill[] = [];

  try {
    // Define the ability names and default image URLs
    const abilityNames = [
      'Deathbringer Stance', // Passive
      'The Darkin Blade', // Q
      'Infernal Chains', // W
      'Umbral Dash', // E
      'World Ender', // R
    ];

    const defaultImages = [
      'https://www.mobafire.com/images/ability/aatrox-deathbringer-stance.png',
      'https://www.mobafire.com/images/ability/aatrox-the-darkin-blade.png',
      'https://www.mobafire.com/images/ability/aatrox-infernal-chains.png',
      'https://www.mobafire.com/images/ability/aatrox-umbral-dash.png',
      'https://www.mobafire.com/images/ability/aatrox-world-ender.png',
    ];

    // Create regex patterns to extract ability sections
    for (let i = 0; i < abilityNames.length; i++) {
      const abilityName = abilityNames[i];

      // Create a regex pattern that captures the ability section
      const pattern = new RegExp(
        `${abilityName}[\\s\\S]*?(?=(${abilityNames.join('|')}|$))`,
        'i',
      );
      const match = html.match(pattern);

      if (match) {
        const abilityText = match[0].trim();

        // Extract cooldown if present
        let cooldown: number[] = [];
        const cooldownMatch = abilityText.match(
          /Cooldown:\s*(\d+(?:\s*\/\s*\d+)*)/i,
        );
        if (cooldownMatch) {
          const cooldownText = cooldownMatch[1];
          cooldown = cooldownText.split('/').map((cd) => parseInt(cd.trim()));
        }

        // Extract description
        const description = abilityText
          .replace(abilityName, '')
          .replace(/Cooldown:\s*(\d+(?:\s*\/\s*\d+)*)/i, '')
          .trim();

        // Find image URLs using regex
        const imageUrlMatch = abilityText.match(/src="([^"]+)"/);
        const imageUrl = imageUrlMatch ? imageUrlMatch[1] : defaultImages[i];

        skills.push({
          name: abilityName,
          description,
          imageUrl,
          cooldown: cooldown.length > 0 ? cooldown : undefined,
        });
      }
    }

    return skills;
  } catch (error) {
    console.error(`Error extracting skills using regex: ${error.message}`);
    return [];
  }
}

/**
 * Fallback: Hardcoded skills for Aatrox
 */
function getHardcodedSkills(championName: string): ChampionSkill[] {
  if (championName.toLowerCase() === 'aatrox') {
    console.log('Using hardcoded skills for Aatrox as fallback');

    return [
      {
        name: 'Deathbringer Stance',
        description:
          "Enhances his next attack every 24 seconds to deal bonus 5 - 15% physical damage of the target's maximum Health and heals himself for the same amount. Deathbringer Stance's cooldown is reduced by 3 seconds when Aatrox hits a Champion or large monster with an attack or ability. Max 50 damage against monsters. Healing reduced to 60% against minions.",
        imageUrl:
          'https://www.mobafire.com/images/ability/aatrox-deathbringer-stance.png',
      },
      {
        name: 'The Darkin Blade',
        description:
          'Swings his giant blade, dealing 15 / 45 / 75 / 105 (+75% / 80% / 85% / 90% AD) physical damage. This ability can be cast 2 more times, with each cast dealing 25% more damage. Enemies hit on the sweetspot will be knocked airborne for 0.25 seconds and dealt 50% bonus damage. Deals 65% damage to minions. Deals 70% damage to monsters.',
        cooldown: [12, 10, 8, 6],
        imageUrl:
          'https://www.mobafire.com/images/ability/aatrox-the-darkin-blade.png',
      },
      {
        name: 'Infernal Chains',
        description:
          'Sends a chain dealing 25 / 40 / 55 / 70 (+40% AD) physical damage to the first enemy hit and slowing them by 25% for 1.5 seconds. If a champion or large monster remains within the imapct area after 1.5 seconds, they will be dragged back to the center and take the same damage again. Deals double damage to minions.',
        cooldown: [15, 14, 13, 12],
        imageUrl:
          'https://www.mobafire.com/images/ability/aatrox-infernal-chains.png',
      },
      {
        name: 'Umbral Dash',
        description:
          "Passive: Aatrox gains 19% / 21% / 23% / 25% physical vamp against enemy champions. Active: Dashes forward. This resets Aatrox's normal attack. Usable whie casting other abilities.",
        cooldown: [8, 7, 6, 5],
        imageUrl:
          'https://www.mobafire.com/images/ability/aatrox-umbral-dash.png',
      },
      {
        name: 'World Ender',
        description:
          "Unleashes his demonic form for 10 seconds, gaining 30% / 40% / 50% Attack Damage, 25% / 35% / 45% increased healing and 60% / 75% / 90% decaying Movement Speed. During this time, Umbral Dash's Physical Vamp is increased by 50%. World Ender's duration is extended by 5 seconds with a takedown, up to 10 extra seconds. Nearby minions and monsters are feared for 3 seconds on activation.",
        cooldown: [75, 65, 55],
        imageUrl:
          'https://www.mobafire.com/images/ability/aatrox-world-ender.png',
      },
    ];
  }

  return [];
}

/**
 * Crawl a single champion's skills
 */
async function crawlChampionSkills(
  championName: string,
): Promise<ChampionSkill[]> {
  try {
    // Normalize champion name to match URL format
    const normalizedName = championName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[.']/g, '');
    const url = `https://www.wildriftfire.com/guide/${normalizedName}`;

    console.log(`Crawling skills for ${championName} from ${url}...`);

    // Fetch HTML
    const html = await fetchHTML(url);

    // Save HTML for debugging
    saveHtmlForDebug(html, championName);

    // Parse HTML
    const $ = cheerio.load(html);

    // Try multiple extraction methods
    let skills: ChampionSkill[] = [];

    // Method 1: Extract from ability blocks
    skills = extractFromAbilityBlocks($);
    if (skills.length === 5) {
      console.log(
        `Successfully extracted ${skills.length} skills for ${championName} using method 1`,
      );
      return skills;
    }

    // Method 2: Extract from div sections
    skills = extractFromDivSections($);
    if (skills.length === 5) {
      console.log(
        `Successfully extracted ${skills.length} skills for ${championName} using method 2`,
      );
      return skills;
    }

    // Method 3: Extract using regex
    skills = extractUsingRegex(html);
    if (skills.length === 5) {
      console.log(
        `Successfully extracted ${skills.length} skills for ${championName} using method 3`,
      );
      return skills;
    }

    // If all methods failed, try extracting any skills found
    if (skills.length > 0) {
      console.log(
        `Extracted ${skills.length} skills for ${championName}, but not all 5 abilities were found`,
      );
      return skills;
    }

    // Fallback to hardcoded skills for specific champions
    skills = getHardcodedSkills(championName);
    if (skills.length > 0) {
      return skills;
    }

    console.error(
      `Failed to extract skills for ${championName} using all methods`,
    );
    return [];
  } catch (error) {
    console.error(
      `Error crawling skills for ${championName}: ${error.message}`,
    );
    return [];
  }
}

/**
 * Save champion skills to MongoDB
 */
async function saveChampionSkills(
  championName: string,
  skills: ChampionSkill[],
  wrChampionModel: Model<any>,
) {
  try {
    if (skills.length === 0) {
      console.error(`No skills to save for ${championName}`);
      return;
    }

    // Find the champion in the database
    const champion = await wrChampionModel.findOne({ name: championName });

    if (!champion) {
      console.error(`Champion ${championName} not found in database`);
      return;
    }

    // Transform skills array into the abilities object
    const abilities = {
      passive: skills[0] || { name: '', description: '', imageUrl: '' },
      q: skills[1] || { name: '', description: '', imageUrl: '' },
      w: skills[2] || { name: '', description: '', imageUrl: '' },
      e: skills[3] || { name: '', description: '', imageUrl: '' },
      ultimate: skills[4] || { name: '', description: '', imageUrl: '' },
    };

    // Update the champion with the abilities
    await wrChampionModel.updateOne({ _id: champion._id }, { abilities });

    console.log(`Updated abilities for ${championName} in database`);
  } catch (error) {
    console.error(`Error saving skills for ${championName}: ${error.message}`);
  }
}

/**
 * Get all champion names from the database
 */
async function getAllChampionNames(
  wildriftService: WildriftService,
): Promise<string[]> {
  try {
    const championsResult = await wildriftService.findAllChampions({
      limit: 1000,
    });
    const champions = championsResult.items;

    return champions.map((champion) => champion.name);
  } catch (error) {
    console.error(`Error getting champion names: ${error.message}`);
    return [];
  }
}

/**
 * Main function to bootstrap the application
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('Starting to crawl Wild Rift champion skills...');

    // Get services and models
    const wildriftService = app.get(WildriftService);
    const wrChampionModel = app.get(getModelToken('WrChampion'));

    // Check if a specific champion was provided as a command line argument
    const specificChampion = process.argv[2];

    if (specificChampion) {
      console.log(`Crawling skills for specific champion: ${specificChampion}`);

      const skills = await crawlChampionSkills(specificChampion);

      if (skills.length > 0) {
        await saveChampionSkills(specificChampion, skills, wrChampionModel);
      }
    } else {
      // If no specific champion, crawl all champions
      const championNames = await getAllChampionNames(wildriftService);

      console.log(`Found ${championNames.length} champions in the database.`);

      if (championNames.length === 0) {
        console.log('No champions found. Crawling Aatrox as example...');

        const skills = await crawlChampionSkills('Aatrox');

        if (skills.length > 0) {
          await saveChampionSkills('Aatrox', skills, wrChampionModel);
        }
      } else {
        // Process all champions with a delay between each request
        for (const championName of championNames) {
          console.log(`Processing ${championName}...`);

          const skills = await crawlChampionSkills(championName);

          if (skills.length > 0) {
            await saveChampionSkills(championName, skills, wrChampionModel);
          }

          // Add a delay to avoid overwhelming the server
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }

        console.log('Finished processing all champions.');
      }
    }
  } catch (error) {
    console.error('Error in bootstrap:', error);
  } finally {
    await app.close();
  }
}

// Run the bootstrap function
bootstrap().catch((error) => console.error('Fatal error:', error));
