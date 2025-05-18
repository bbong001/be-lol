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

async function crawlChampionDetails(championUrl = 'https://www.wildriftfire.com/guide/aatrox') {
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
      championName = championUrl.split('/').pop()?.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') || 'Unknown Champion';
    }
    
    let championTitle = $('.wf-page-header__champion-title').text().trim();
    
    console.log(`Crawling details for ${championName} - ${championTitle}`);
    
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
        rolesText.split(/[,\/]/).forEach(role => {
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
      description = $('.wf-champion-description').text().trim() || 'No description available';
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
        } else if (statName.includes('Magic Resist') || statName.includes('MR')) {
          stats.magicResist = numValue || 0;
        } else if (statName.includes('Attack Damage') || statName.includes('AD')) {
          stats.attackDamage = numValue || 0;
        } else if (statName.includes('Attack Speed') || statName.includes('AS')) {
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
        
        const [statName, statValue] = text.split(':').map(s => s.trim());
        const numValue = parseFloat(statValue);
        
        if (statName.includes('Health') && !statName.includes('Regen')) {
          stats.health = numValue || 630;
        } else if (statName.includes('Armor')) {
          stats.armor = numValue || 36;
        } else if (statName.includes('Magic Resist') || statName.includes('MR')) {
          stats.magicResist = numValue || 32;
        } else if (statName.includes('Attack Damage') || statName.includes('AD')) {
          stats.attackDamage = numValue || 60;
        } else if (statName.includes('Attack Speed') || statName.includes('AS')) {
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
      passive: extractAbility($, html, 'passive', championName),
      q: extractAbility($, html, 'q', championName),
      w: extractAbility($, html, 'w', championName),
      e: extractAbility($, html, 'e', championName),
      ultimate: extractAbility($, html, 'r', championName),
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
    };
  } catch (error) {
    console.error(`Error crawling champion details: ${error.message}`);
    return null;
  }
}

function extractAbility($: cheerio.CheerioAPI, html: string, abilityKey: string, championName: string): ChampionAbility {
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
      description: 'Aatrox periodically empowers his next attack to deal bonus damage and heal him based on the target\'s max health.',
      imageUrl: 'https://www.wildriftfire.com/static/img/champ-abilities/aatrox-passive.png',
    };
    defaultAbilities.q = {
      name: 'The Darkin Blade',
      description: 'Aatrox slams his greatsword, dealing damage. He can cast this ability two more times, each one hitting a different area.',
      imageUrl: 'https://www.wildriftfire.com/static/img/champ-abilities/aatrox-q.png',
      cooldown: [14, 12, 10, 8],
      cost: [0, 0, 0, 0],
    };
    defaultAbilities.w = {
      name: 'Infernal Chains',
      description: 'Aatrox smashes the ground, dealing damage and slowing the first enemy hit. Champions and large monsters have to leave the impact area quickly or they\'re dragged back to the center.',
      imageUrl: 'https://www.wildriftfire.com/static/img/champ-abilities/aatrox-w.png',
      cooldown: [14, 13, 12, 11],
      cost: [0, 0, 0, 0],
    };
    defaultAbilities.e = {
      name: 'Umbral Dash',
      description: 'Aatrox dashes in the target direction, gaining attack damage. This ability can store up to 2 charges.',
      imageUrl: 'https://www.wildriftfire.com/static/img/champ-abilities/aatrox-e.png',
      cooldown: [9, 8, 7, 6],
      cost: [0, 0, 0, 0],
    };
    defaultAbilities.r = {
      name: 'World Ender',
      description: 'Aatrox unleashes his demonic form, gaining attack damage, increased healing, and movement speed. This effect refreshes on takedown.',
      imageUrl: 'https://www.wildriftfire.com/static/img/champ-abilities/aatrox-r.png',
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
      description = abilitySection.find('.wf-ability__description').text().trim();
      imageUrl = abilitySection.find('img').attr('src') || '';
      
      // Extract cooldown and costs if not passive
      if (!isPassive) {
        const cooldownText = abilitySection.find('.wf-ability__cooldown').text().trim();
        if (cooldownText) {
          cooldown = cooldownText.split('/').map(cd => parseFloat(cd.trim())).filter(cd => !isNaN(cd));
        }
        
        const costText = abilitySection.find('.wf-ability__cost').text().trim();
        if (costText) {
          cost = costText.split('/').map(c => parseFloat(c.trim())).filter(c => !isNaN(c));
        }
      }
    }
    
    // Try alternative selectors if the above didn't work
    if (!name) {
      // Try finding by class name pattern
      const alternativeSection = $(`.ability-${abilityKey}, .${abilityKey}-ability, .ability[data-key="${abilityKey}"]`);
      
      if (alternativeSection.length > 0) {
        name = alternativeSection.find('.ability-name, .name').text().trim();
        description = alternativeSection.find('.ability-description, .description').text().trim();
        imageUrl = alternativeSection.find('img').attr('src') || '';
        
        if (!isPassive) {
          const cooldownText = alternativeSection.find('.cooldown, .cd').text().trim();
          if (cooldownText) {
            cooldown = cooldownText.split(/[\/\s]/).map(cd => parseFloat(cd.trim())).filter(cd => !isNaN(cd));
          }
          
          const costText = alternativeSection.find('.cost, .mana-cost').text().trim();
          if (costText) {
            cost = costText.split(/[\/\s]/).map(c => parseFloat(c.trim())).filter(c => !isNaN(c));
          }
        }
      }
    }
    
    // Return available data or fall back to defaults
    return {
      name: name || defaultAbilities[abilityKey].name,
      description: description || defaultAbilities[abilityKey].description,
      imageUrl: imageUrl || defaultAbilities[abilityKey].imageUrl,
      ...(isPassive ? {} : {
        cooldown: cooldown.length > 0 ? cooldown : defaultAbilities[abilityKey].cooldown,
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
      
      const championNameForUrl = specificChampion.replace(/\s+/g, '-').replace(/[.']/g, '').toLowerCase();
      const url = `https://www.wildriftfire.com/guide/${championNameForUrl}`;
      
      const championDetails = await crawlChampionDetails(url);
      
      if (championDetails) {
        console.log(`Successfully crawled data for ${championDetails.name}`);
        
        await championModel.findOneAndUpdate(
          { name: championDetails.name },
          championDetails,
          { upsert: true, new: true }
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
    const championsResult = await wildriftService.findAllChampions({ limit: 1000 });
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
          championDetails,
          { upsert: true, new: true }
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
      
      console.log(`Will crawl details for ${championsToCrawl.length} champions...`);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const champion of championsToCrawl) {
        try {
          const championNameForUrl = champion.name.replace(/\s+/g, '-').replace(/[.']/g, '').toLowerCase();
          const url = `https://www.wildriftfire.com/guide/${championNameForUrl}`;
          
          console.log(`Crawling details for ${champion.name} from ${url}`);
          
          // Add a small delay to avoid overwhelming the server
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const championDetails = await crawlChampionDetails(url);
          
          if (championDetails) {
            console.log(`Successfully crawled data for ${champion.name}`);
            
            await championModel.findOneAndUpdate(
              { _id: champion._id },
              championDetails,
              { new: true }
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
      
      console.log(`Finished crawling champion details! Success: ${successCount}, Errors: ${errorCount}`);
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
      console.log(`- Stats: Health ${aatrox.stats.health}, AD ${aatrox.stats.attackDamage}`);
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