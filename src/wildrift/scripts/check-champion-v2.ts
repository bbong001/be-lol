import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get the models directly
    const championModel = app.get(getModelToken('WrChampion'));
    const buildModel = app.get(getModelToken('WrChampionBuild'));
    
    // Find champion data
    const championName = process.argv[2] || 'Aatrox';
    console.log(`Checking data for ${championName}...`);
    
    const champion = await championModel.findOne({ name: championName }).lean();
    
    if (!champion) {
      console.log(`No data found for ${championName}`);
      return;
    }
    
    console.log('\n=================== CHAMPION DETAILS ===================');
    console.log('- Name:', champion.name);
    console.log('- Title:', champion.title);
    console.log('- Roles:', champion.roles.join(', '));
    console.log('- Description:', champion.description);
    console.log('- Image URL:', champion.imageUrl);
    console.log('- Splash URL:', champion.splashUrl);
    console.log('- Patch:', champion.patch);
    
    console.log('\n=================== STATS ===================');
    if (champion.stats) {
      console.log('- Health:', champion.stats.health);
      console.log('- Armor:', champion.stats.armor);
      console.log('- Magic Resist:', champion.stats.magicResist);
      console.log('- Attack Damage:', champion.stats.attackDamage);
      console.log('- Attack Speed:', champion.stats.attackSpeed);
      console.log('- Move Speed:', champion.stats.moveSpeed);
    } else {
      console.log('No stats data available');
    }
    
    console.log('\n=================== ABILITIES ===================');
    if (champion.abilities) {
      if (champion.abilities.passive) {
        console.log('PASSIVE: ' + champion.abilities.passive.name);
        console.log('  Description:', champion.abilities.passive.description);
        console.log('  Image:', champion.abilities.passive.imageUrl);
      }
      
      if (champion.abilities.q) {
        console.log('Q: ' + champion.abilities.q.name);
        console.log('  Description:', champion.abilities.q.description);
        console.log('  Cooldown:', champion.abilities.q.cooldown);
        console.log('  Cost:', champion.abilities.q.cost);
        console.log('  Image:', champion.abilities.q.imageUrl);
      }
      
      if (champion.abilities.w) {
        console.log('W: ' + champion.abilities.w.name);
        console.log('  Description:', champion.abilities.w.description);
        console.log('  Cooldown:', champion.abilities.w.cooldown);
        console.log('  Cost:', champion.abilities.w.cost);
        console.log('  Image:', champion.abilities.w.imageUrl);
      }
      
      if (champion.abilities.e) {
        console.log('E: ' + champion.abilities.e.name);
        console.log('  Description:', champion.abilities.e.description);
        console.log('  Cooldown:', champion.abilities.e.cooldown);
        console.log('  Cost:', champion.abilities.e.cost);
        console.log('  Image:', champion.abilities.e.imageUrl);
      }
      
      if (champion.abilities.ultimate) {
        console.log('ULTIMATE: ' + champion.abilities.ultimate.name);
        console.log('  Description:', champion.abilities.ultimate.description);
        console.log('  Cooldown:', champion.abilities.ultimate.cooldown);
        console.log('  Cost:', champion.abilities.ultimate.cost);
        console.log('  Image:', champion.abilities.ultimate.imageUrl);
      }
    } else {
      console.log('No abilities data available');
    }
    
    console.log('\n=================== RECOMMENDED ITEMS ===================');
    if (champion.recommendedItems && champion.recommendedItems.length > 0) {
      champion.recommendedItems.forEach((item, index) => {
        console.log(`Item ${index + 1}: ${item}`);
      });
    } else {
      console.log('No recommended items data available');
    }
    
    // Find builds
    const builds = await buildModel.find({ championId: champion._id }).lean();
    
    console.log(`\n=================== BUILDS (${builds.length}) ===================`);
    
    if (builds.length === 0) {
      console.log('No build data found. You may need to run the build crawler.');
    }
    
    for (const build of builds) {
      console.log(`\n${build.buildType || 'Default'} Build:`);
      
      if (build.startingItems && build.startingItems.length > 0) {
        console.log('- Starting Items:', build.startingItems.map(item => item.name).join(', '));
      }
      
      if (build.coreItems && build.coreItems.length > 0) {
        console.log('- Core Items:', build.coreItems.map(item => item.name).join(', '));
      }
      
      if (build.finalBuildItems && build.finalBuildItems.length > 0) {
        console.log('- Final Build Items:', build.finalBuildItems.map(item => item.name).join(', '));
      }
      
      if (build.boots && build.boots.length > 0) {
        console.log('- Boots:', build.boots.map(item => item.name).join(', '));
      }
      
      if (build.enchantments && build.enchantments.length > 0) {
        console.log('- Enchantments:', build.enchantments.map(item => item.name).join(', '));
      }
      
      if (build.situationalItems && build.situationalItems.length > 0) {
        console.log('- Situational Items:', build.situationalItems.map(item => item.name).join(', '));
      }
      
      if (build.spells && build.spells.length > 0) {
        console.log('- Summoner Spells:', build.spells.map(spell => spell.name).join(', '));
      }
      
      if (build.runes && build.runes.length > 0) {
        console.log('- Runes:', build.runes.map(rune => rune.name).join(', '));
      }
      
      if (build.skillOrder && build.skillOrder.length > 0) {
        console.log('- Skill Order:', build.skillOrder.join(' > '));
      }
    }
    
  } catch (error) {
    console.error('Error checking champion details:', error);
  } finally {
    await app.close();
  }
}

// Execute the script
bootstrap(); 