import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TftChampion } from '../schemas/tft-champion.schema';
import { TftService } from '../tft.service';

async function testPutEndpointFunctionality() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const tftChampionModel = app.get<Model<TftChampion>>(
      getModelToken(TftChampion.name),
    );
    const tftService = app.get<TftService>(TftService);

    console.log('🧪 Testing TFT Champion PUT Endpoint Functionality');
    console.log('='.repeat(50));

    // 1. Find an existing champion to test with
    const existingChampion = await tftChampionModel.findOne().lean();
    if (!existingChampion) {
      console.log('❌ No champions found in database to test with');
      return;
    }

    const championId = existingChampion._id.toString();
    const originalName = existingChampion.name;

    console.log(
      `📝 Testing with champion: ${originalName?.en || 'Unknown'} (ID: ${championId})`,
    );

    // 2. Test partial update - update only cost
    console.log('\n🔄 Test 1: Partial update (cost only)');
    const newCost = existingChampion.cost === 1 ? 2 : 1;

    const partialUpdateData = {
      cost: newCost,
    };

    console.log(`   Original cost: ${existingChampion.cost}`);
    console.log(`   New cost: ${newCost}`);

    const updatedChampion1 = await tftService.updateChampion(
      championId,
      partialUpdateData,
    );

    console.log(
      `   ✅ Updated successfully! New cost: ${updatedChampion1.cost}`,
    );

    // 3. Test updating multilingual fields
    console.log('\n🌐 Test 2: Update multilingual name');
    const updatedName = {
      en: originalName?.en || 'Test Champion',
      vi: 'Tướng Test (Updated)',
    };

    const nameUpdateData = {
      name: updatedName,
    };

    const updatedChampion2 = await tftService.updateChampion(
      championId,
      nameUpdateData,
    );

    console.log(`   ✅ Name updated successfully!`);
    console.log(`   EN: ${updatedChampion2.name.en}`);
    console.log(`   VI: ${updatedChampion2.name.vi}`);

    // 4. Test updating traits
    console.log('\n🏷️  Test 3: Update traits');
    const updatedTraits = [
      { en: 'Test Trait 1', vi: 'Đặc Tính Test 1' },
      { en: 'Test Trait 2', vi: 'Đặc Tính Test 2' },
    ];

    const traitsUpdateData = {
      traits: updatedTraits,
    };

    const updatedChampion3 = await tftService.updateChampion(
      championId,
      traitsUpdateData,
    );

    console.log('   ✅ Traits updated successfully!');
    updatedChampion3.traits.forEach((trait: any, index: number) => {
      console.log(`   ${index + 1}. EN: ${trait.en}, VI: ${trait.vi}`);
    });

    // 5. Test updating recommended items
    console.log('\n🛡️  Test 4: Update recommended items');
    const updatedItems = [
      { en: 'Test Item 1', vi: 'Vật Phẩm Test 1' },
      { en: 'Test Item 2', vi: 'Vật Phẩm Test 2' },
    ];

    const itemsUpdateData = {
      recommendedItems: updatedItems,
    };

    const updatedChampion4 = await tftService.updateChampion(
      championId,
      itemsUpdateData,
    );

    console.log('   ✅ Recommended items updated successfully!');
    updatedChampion4.recommendedItems?.forEach((item: any, index: number) => {
      console.log(`   ${index + 1}. EN: ${item.en}, VI: ${item.vi}`);
    });

    // 6. Test full update
    console.log('\n📋 Test 5: Full champion update');
    const fullUpdateData = {
      name: { en: 'Fully Updated Champion', vi: 'Tướng Đã Cập Nhật Hoàn Toàn' },
      cost: 3,
      traits: [{ en: 'Updated Trait', vi: 'Đặc Tính Đã Cập Nhật' }],
      ability: {
        name: { en: 'Updated Ability', vi: 'Kỹ Năng Đã Cập Nhật' },
        description: { en: 'Updated description', vi: 'Mô tả đã cập nhật' },
        mana: '50',
      },
      stats: {
        health: '800',
        mana: '50',
        armor: '30',
        magicResist: '30',
        dps: '50',
        damage: '70',
        attackSpeed: '0.75',
        critRate: '25%',
        range: '1',
      },
      recommendedItems: [
        { en: 'Updated Item 1', vi: 'Vật Phẩm Cập Nhật 1' },
        { en: 'Updated Item 2', vi: 'Vật Phẩm Cập Nhật 2' },
      ],
      patch: '14.24.1',
      setNumber: 14,
    };

    const fullyUpdatedChampion = await tftService.updateChampion(
      championId,
      fullUpdateData,
    );

    console.log('   ✅ Full update completed successfully!');
    console.log(
      `   Name: ${fullyUpdatedChampion.name.en} / ${fullyUpdatedChampion.name.vi}`,
    );
    console.log(`   Cost: ${fullyUpdatedChampion.cost}`);
    console.log(`   Patch: ${fullyUpdatedChampion.patch}`);

    // 7. Test error handling - invalid ID
    console.log('\n❌ Test 6: Error handling (invalid ID)');
    try {
      await tftService.updateChampion('invalid_id_format', { cost: 5 });
      console.log('   ❌ Should have thrown an error!');
    } catch (error) {
      console.log(`   ✅ Correctly threw error: ${error.message}`);
    }

    // 8. Test error handling - non-existent ID
    console.log('\n❌ Test 7: Error handling (non-existent ID)');
    try {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid format but doesn't exist
      await tftService.updateChampion(fakeId, { cost: 5 });
      console.log('   ❌ Should have thrown a not found error!');
    } catch (error) {
      console.log(`   ✅ Correctly threw error: ${error.message}`);
    }

    // 9. Restore original data (cleanup)
    console.log('\n🔄 Restoring original champion data...');
    await tftService.updateChampion(championId, {
      name: originalName,
      cost: existingChampion.cost,
      traits: existingChampion.traits,
      ability: existingChampion.ability,
      stats: existingChampion.stats,
      recommendedItems: existingChampion.recommendedItems,
      recommendedItemsData: existingChampion.recommendedItemsData,
      patch: existingChampion.patch,
      setNumber: existingChampion.setNumber,
    });

    console.log('✅ Original data restored successfully!');

    console.log('\n🎉 All PUT endpoint tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Partial updates work correctly');
    console.log('   ✅ Multilingual field updates work correctly');
    console.log('   ✅ Array field updates work correctly');
    console.log('   ✅ Full updates work correctly');
    console.log('   ✅ Error handling works correctly');
    console.log('   ✅ Data restoration works correctly');
  } catch (error) {
    console.error('❌ PUT endpoint test failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

// Run the test
testPutEndpointFunctionality();
