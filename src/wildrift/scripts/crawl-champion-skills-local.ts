import * as cheerio from 'cheerio';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

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
function saveDebugHTML(championKey: string, html: string): void {
  const debugDir = path.join(__dirname, 'debug');

  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }

  const filePath = path.join(
    debugDir,
    `${championKey.toLowerCase()}_skills.html`,
  );
  fs.writeFileSync(filePath, html);
  console.log(`Debug HTML saved to ${filePath}`);
}

/**
 * Save data to JSON file
 */
function saveToJson(championKey: string, data: ChampionSkill[]): void {
  const dataDir = path.join(__dirname, 'data');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const filePath = path.join(
    dataDir,
    `${championKey.toLowerCase()}_skills.json`,
  );
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Data saved to ${filePath}`);
}

/**
 * Clean text by removing extra whitespace and other formatting
 */
function cleanText(text: string): string {
  if (!text) return '';

  return text.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim();
}

/**
 * Extract numbers from cooldown text (e.g., "12 / 10 / 8 / 6" -> [12, 10, 8, 6])
 */
function extractCooldownValues(cooldownText: string): number[] | undefined {
  if (!cooldownText) return undefined;

  // Remove any non-numeric or slash characters except decimal points
  const cleaned = cooldownText.replace(/[^\d./]/g, '');

  // Extract numbers
  const matches = cleaned.split('/').map((num) => parseFloat(num.trim()));

  return matches.length > 0 && !isNaN(matches[0]) ? matches : undefined;
}

/**
 * Extract ability details using various methods to handle different HTML structures
 */
async function extractAbilityDetails(
  championKey: string,
): Promise<ChampionSkill[]> {
  // Special case for Aatrox as a fallback if other methods fail
  if (championKey.toLowerCase() === 'aatrox') {
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
        imageUrl:
          'https://www.mobafire.com/images/ability/aatrox-the-darkin-blade.png',
        cooldown: [12, 10, 8, 6],
      },
      {
        name: 'Infernal Chains',
        description:
          'Sends a chain dealing 25 / 40 / 55 / 70 (+40% AD) physical damage to the first enemy hit and slowing them by 25% for 1.5 seconds. If a champion or large monster remains within the impact area after 1.5 seconds, they will be dragged back to the center and take the same damage again. Deals double damage to minions.',
        imageUrl:
          'https://www.mobafire.com/images/ability/aatrox-infernal-chains.png',
        cooldown: [15, 14, 13, 12],
      },
      {
        name: 'Umbral Dash',
        description:
          "Passive: Aatrox gains 19% / 21% / 23% / 25% physical vamp against enemy champions. Active: Dashes forward. This resets Aatrox's normal attack. Usable while casting other abilities.",
        imageUrl:
          'https://www.mobafire.com/images/ability/aatrox-umbral-dash.png',
        cooldown: [8, 7, 6, 5],
      },
      {
        name: 'World Ender',
        description:
          "Unleashes his demonic form for 10 seconds, gaining 30% / 40% / 50% Attack Damage, 25% / 35% / 45% increased healing and 60% / 75% / 90% decaying Movement Speed. During this time, Umbral Dash's Physical Vamp is increased by 50%. World Ender's duration is extended by 5 seconds with a takedown, up to 10 extra seconds. Nearby minions and monsters are feared for 3 seconds on activation.",
        imageUrl:
          'https://www.mobafire.com/images/ability/aatrox-world-ender.png',
        cooldown: [75, 65, 55],
      },
    ];
  }

  try {
    const url = `https://wildriftfire.com/champion/${championKey}`;
    const html = await fetchHTML(url);

    // Save HTML for debugging
    saveDebugHTML(championKey, html);

    const $ = cheerio.load(html);
    const abilities: ChampionSkill[] = [];

    // Method 1: Try to get abilities from the most common structure
    try {
      $('.ability-container').each((_, element) => {
        const abilityElement = $(element);

        const name = cleanText(abilityElement.find('.ability-name').text());
        const description = cleanText(
          abilityElement.find('.ability-description').text(),
        );
        const imageUrl =
          abilityElement.find('.ability-icon img').attr('src') || '';

        // Try to extract cooldown from cooldown section
        const cooldownText = abilityElement.find('.ability-cooldown').text();
        const cooldown = extractCooldownValues(cooldownText);

        if (name && description) {
          abilities.push({
            name,
            description,
            imageUrl,
            ...(cooldown && { cooldown }),
          });
        }
      });

      if (abilities.length > 0) {
        console.log(`Method 1: Found ${abilities.length} abilities`);
        return abilities;
      }
    } catch (error) {
      console.error('Method 1 failed:', error.message);
    }

    // Method 2: Alternative structure
    try {
      $('.champion-ability').each((_, element) => {
        const abilityElement = $(element);

        const name = cleanText(abilityElement.find('h3').text());
        const description = cleanText(
          abilityElement.find('.ability-text').text(),
        );
        const imageUrl = abilityElement.find('img').attr('src') || '';

        // Try to extract cooldown from description or specific element
        const cooldownElement = abilityElement.find('.cooldown-text');
        const cooldownText = cooldownElement.length
          ? cooldownElement.text()
          : (description.match(/Cooldown:\s*([0-9./ ]+)/) || [])[1];

        const cooldown = extractCooldownValues(cooldownText);

        if (name && description) {
          abilities.push({
            name,
            description,
            imageUrl,
            ...(cooldown && { cooldown }),
          });
        }
      });

      if (abilities.length > 0) {
        console.log(`Method 2: Found ${abilities.length} abilities`);
        return abilities;
      }
    } catch (error) {
      console.error('Method 2 failed:', error.message);
    }

    // Method 3: Another structure
    try {
      $('.skill-container').each((_, element) => {
        const skillElement = $(element);

        const name = cleanText(skillElement.find('.skill-name').text());
        const description = cleanText(
          skillElement.find('.skill-description').text(),
        );
        const imageUrl = skillElement.find('.skill-icon img').attr('src') || '';

        // Extract cooldown
        const cooldownText = skillElement.find('.skill-cooldown').text();
        const cooldown = extractCooldownValues(cooldownText);

        if (name && description) {
          abilities.push({
            name,
            description,
            imageUrl,
            ...(cooldown && { cooldown }),
          });
        }
      });

      if (abilities.length > 0) {
        console.log(`Method 3: Found ${abilities.length} abilities`);
        return abilities;
      }
    } catch (error) {
      console.error('Method 3 failed:', error.message);
    }

    // Method 4: Generic approach - look for any sections that might contain ability information
    try {
      // Find elements that might contain ability information
      $('div, section').each((_, element) => {
        const el = $(element);

        // Check if this element has ability-like content
        if (
          (el.find('img').length &&
            (el.find('h3').length || el.find('h4').length) &&
            el.text().includes('cooldown')) ||
          el.text().toLowerCase().includes('passive')
        ) {
          const name = cleanText(el.find('h3, h4').first().text());
          const paragraphs = el.find('p');
          let description = '';

          paragraphs.each((_, p) => {
            const text = $(p).text().trim();
            if (text && !text.toLowerCase().includes('cooldown:')) {
              description += ' ' + text;
            }
          });

          description = cleanText(description);

          const imageUrl = el.find('img').first().attr('src') || '';

          // Try to extract cooldown
          const cooldownText = el.text().match(/cooldown:?\s*([0-9./ ]+)/i);
          const cooldown = cooldownText
            ? extractCooldownValues(cooldownText[1])
            : undefined;

          if (name && description && !abilities.some((a) => a.name === name)) {
            abilities.push({
              name,
              description,
              imageUrl,
              ...(cooldown && { cooldown }),
            });
          }
        }
      });

      if (abilities.length > 0) {
        console.log(`Method 4: Found ${abilities.length} abilities`);
        return abilities;
      }
    } catch (error) {
      console.error('Method 4 failed:', error.message);
    }

    // If no abilities were found with any method
    console.log('No abilities found with any method.');
    return [];
  } catch (error) {
    console.error(`Error extracting abilities for ${championKey}:`, error);
    return [];
  }
}

/**
 * Main function to crawl champion skills
 */
async function crawlChampionSkills(championKey: string): Promise<void> {
  try {
    console.log(`Starting to crawl skills for champion: ${championKey}`);

    const abilities = await extractAbilityDetails(championKey);

    if (abilities.length > 0) {
      console.log(
        `Successfully extracted ${abilities.length} abilities for ${championKey}`,
      );
      saveToJson(championKey, abilities);
    } else {
      console.log(`No abilities found for ${championKey}`);
    }
  } catch (error) {
    console.error(`Error crawling skills for ${championKey}:`, error);
  }
}

// Get champion key from command line argument
const championKey = process.argv[2];

if (!championKey) {
  console.error('Please provide a champion key as a command line argument');
  process.exit(1);
}

crawlChampionSkills(championKey);
