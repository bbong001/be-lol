import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { WildriftService } from '../wildrift.service';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { getModelToken } from '@nestjs/mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const wildriftService = app.get(WildriftService);

  try {
    console.log('Starting to crawl Wild Rift champion data from wildriftfire.com...');
    
    // Get HTML content
    let htmlContent: string;
    const filePath = path.resolve(process.cwd(), 'wildrift-page.html');
    
    if (fs.existsSync(filePath)) {
      htmlContent = fs.readFileSync(filePath, 'utf8');
    } else {
      console.log('HTML file not found, downloading from wildriftfire.com...');
      const response = await axios.get('https://www.wildriftfire.com');
      htmlContent = response.data;
      fs.writeFileSync(filePath, htmlContent);
    }
    
    const $ = cheerio.load(htmlContent);
    
    console.log('Looking for champions in the DOM...');
    const championElements = $('.wf-home__champions__champion');
    console.log(`Found ${championElements.length} champion elements`);
    
    if (championElements.length === 0) {
      // Try another selector if the first one doesn't work
      const linkElements = $('a[data-role]');
      console.log(`Found ${linkElements.length} link elements`);
    }
    
    const champions = [];
    
    championElements.each((i, el) => {
      const name = $(el).find('img').attr('alt') || '';
      const roles = ($(el).attr('data-role') || '').split(' ').filter(r => r.trim() !== '');
      const imageUrl = $(el).find('img').attr('src') || '';
      
      if (name) {
        console.log(`Found champion: ${name} with roles: ${roles.join(', ')}`);
        champions.push({
          name,
          slug: $(el).attr('url') || name.toLowerCase().replace(/\s+/g, '-').replace(/[.']/g, ''),
          roles,
          imageUrl,
          description: '',
          difficulty: 'Medium',
          type: 'Champion',
          source: 'Wild Rift',
          sourceUrl: `https://www.wildriftfire.com/guide/${name.toLowerCase().replace(/\s+/g, '-').replace(/[.']/g, '')}`,
        });
      }
    });
    
    console.log(`Found ${champions.length} champions to save`);
    
    // Save champions to database
    let newCount = 0;
    let updatedCount = 0;
    
    // Get the WrChampion model directly from the NestJS dependency injection container
    const championModel = app.get(getModelToken('WrChampion'));
    
    for (const champion of champions) {
      try {
        // Use findOneAndUpdate with upsert option to handle both cases in one operation
        const result = await championModel.findOneAndUpdate(
          { name: champion.name },
          champion,
          { upsert: true, new: true }
        );
        
        if (result.isNew) {
          console.log(`Created new champion: ${champion.name}`);
          newCount++;
        } else {
          console.log(`Updated existing champion: ${champion.name}`);
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error saving champion ${champion.name}:`, error.message);
      }
    }
    
    console.log(`Finished crawling and saving Wild Rift champion data! New: ${newCount}, Updated: ${updatedCount}`);
    
    // Verify all champions are saved by retrieving them
    const allChampions = await wildriftService.findAllChampions({ limit: 1000 });
    console.log(`Total champions in database: ${allChampions.total}`);
    console.log(`Champion names: ${allChampions.items.map(c => c.name).join(', ')}`);
    
  } catch (error) {
    console.error('Error crawling Wild Rift champion data:', error);
  } finally {
    await app.close();
  }
}

bootstrap(); 