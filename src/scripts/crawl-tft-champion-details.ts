import axios from 'axios';
import * as cheerio from 'cheerio';
import { connect } from 'mongoose';
import {
  TftChampion,
  TftChampionSchema,
} from '../tft/schemas/tft-champion.schema';
import { TftItem, TftItemSchema } from '../tft/schemas/tft-item.schema';
import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../config.env') });

// Debug: Log the MongoDB URI to check if it's loaded correctly
console.log(
  'MongoDB URI:',
  process.env.MONGODB_URI ? 'Loaded successfully' : 'Not loaded',
);

interface ChampionDetail {
  name: string;
  imageUrl: string;
  cost: number;
  recommendedItems: string[];
  recommendedItemsData: Array<{ name: string; imageUrl: string }>;
  health: string;
  mana: string;
  armor: string;
  magicResist: string;
  dps: string;
  damage: string;
  attackSpeed: string;
  critRate: string;
  range: string;
  ability: {
    name: string;
    description: string;
    mana: string;
  };
  traits: string[];
  setNumber: number;
  patch: string;
}

async function crawlChampionDetails(
  championName: string,
): Promise<ChampionDetail | null> {
  try {
    // Convert champion name to URL format (lowercase, no spaces)
    const formattedName = championName.toLowerCase().replace(/\s+/g, '-');
    const url = `https://tftactics.gg/champions/${formattedName}/`;

    console.log(`Crawling details for ${championName} from ${url}`);

    const { data } = await axios.get(url);

    // Debug: Log HTML length and save HTML to file for inspection
    console.log(`Received HTML length: ${data.length}`);
    const debugDir = path.join(__dirname, '../../../data/debug');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    fs.writeFileSync(path.join(debugDir, `${formattedName}-html.txt`), data);

    const $ = cheerio.load(data);

    // Debug: Log selectors to see if they match
    console.log('Champion header exists:', $('.champion-header').length > 0);
    console.log(
      'Champion header cost exists:',
      $('.champion-header-cost').length > 0,
    );
    console.log(
      'Champion build items exists:',
      $('.champion-build-items').length > 0,
    );
    console.log('Items list exists:', $('.items-list').length > 0);

    // Extract cost
    const costText = $('.champion-header-cost').text();
    console.log('Cost text:', costText);
    const cost =
      parseInt($('.champion-header-cost').text().replace('cost', '').trim()) ||
      0;
    console.log('Parsed cost:', cost);

    // Extract recommended items with images
    const recommendedItems: string[] = [];
    const recommendedItemsData: Array<{ name: string; imageUrl: string }> = [];

    // Debug: Log all img elements
    console.log('All img elements in document:', $('img').length);

    $('.champion-build-items img').each((i, el) => {
      console.log(`Item ${i} found`);
      const itemName = $(el).attr('alt');
      const itemImageUrl = $(el).attr('src');
      console.log(`Item ${i}: name=${itemName}, imageUrl=${itemImageUrl}`);

      if (itemName) {
        recommendedItems.push(itemName);

        if (itemImageUrl) {
          recommendedItemsData.push({
            name: itemName,
            imageUrl: itemImageUrl,
          });

          // Save item data to database later
          saveItemToFile(itemName, itemImageUrl);
        }
      }
    });

    // Extract stats
    const stats = $('.champion-stats-list li');
    const statsMap: Record<string, string> = {};

    stats.each((i, el) => {
      const statName = $(el).find('.champion-stats-name').text().trim();
      const statValue = $(el).find('.champion-stats-value').text().trim();
      statsMap[statName.toLowerCase()] = statValue;
    });

    // Extract ability details
    const abilityName = $('.champion-ability-name').first().text().trim();
    const abilityMana = $('.champion-ability-mana')
      .text()
      .replace('mana cost', '')
      .trim();
    const abilityDescription = $('.champion-ability-description').text().trim();

    // Extract traits
    const traits: string[] = [];
    $('.champion-trait-name').each((i, el) => {
      const trait = $(el).text().trim();
      traits.push(trait);
    });

    // Extract image URL if available
    const imageUrl = $('.champion-header img').attr('src') || '';

    return {
      name: championName,
      imageUrl,
      cost,
      recommendedItems,
      recommendedItemsData,
      health: statsMap['health'] || '',
      mana: statsMap['mana'] || '',
      armor: statsMap['armor'] || '',
      magicResist: statsMap['mr'] || '',
      dps: statsMap['dps'] || '',
      damage: statsMap['damage'] || '',
      attackSpeed: statsMap['atk spd'] || '',
      critRate: statsMap['crit rate'] || '',
      range: statsMap['range'] || '',
      ability: {
        name: abilityName,
        description: abilityDescription,
        mana: abilityMana,
      },
      traits,
      setNumber: 14, // Current set, you might want to extract this dynamically
      patch: `Set ${14}`, // Current patch format
    };
  } catch (error) {
    console.error(`Error crawling details for ${championName}:`, error);
    return null;
  }
}

async function updateChampionInDatabase(
  championDetail: ChampionDetail,
): Promise<void> {
  try {
    const TftChampionModel = mongoose.model<TftChampion>(
      'TftChampion',
      TftChampionSchema,
    );

    // Find the champion by name and update with new details
    const result = await TftChampionModel.findOneAndUpdate(
      { name: championDetail.name },
      {
        $set: {
          cost: championDetail.cost,
          imageUrl: championDetail.imageUrl || undefined,
          recommendedItems: championDetail.recommendedItems,
          recommendedItemsData: championDetail.recommendedItemsData,
          stats: {
            health: championDetail.health,
            mana: championDetail.mana,
            armor: championDetail.armor,
            magicResist: championDetail.magicResist,
            dps: championDetail.dps,
            damage: championDetail.damage,
            attackSpeed: championDetail.attackSpeed,
            critRate: championDetail.critRate,
            range: championDetail.range,
          },
          ability: {
            name: championDetail.ability.name,
            description: championDetail.ability.description,
            mana: championDetail.ability.mana,
          },
          traits: championDetail.traits,
          setNumber: championDetail.setNumber,
          patch: championDetail.patch,
        },
      },
      { new: true, upsert: true },
    );

    console.log(`Updated champion: ${championDetail.name}`);
  } catch (error) {
    console.error(`Error updating ${championDetail.name} in database:`, error);
  }
}

async function saveItemToFile(
  itemName: string,
  imageUrl: string,
): Promise<void> {
  try {
    const outputDir = path.join(__dirname, '../../../data/tft/items');

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(
      outputDir,
      `${itemName.toLowerCase().replace(/\s+/g, '_')}.json`,
    );

    const itemData = {
      name: itemName,
      imageUrl,
      patch: `Set ${14}`,
    };

    fs.writeFileSync(filePath, JSON.stringify(itemData, null, 2));
    console.log(`Saved item ${itemName} to ${filePath}`);
  } catch (error) {
    console.error(`Error saving item ${itemName} to file:`, error);
  }
}

async function saveChampionDetailToFile(
  championDetail: ChampionDetail,
): Promise<void> {
  try {
    const outputDir = path.join(__dirname, '../../../data/tft/champions');

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(
      outputDir,
      `${championDetail.name.toLowerCase()}.json`,
    );
    fs.writeFileSync(filePath, JSON.stringify(championDetail, null, 2));

    console.log(`Saved ${championDetail.name} details to ${filePath}`);
  } catch (error) {
    console.error(`Error saving ${championDetail.name} to file:`, error);
  }
}

async function crawlAllChampions(): Promise<void> {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    await connect(mongoUri);
    console.log('Connected to MongoDB');

    const TftChampionModel = mongoose.model<TftChampion>(
      'TftChampion',
      TftChampionSchema,
    );

    // Get all champions from database
    const champions = await TftChampionModel.find({});
    console.log(`Found ${champions.length} champions in database`);

    // Crawl details for each champion
    for (const champion of champions) {
      console.log(`Processing champion: ${champion.name}`);

      const championDetail = await crawlChampionDetails(champion.name);

      if (championDetail) {
        await updateChampionInDatabase(championDetail);
        await saveChampionDetailToFile(championDetail);
      }

      // Wait a bit to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log('Finished crawling all champions');
    process.exit(0);
  } catch (error) {
    console.error('Error in crawlAllChampions:', error);
    process.exit(1);
  }
}

async function crawlSingleChampion(championName: string): Promise<void> {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    await connect(mongoUri);
    console.log('Connected to MongoDB');

    const championDetail = await crawlChampionDetails(championName);

    if (championDetail) {
      await updateChampionInDatabase(championDetail);
      await saveChampionDetailToFile(championDetail);
      console.log(`Successfully crawled and updated ${championName}`);
    } else {
      console.error(`Failed to crawl details for ${championName}`);
    }

    process.exit(0);
  } catch (error) {
    console.error(`Error in crawlSingleChampion for ${championName}:`, error);
    process.exit(1);
  }
}

// Check if a champion name was provided as a command-line argument
const championName = process.argv[2];

if (championName) {
  console.log(`Crawling details for specific champion: ${championName}`);
  crawlSingleChampion(championName);
} else {
  console.log('Crawling details for all champions');
  crawlAllChampions();
}
