import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get the models directly
    const championModel = app.get(getModelToken('WrChampion'));
    const buildModel = app.get(getModelToken('WrChampionBuild'));
    const itemModel = app.get(getModelToken('WrItem'));

    // Find Aatrox data
    const championName = process.argv[2] || 'Aatrox';
    console.log(`Checking data for ${championName}...`);

    const champion = await championModel.findOne({ name: championName }).lean();

    if (!champion) {
      console.log(`No data found for ${championName}`);
      return;
    }

    console.log('\nChampion Details:');
    console.log('- Name:', champion.name);
    console.log('- Title:', champion.title);
    console.log('- Roles:', champion.roles.join(', '));
    console.log('- Description:', champion.description);
    console.log('- Image URL:', champion.imageUrl);
    console.log('- Splash URL:', champion.splashUrl);
    console.log('- Patch:', champion.patch);

    console.log('\nStats:');
    console.log(JSON.stringify(champion.stats, null, 2));

    console.log('\nAbilities:');
    console.log('- Passive:', champion.abilities.passive.name);
    console.log('  Description:', champion.abilities.passive.description);
    console.log('  Image:', champion.abilities.passive.imageUrl);

    console.log('- Q:', champion.abilities.q.name);
    console.log('  Description:', champion.abilities.q.description);
    console.log('  Image:', champion.abilities.q.imageUrl);
    console.log('  Cooldown:', champion.abilities.q.cooldown);

    console.log('- W:', champion.abilities.w.name);
    console.log('  Description:', champion.abilities.w.description);
    console.log('  Image:', champion.abilities.w.imageUrl);
    console.log('  Cooldown:', champion.abilities.w.cooldown);

    console.log('- E:', champion.abilities.e.name);
    console.log('  Description:', champion.abilities.e.description);
    console.log('  Image:', champion.abilities.e.imageUrl);
    console.log('  Cooldown:', champion.abilities.e.cooldown);

    console.log('- Ultimate:', champion.abilities.ultimate.name);
    console.log('  Description:', champion.abilities.ultimate.description);
    console.log('  Image:', champion.abilities.ultimate.imageUrl);
    console.log('  Cooldown:', champion.abilities.ultimate.cooldown);

    // Find builds
    const builds = await buildModel.find({ championId: champion._id }).lean();

    console.log(`\nFound ${builds.length} builds:`);

    for (const build of builds) {
      console.log(`\n${build.buildType || 'Default'} Build:`);

      // Display starting items with image URLs
      console.log('\nStarting Items:');
      if (build.startingItems && build.startingItems.length > 0) {
        for (const item of build.startingItems) {
          console.log(`- ${item.name}`);
          console.log(`  Image: ${item.imageUrl}`);
        }
      } else {
        console.log('None');
      }

      // Display core items with image URLs
      console.log('\nCore Items:');
      if (build.coreItems && build.coreItems.length > 0) {
        for (const item of build.coreItems) {
          console.log(`- ${item.name}`);
          console.log(`  Image: ${item.imageUrl}`);
        }
      } else {
        console.log('None');
      }

      // Display boots with image URLs
      console.log('\nBoots:');
      if (build.boots && build.boots.length > 0) {
        for (const item of build.boots) {
          console.log(`- ${item.name}`);
          console.log(`  Image: ${item.imageUrl}`);
        }
      } else {
        console.log('None');
      }

      // Display enchantments with image URLs
      console.log('\nEnchantments:');
      if (build.enchantments && build.enchantments.length > 0) {
        for (const item of build.enchantments) {
          console.log(`- ${item.name}`);
          console.log(`  Image: ${item.imageUrl}`);
        }
      } else {
        console.log('None');
      }

      // Display final build items with image URLs
      console.log('\nFinal Build Items:');
      if (build.finalBuildItems && build.finalBuildItems.length > 0) {
        for (const item of build.finalBuildItems) {
          console.log(`- ${item.name}`);
          console.log(`  Image: ${item.imageUrl}`);
        }
      } else {
        console.log('None');
      }

      // Display situational items with image URLs
      console.log('\nSituational Items:');
      if (build.situationalItems && build.situationalItems.length > 0) {
        for (const item of build.situationalItems) {
          console.log(`- ${item.name}`);
          console.log(`  Image: ${item.imageUrl}`);
        }
      } else {
        console.log('None');
      }

      // Display spells with image URLs
      console.log('\nSpells:');
      if (build.spells && build.spells.length > 0) {
        for (const spell of build.spells) {
          console.log(`- ${spell.name}`);
          console.log(`  Image: ${spell.imageUrl}`);
        }
      } else {
        console.log('None');
      }

      // Display runes with image URLs
      console.log('\nRunes:');
      if (build.runes && build.runes.length > 0) {
        for (const rune of build.runes) {
          console.log(`- ${rune.name}`);
          console.log(`  Image: ${rune.imageUrl}`);
        }
      } else {
        console.log('None');
      }

      // Display situational runes with image URLs
      console.log('\nSituational Runes:');
      if (build.situationalRunes && build.situationalRunes.length > 0) {
        for (const rune of build.situationalRunes) {
          console.log(`- ${rune.name}`);
          console.log(`  Image: ${rune.imageUrl}`);
        }
      } else {
        console.log('None');
      }

      // Display skill order
      console.log('\nSkill Order:', build.skillOrder.join(' > ') || 'None');
    }

    // Check if there are recommended items in champion data
    if (champion.recommendedItems && champion.recommendedItems.length > 0) {
      console.log('\nRecommended Items from Champion Data:');

      // Find details for each recommended item
      for (const itemName of champion.recommendedItems) {
        const item = await itemModel.findOne({ name: itemName }).lean();
        if (item) {
          console.log(`- ${item.name}`);
          console.log(`  Image: ${item.imageUrl}`);
          console.log(`  Description: ${item.description}`);
          console.log(`  Price: ${item.price}`);
        } else {
          console.log(`- ${itemName} (Item details not found)`);
        }
      }
    }

    // Return the complete champion data with builds as JSON
    const completeData = {
      ...champion,
      builds,
    };

    console.log('\nComplete JSON data:');
    console.log(JSON.stringify(completeData, null, 2));
  } catch (error) {
    console.error('Error checking champion details:', error);
  } finally {
    await app.close();
  }
}

// Execute the script
bootstrap();
