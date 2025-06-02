import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { NewsService } from '../news.service';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';

async function createEnglishArticles() {
  console.log('📝 Creating English sample articles...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const newsService = app.get(NewsService);
  const userModel: Model<UserDocument> = app.get(getModelToken(User.name));

  try {
    // Find admin user or use test ID
    let testUserId = 'test-admin-id';

    const adminUsers = await userModel.find({ role: 'admin' }).limit(1).exec();
    if (adminUsers.length > 0) {
      testUserId = adminUsers[0]._id.toString();
      console.log(`✅ Using admin user: ${adminUsers[0].name}`);
    } else {
      console.log(`⚠️ No admin user found, using test ID`);
    }

    // Article 1: League of Legends Guide
    const article1 = {
      title: 'Complete League of Legends Beginner Guide 2024',
      content: `
# Complete League of Legends Beginner Guide 2024

Welcome to the ultimate League of Legends beginner guide! Whether you're completely new to MOBAs or just starting your journey in Runeterra, this comprehensive guide will help you understand the basics and start climbing the ranked ladder.

## What is League of Legends?

League of Legends (LoL) is a multiplayer online battle arena (MOBA) game where two teams of five players compete to destroy the enemy's Nexus. Each player controls a champion with unique abilities and works together with their team to achieve victory.

## Basic Game Concepts

### The Map (Summoner's Rift)
- **Three Lanes**: Top, Middle (Mid), and Bottom (Bot)
- **Jungle**: The area between lanes filled with neutral monsters
- **River**: Divides the map and contains important objectives

### Roles and Positions
1. **Top Lane**: Usually a tanky champion or fighter
2. **Jungle**: Roams between lanes, helps teammates
3. **Mid Lane**: Often a mage or assassin with high damage
4. **ADC (Bot Lane)**: Attack Damage Carry, main damage dealer
5. **Support (Bot Lane)**: Protects and enables the ADC

## Essential Tips for New Players

### 1. Focus on Fundamentals
- **Last-hitting minions** for gold (farming)
- **Map awareness** - always watch the minimap
- **Warding** - place wards to gain vision
- **Positioning** - stay safe in team fights

### 2. Champion Selection
- Start with simple champions
- Master 2-3 champions per role
- Understand your champion's power spikes

### 3. Game Phases
- **Early Game** (0-15 min): Focus on farming and small trades
- **Mid Game** (15-30 min): Group with team, contest objectives
- **Late Game** (30+ min): Team fights decide the game

## Recommended Champions for Beginners

### Top Lane
- **Garen**: Simple kit, tanky, good sustain
- **Malphite**: Easy to play, great team fight ultimate

### Jungle
- **Warwick**: Built-in sustain, easy clear
- **Amumu**: Simple kit, great team fighting

### Mid Lane
- **Annie**: Easy last-hitting, straightforward combo
- **Malzahar**: Safe farming, good crowd control

### ADC
- **Caitlyn**: Long range, safe positioning
- **Tristana**: Good escape, scales well

### Support
- **Soraka**: Simple healing support
- **Leona**: Tanky engage support

## Common Mistakes to Avoid

1. **Overextending** without vision
2. **Not buying wards** or ignoring vision
3. **Chasing kills** instead of objectives
4. **Not farming properly**
5. **Poor positioning** in team fights

## Conclusion

League of Legends has a steep learning curve, but with practice and patience, you'll improve steadily. Focus on the fundamentals, learn from your mistakes, and most importantly, have fun!

Remember: every professional player started as a beginner. Your journey in League of Legends is just beginning!
      `,
      summary:
        'A comprehensive beginner guide to League of Legends covering basic concepts, roles, champions, and essential tips for new players in 2024.',
      tags: [
        'league of legends',
        'beginner',
        'guide',
        'tutorial',
        'moba',
        '2024',
      ],
      imageUrl: 'https://example.com/lol-beginner-guide.jpg',
      lang: 'en',
      published: true,
    };

    // Article 2: Champion Spotlight
    const article2 = {
      title: 'Ezreal Champion Spotlight: The Prodigal Explorer',
      content: `
# Ezreal Champion Spotlight: The Prodigal Explorer

Ezreal, the Prodigal Explorer, is one of League of Legends' most iconic champions. Known for his skill-shot based kit and incredible mobility, Ezreal is a favorite among ADC players who enjoy high skill expression and outplay potential.

## Champion Overview

**Role**: Marksman (ADC)  
**Difficulty**: Moderate to High  
**Damage Type**: Physical/Magic (Hybrid)  
**Play Style**: Poke, Kite, Burst

## Abilities Breakdown

### Passive - Rising Spell Force
Ezreal gains attack speed for 6 seconds each time he hits an enemy with an ability, stacking up to 5 times. This passive rewards players for weaving abilities between auto-attacks.

### Q - Mystic Shot
**Ezreal's signature ability**
- Fires a projectile that deals physical damage
- Applies on-hit effects
- Reduces all cooldowns by 1.5 seconds when it hits
- Core to Ezreal's gameplay loop

### W - Essence Flux
**Utility and damage ability**
- Fires an orb that marks enemies
- Detonating the mark with abilities or attacks deals magic damage
- Provides attack speed to allies it passes through

### E - Arcane Shift
**Mobility and safety tool**
- Instantly teleports Ezreal to target location
- Fires a homing bolt at nearest enemy
- Primary escape and repositioning tool

### R - Trueshot Barrage
**Global ultimate ability**
- Massive damage beam across the entire map
- Deals decreasing damage to subsequent enemies
- Great for finishing off low-health enemies
- Can be used to clear minion waves

## Build Guide

### Core Items
1. **Tear of the Goddess** → **Manamune** - Essential for mana and damage scaling
2. **Trinity Force** - Perfect synergy with Ezreal's kit
3. **Boots of Lucidity** - Cooldown reduction for more ability casts

### Situational Items
- **Blade of the Ruined King** - Against tanky teams
- **Lord Dominik's Regards** - Armor penetration
- **Guardian Angel** - Defensive option
- **Ravenous Hydra** - Sustain and AoE damage

## Playing Ezreal

### Laning Phase
- Focus on farming with Q (Mystic Shot)
- Poke enemies when safe
- Use E defensively, not aggressively
- Build Tear early for mana sustain

### Team Fighting
- Stay at maximum range
- Use Q to poke before fights
- Position safely behind frontline
- Use E to dodge key abilities
- Look for R opportunities across the map

### Advanced Tips
1. **Weaving Auto-Attacks**: Always auto-attack between abilities
2. **Cooldown Management**: Hit Qs to reduce other cooldowns
3. **E Usage**: Save E for escapes, not gap-closing
4. **Ultimate Timing**: Use R to finish fights or clear waves
5. **Positioning**: Stay at max range, kite backwards

## Pros and Cons

### Pros
✅ High mobility with E  
✅ Safe laning phase  
✅ Scales well into late game  
✅ Global ultimate presence  
✅ High outplay potential  

### Cons
❌ Skill-shot dependent  
❌ Weak early game damage  
❌ Requires good positioning  
❌ Mana hungry early game  
❌ Difficult to master  

## Matchups

### Good Against
- **Immobile ADCs**: Kogmaw, Jinx
- **Short-range champions**: Vayne, Lucian

### Struggles Against
- **Dive champions**: Zed, Fizz
- **Long-range**: Caitlyn, Xerath

## Conclusion

Ezreal is a rewarding champion for players who enjoy skill-based gameplay and high mobility. While he requires practice to master, the payoff is enormous. His safety, scaling, and outplay potential make him a consistent pick in both solo queue and professional play.

Master the art of hitting skill shots, learn proper positioning, and you'll find yourself carrying games as the Prodigal Explorer!
      `,
      summary:
        'In-depth champion guide for Ezreal, covering abilities, builds, gameplay tips, and strategies for mastering the Prodigal Explorer.',
      tags: [
        'ezreal',
        'champion guide',
        'adc',
        'marksman',
        'tutorial',
        'build',
      ],
      imageUrl: 'https://example.com/ezreal-spotlight.jpg',
      lang: 'en',
      published: true,
    };

    const articles = [article1, article2];
    let successCount = 0;
    let errorCount = 0;

    console.log('🚀 Creating articles...\n');

    for (let i = 0; i < articles.length; i++) {
      const articleData = articles[i];
      try {
        console.log(`📝 Creating article ${i + 1}: "${articleData.title}"`);

        const createdArticle = await newsService.create(
          articleData,
          testUserId,
        );

        console.log(`✅ Success! Created article:`);
        console.log(`   ID: ${(createdArticle as any)._id}`);
        console.log(`   Slug: ${createdArticle.slug}`);
        console.log(`   Language: ${createdArticle.lang}`);
        console.log(`   Published: ${createdArticle.published}\n`);

        successCount++;
      } catch (error) {
        console.log(`❌ Error creating article ${i + 1}: ${error.message}\n`);
        errorCount++;
      }
    }

    console.log('📊 CREATION SUMMARY:');
    console.log(`✅ Successfully created: ${successCount} articles`);
    console.log(`❌ Errors: ${errorCount} articles`);

    // Test the created articles
    if (successCount > 0) {
      console.log('\n🧪 Testing created English articles...');

      const enArticles = await newsService.findAll(10, 1, 'en');
      console.log(`\n📖 Found ${enArticles.articles.length} English articles:`);

      enArticles.articles.forEach((article, index) => {
        console.log(`${index + 1}. "${article.title}" (${article.slug})`);
      });

      // Test tag search
      if (enArticles.articles.length > 0) {
        console.log('\n🏷️ Testing tag search for "guide":');
        const taggedArticles = await newsService.findByTag(
          'guide',
          10,
          1,
          'en',
        );
        console.log(
          `Found ${taggedArticles.articles.length} articles with tag "guide"`,
        );
      }
    }

    console.log('\n🌐 You can now test these API endpoints:');
    console.log(
      'GET /news?lang=en                     - Get all English articles',
    );
    console.log(
      'GET /news/tag/guide?lang=en           - Search for "guide" tag',
    );
    console.log(
      'GET /news/admin?lang=en               - Admin view of English articles',
    );
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  } finally {
    await app.close();
    console.log('\n🏁 Article creation completed');
  }
}

// Run script
createEnglishArticles()
  .then(() => {
    console.log('\n✨ English articles creation finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 English articles creation failed:', error);
    process.exit(1);
  });
