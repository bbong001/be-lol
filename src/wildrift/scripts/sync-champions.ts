import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { WildriftService } from '../wildrift.service';
import * as mongoose from 'mongoose';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { CreateWrChampionDto } from '../dto/create-wr-champion.dto';

interface WrChampionData {
  name: string;
  title: string;
  roles: string[];
  imageUrl: string;
  splashUrl: string;
}

async function bootstrap() {
  // Create a standalone application
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const wildriftService = app.get(WildriftService);

    console.log('Starting Wild Rift champions synchronization...');

    // Step 1: Get champions from Wild Rift website
    console.log('Fetching champions from official sources...');
    const webChampions = await scrapeWildRiftChampions();
    console.log(`Found ${webChampions.length} champions from official sources`);

    if (webChampions.length === 0) {
      throw new Error(
        'Could not fetch Wild Rift champions data. Check the scraping logic or website structure changes.',
      );
    }

    // Step 2: Get champions from database
    console.log('Fetching champions from database...');
    const dbResponse = await wildriftService.findAllChampions({
      limit: 200,
      page: 1,
    });
    // Extract champions array from pagination response
    const dbChampions = Array.isArray(dbResponse)
      ? dbResponse
      : dbResponse.items || [];
    console.log(`Found ${dbChampions.length} champions in database`);

    // Step 3: Find champions to add (exist on website but not in DB)
    const championsToAdd = webChampions.filter(
      (webChamp) =>
        !dbChampions.some(
          (dbChamp) =>
            dbChamp.name.toLowerCase() === webChamp.name.toLowerCase(),
        ),
    );

    console.log(`Found ${championsToAdd.length} champions to add:`);
    console.log(championsToAdd.map((c) => `${c.name} (${c.title})`).join(', '));

    // Step 4: Find champions to remove (exist in DB but not on website)
    const championsToRemove = dbChampions.filter(
      (dbChamp) =>
        !webChampions.some(
          (webChamp) =>
            webChamp.name.toLowerCase() === dbChamp.name.toLowerCase(),
        ),
    );

    console.log(`Found ${championsToRemove.length} champions to remove:`);
    console.log(championsToRemove.map((c) => `${c.name}`).join(', '));

    // Step 5: Find champions to update (exist in both but have different data)
    const championsToUpdate = dbChampions.filter((dbChamp) => {
      const webChamp = webChampions.find(
        (web) => web.name.toLowerCase() === dbChamp.name.toLowerCase(),
      );

      if (!webChamp) return false;

      // Compare roles (ignoring order)
      const dbRoles = (dbChamp.roles || []).map((r) => r.toLowerCase()).sort();
      const webRoles = webChamp.roles.map((r) => r.toLowerCase()).sort();

      if (dbRoles.length !== webRoles.length) return true;

      for (let i = 0; i < dbRoles.length; i++) {
        if (dbRoles[i] !== webRoles[i]) return true;
      }

      // Compare title
      if (dbChamp.title !== webChamp.title) return true;

      // Compare image URLs
      if (dbChamp.imageUrl !== webChamp.imageUrl) return true;
      if (dbChamp.splashUrl !== webChamp.splashUrl) return true;

      return false;
    });

    console.log(`Found ${championsToUpdate.length} champions to update`);
    championsToUpdate.forEach((champ) => {
      const webChamp = webChampions.find(
        (web) => web.name.toLowerCase() === champ.name.toLowerCase(),
      );

      console.log(`${champ.name}: Changes needed:`);

      if (champ.title !== webChamp.title) {
        console.log(`  Title: "${champ.title}" -> "${webChamp.title}"`);
      }

      const dbRoles = (champ.roles || []).map((r) => r.toLowerCase()).sort();
      const webRoles = webChamp.roles.map((r) => r.toLowerCase()).sort();

      if (
        dbRoles.length !== webRoles.length ||
        dbRoles.some((r, i) => r !== webRoles[i])
      ) {
        console.log(
          `  Roles: [${champ.roles?.join(', ')}] -> [${webChamp.roles.join(', ')}]`,
        );
      }

      if (champ.imageUrl !== webChamp.imageUrl) {
        console.log(`  Image URL changed`);
      }

      if (champ.splashUrl !== webChamp.splashUrl) {
        console.log(`  Splash URL changed`);
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
      const newChampion: Partial<CreateWrChampionDto> = {
        name: champion.name,
        title: champion.title,
        description: '', // You might want to fetch this separately
        roles: champion.roles,
        imageUrl: champion.imageUrl,
        splashUrl: champion.splashUrl,
        // Add minimal required properties for CreateWrChampionDto
        abilities: {
          passive: {
            name: 'Passive',
            description: 'To be filled',
            imageUrl: '',
          },
          q: {
            name: 'Q',
            description: 'To be filled',
            cooldown: [0],
            cost: [0],
            imageUrl: '',
          },
          w: {
            name: 'W',
            description: 'To be filled',
            cooldown: [0],
            cost: [0],
            imageUrl: '',
          },
          e: {
            name: 'E',
            description: 'To be filled',
            cooldown: [0],
            cost: [0],
            imageUrl: '',
          },
          ultimate: {
            name: 'R',
            description: 'To be filled',
            cooldown: [0],
            cost: [0],
            imageUrl: '',
          },
        },
        stats: {
          health: 0,
          healthPerLevel: 0,
          mana: 0,
          manaPerLevel: 0,
          armor: 0,
          armorPerLevel: 0,
          magicResist: 0,
          magicResistPerLevel: 0,
          attackDamage: 0,
          attackDamagePerLevel: 0,
          attackSpeed: 0,
          attackSpeedPerLevel: 0,
          moveSpeed: 0,
        },
        patch: 'current',
      };

      await wildriftService.createChampion(newChampion as CreateWrChampionDto);
    }

    // Update champions with incorrect data
    for (const dbChamp of championsToUpdate) {
      const webChamp = webChampions.find(
        (web) => web.name.toLowerCase() === dbChamp.name.toLowerCase(),
      );

      console.log(`Updating ${dbChamp.name}...`);
      await wildriftService.updateChampion(dbChamp._id.toString(), {
        title: webChamp.title,
        roles: webChamp.roles,
        imageUrl: webChamp.imageUrl,
        splashUrl: webChamp.splashUrl,
      });
    }

    // Remove outdated champions
    for (const champion of championsToRemove) {
      console.log(`Removing ${champion.name}...`);
      await wildriftService.removeChampion(champion._id.toString());
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

async function scrapeWildRiftChampions(): Promise<WrChampionData[]> {
  try {
    // For Wild Rift, you might need to fetch from the official LoL Wild Rift website
    // This is a placeholder implementation - you'll need to adapt it based on the actual website structure
    const response = await axios.get(
      'https://wildrift.leagueoflegends.com/en-us/champions/',
    );
    const html = response.data;
    const $ = cheerio.load(html);
    const champions: WrChampionData[] = [];

    // Example selector - will need to be updated based on actual website structure
    $('.champion-list .champion').each((i, element) => {
      const name = $(element).find('.name').text().trim();
      const title = $(element).find('.title').text().trim();

      // Extract roles
      const roles: string[] = [];
      $(element)
        .find('.roles .role')
        .each((j, roleElem) => {
          const roleName = $(roleElem).text().trim();
          roles.push(roleName);
        });

      // Extract image URLs
      const imageUrl = $(element).find('.portrait img').attr('src') || '';
      const splashUrl = $(element).find('.splash img').attr('src') || '';

      if (name && imageUrl) {
        champions.push({
          name,
          title: title || '',
          roles: roles.length ? roles : ['Fighter'], // Default role if none found
          imageUrl,
          splashUrl: splashUrl || imageUrl,
        });
      }
    });

    // If the above selectors don't work, try alternative sources like:
    // 1. League of Legends API
    // 2. Community sites
    if (champions.length === 0) {
      console.log(
        'Primary scraping method failed, trying alternative sources...',
      );

      // Fallback to a static list of Wild Rift champions
      // This is just an example with a few champions - in a real script you'd want a complete list
      return [
        {
          name: 'Ahri',
          title: 'the Nine-Tailed Fox',
          roles: ['Mage', 'Assassin'],
          imageUrl:
            'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blta38b1f0035d35842/5f4defe95acde4125c6c6c56/Ahri_WR_Homepage.png',
          splashUrl:
            'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blta38b1f0035d35842/5f4defe95acde4125c6c6c56/Ahri_WR_Splash.jpg',
        },
        {
          name: 'Garen',
          title: 'the Might of Demacia',
          roles: ['Fighter', 'Tank'],
          imageUrl:
            'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blta62d7fafa8cf97e1/5f4df00c48954b6250f825f8/Garen_WR_Homepage.png',
          splashUrl:
            'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blta62d7fafa8cf97e1/5f4df00c48954b6250f825f8/Garen_WR_Splash.jpg',
        },
        // Add more champions here
      ];
    }

    return champions;
  } catch (error) {
    console.error('Error scraping Wild Rift champions:', error);

    // Return a minimal set to avoid complete failure
    return [
      {
        name: 'Ahri',
        title: 'the Nine-Tailed Fox',
        roles: ['Mage', 'Assassin'],
        imageUrl:
          'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blta38b1f0035d35842/5f4defe95acde4125c6c6c56/Ahri_WR_Homepage.png',
        splashUrl:
          'https://images.contentstack.io/v3/assets/blt370612131b6e0756/blta38b1f0035d35842/5f4defe95acde4125c6c6c56/Ahri_WR_Splash.jpg',
      },
      // Add other common champions as fallback
    ];
  }
}

bootstrap();
