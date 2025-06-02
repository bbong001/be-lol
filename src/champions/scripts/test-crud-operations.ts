import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { ChampionsService } from '../champions.service';
import { CreateChampionDto } from '../dto/create-champion.dto';
import { UpdateChampionDto } from '../dto/update-champion.dto';

async function testCrudOperations() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const championsService = app.get(ChampionsService);

  try {
    console.log('🧪 Testing Champion CRUD Operations...\n');

    // Test 1: Create a new champion
    console.log('1️⃣ Testing CREATE operation...');
    const createChampionDto: CreateChampionDto = {
      name: 'Test Champion',
      id: 'TestChampion',
      title: 'The Test Champion',
      imageUrl: 'https://example.com/test-champion.jpg',
      splashUrl: 'https://example.com/test-champion-splash.jpg',
      stats: {
        hp: 580,
        hpperlevel: 90,
        mp: 338,
        mpperlevel: 38,
        movespeed: 345,
        armor: 33,
        armorperlevel: 3.2,
        spellblock: 32,
        spellblockperlevel: 1.3,
        attackrange: 175,
        hpregen: 8.5,
        hpregenperlevel: 0.55,
        mpregen: 8.2,
        mpregenperlevel: 0.45,
        crit: 0,
        critperlevel: 0,
        attackdamage: 60,
        attackdamageperlevel: 3.2,
        attackspeedperlevel: 2.5,
        attackspeed: 0.658,
      },
      abilities: [
        {
          name: 'Test Ability Q',
          description: 'This is a test Q ability',
          imageUrl: 'https://example.com/test-q.jpg',
        },
        {
          name: 'Test Ability W',
          description: 'This is a test W ability',
          imageUrl: 'https://example.com/test-w.jpg',
        },
      ],
      tags: ['Fighter', 'Test'],
      counters: ['Malphite', 'Rammus'],
      strongAgainst: ['Yasuo', 'Zed'],
      recommendedRunes: [
        {
          primary: 'Precision',
          keystone: 'Conqueror',
          runes: ['Triumph', 'Legend: Alacrity', 'Last Stand'],
        },
      ],
      recommendedItems: [
        {
          name: "Doran's Blade",
          cost: 450,
        },
        {
          name: "Berserker's Greaves",
          cost: 1100,
        },
      ],
    };

    const createdChampion = await championsService.create(createChampionDto);
    console.log('✅ Champion created successfully:', createdChampion.name);
    const championId = (createdChampion as any)._id.toString();
    console.log('   Champion ID:', championId);

    // Test 2: Read the created champion
    console.log('\n2️⃣ Testing READ operation...');
    const foundChampion = await championsService.findById(championId);
    console.log('✅ Champion found:', foundChampion?.name);

    // Test 3: Update the champion
    console.log('\n3️⃣ Testing UPDATE operation...');
    const updateChampionDto: UpdateChampionDto = {
      title: 'The Updated Test Champion',
      tags: ['Fighter', 'Test', 'Updated'],
      stats: {
        ...createdChampion.stats,
        hp: 600, // Update HP
      },
    };

    const updatedChampion = await championsService.update(
      championId,
      updateChampionDto,
    );
    console.log('✅ Champion updated successfully');
    console.log('   New title:', updatedChampion.title);
    console.log('   New HP:', updatedChampion.stats?.hp);

    // Test 4: Test search functionality
    console.log('\n4️⃣ Testing SEARCH operation...');
    const searchResult = await championsService.findByName('Test Champion');
    console.log('✅ Champion found by name:', searchResult?.name);

    // Test 5: Delete the champion
    console.log('\n5️⃣ Testing DELETE operation...');
    const deleteResult = await championsService.remove(championId);
    console.log('✅ Champion deleted:', deleteResult.message);

    // Test 6: Verify deletion
    console.log('\n6️⃣ Verifying deletion...');
    try {
      await championsService.findById(championId);
      console.log('❌ Champion still exists after deletion');
    } catch (error) {
      console.log('✅ Champion successfully deleted - not found in database');
    }

    console.log('\n🎉 All CRUD operations completed successfully!');
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await app.close();
  }
}

// Run the test
testCrudOperations().catch(console.error);
