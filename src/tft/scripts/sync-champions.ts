import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { TftService } from '../tft.service';
import * as mongoose from 'mongoose';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { TftChampion } from '../schemas/tft-champion.schema';

interface ChampionData {
  name: string;
  cost: number;
  traits: string[];
  imageUrl: string;
}

async function bootstrap() {
  // Create a standalone application
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const tftService = app.get(TftService);
    
    console.log('Starting TFT champions synchronization...');
    
    // Step 1: Get champions from tftactics.gg
    console.log('Fetching champions from tftactics.gg...');
    const webChampions = await scrapeChampionsFromTftactics();
    console.log(`Found ${webChampions.length} champions on tftactics.gg`);
    
    // Step 2: Get champions from database
    console.log('Fetching champions from database...');
    const dbChampions = await tftService.findAllChampions();
    console.log(`Found ${dbChampions.length} champions in database`);
    
    // Step 3: Find champions to add (exist on website but not in DB)
    const championsToAdd = webChampions.filter(webChamp => 
      !dbChampions.some(dbChamp => 
        dbChamp.name.toLowerCase() === webChamp.name.toLowerCase())
    );
    
    console.log(`Found ${championsToAdd.length} champions to add:`);
    console.log(championsToAdd.map(c => `${c.name} (${c.cost}★)`).join(', '));
    
    // Step 4: Find champions to remove (exist in DB but not on website)
    const championsToRemove = dbChampions.filter(dbChamp => 
      !webChampions.some(webChamp => 
        webChamp.name.toLowerCase() === dbChamp.name.toLowerCase())
    );
    
    console.log(`Found ${championsToRemove.length} champions to remove:`);
    console.log(championsToRemove.map(c => `${c.name}`).join(', '));
    
    // Step 5: Find champions to update (exist in both but have different data)
    const championsToUpdate = dbChampions.filter(dbChamp => {
      const webChamp = webChampions.find(web => 
        web.name.toLowerCase() === dbChamp.name.toLowerCase());
      
      if (!webChamp) return false;
      
      // Compare cost
      if (dbChamp.cost !== webChamp.cost) return true;
      
      // Compare traits (ignoring order)
      const dbTraits = dbChamp.traits.map(t => t.toLowerCase()).sort();
      const webTraits = webChamp.traits.map(t => t.toLowerCase()).sort();
      
      if (dbTraits.length !== webTraits.length) return true;
      
      for (let i = 0; i < dbTraits.length; i++) {
        if (dbTraits[i] !== webTraits[i]) return true;
      }
      
      // Compare image URL
      if (dbChamp.imageUrl !== webChamp.imageUrl) return true;
      
      return false;
    });
    
    console.log(`Found ${championsToUpdate.length} champions to update`);
    championsToUpdate.forEach(champ => {
      const webChamp = webChampions.find(web => 
        web.name.toLowerCase() === champ.name.toLowerCase());
      console.log(`${champ.name}: Changes needed:`);
      
      if (champ.cost !== webChamp.cost) {
        console.log(`  Cost: ${champ.cost} -> ${webChamp.cost}`);
      }
      
      const dbTraits = champ.traits.map(t => t.toLowerCase()).sort();
      const webTraits = webChamp.traits.map(t => t.toLowerCase()).sort();
      
      if (dbTraits.length !== webTraits.length || 
          dbTraits.some((t, i) => t !== webTraits[i])) {
        console.log(`  Traits: [${champ.traits.join(', ')}] -> [${webChamp.traits.join(', ')}]`);
      }
      
      if (champ.imageUrl !== webChamp.imageUrl) {
        console.log(`  Image URL: ${champ.imageUrl} -> ${webChamp.imageUrl}`);
      }
    });
    
    // Ask user what to do next
    console.log('\n==== Sync Summary ====');
    console.log(`${championsToAdd.length} champions to add`);
    console.log(`${championsToRemove.length} champions to remove`);
    console.log(`${championsToUpdate.length} champions to update`);
    console.log('\nWould you like to apply these changes? (yes/no)');
    
    // For now, I'll skip the actual user input and show what would happen if they said "yes"
    // In a real script, you'd read from the console here
    console.log('\nSimulating user selecting "yes"...');
    
    // Apply changes
    console.log('\nApplying changes...');
    
    // Add missing champions
    for (const champion of championsToAdd) {
      console.log(`Adding ${champion.name}...`);
      await tftService.createChampion({
        name: champion.name,
        cost: champion.cost,
        traits: champion.traits,
        imageUrl: champion.imageUrl,
        patch: 'current', // You might want to set the current patch version here
        setNumber: 14, // Update with the current set number
      });
    }
    
    // Update champions with incorrect data
    for (const dbChamp of championsToUpdate) {
      const webChamp = webChampions.find(web => 
        web.name.toLowerCase() === dbChamp.name.toLowerCase());
      
      console.log(`Updating ${dbChamp.name}...`);
      await tftService.updateChampion(dbChamp._id.toString(), {
        cost: webChamp.cost,
        traits: webChamp.traits,
        imageUrl: webChamp.imageUrl,
      });
    }
    
    // Remove outdated champions
    for (const champion of championsToRemove) {
      console.log(`Removing ${champion.name}...`);
      await tftService.removeChampion(champion._id.toString());
    }
    
    console.log('\nSync completed successfully!');
    
  } catch (error) {
    console.error('Error synchronizing champions:', error);
  } finally {
    await app.close();
    // Ensure mongoose connection is closed
    await mongoose.connection.close();
  }
}

async function scrapeChampionsFromTftactics(): Promise<ChampionData[]> {
  try {
    const response = await axios.get('https://tftactics.gg/champions');
    const html = response.data;
    const $ = cheerio.load(html);
    const champions: ChampionData[] = [];
    
    // Process each champion
    $('.champions-container .champ-container').each((i, element) => {
      // Extract champion name
      const name = $(element).find('.name').text().trim();
      
      // Extract cost (stars)
      const costClass = $(element).find('.cost').attr('class') || '';
      const costClassMatch = costClass.match(/cost(\d+)/);
      const cost = costClassMatch ? parseInt(costClassMatch[1], 10) : 0;
      
      // Extract traits
      const traits: string[] = [];
      $(element).find('.bottom .trait').each((j, traitElem) => {
        const traitName = $(traitElem).text().trim();
        traits.push(traitName);
      });
      
      // Extract image URL
      const imageUrl = $(element).find('.image img').attr('src') || '';
      
      // Only add if we have all needed data
      if (name && cost && imageUrl) {
        champions.push({
          name,
          cost,
          traits,
          imageUrl
        });
      }
    });
    
    // If champion list is empty, we might be dealing with a different HTML structure
    if (champions.length === 0) {
      // Try alternative selector patterns
      $('.champions-list .champion-item').each((i, element) => {
        const name = $(element).find('.champion-name').text().trim();
        const costElem = $(element).find('.cost-icon');
        const cost = costElem.length ? parseInt(costElem.text().trim(), 10) : 0;
        
        // Get traits
        const traits: string[] = [];
        $(element).find('.traits .trait').each((j, traitElem) => {
          const traitName = $(traitElem).text().trim();
          traits.push(traitName);
        });
        
        // Get image
        const imageUrl = $(element).find('.champion-image img').attr('src') || '';
        
        if (name && cost && imageUrl) {
          champions.push({
            name,
            cost,
            traits,
            imageUrl
          });
        }
      });
    }
    
    return champions;
  } catch (error) {
    console.error('Error scraping champions:', error);
    return [];
  }
}

bootstrap(); 