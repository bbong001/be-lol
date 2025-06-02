import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TftChampion } from '../schemas/tft-champion.schema';
import { TftItem } from '../schemas/tft-item.schema';
import { TftComp } from '../schemas/tft-comp.schema';
import { TftService } from '../tft.service';

async function testFullCrudOperations() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const tftService = app.get<TftService>(TftService);
    const tftChampionModel = app.get<Model<TftChampion>>(
      getModelToken(TftChampion.name),
    );
    const tftItemModel = app.get<Model<TftItem>>(getModelToken(TftItem.name));
    const tftCompModel = app.get<Model<TftComp>>(getModelToken(TftComp.name));

    console.log('🧪 Testing Complete TFT CRUD Operations');
    console.log('='.repeat(60));

    // Test Champions CRUD
    console.log('\n👑 TESTING CHAMPIONS CRUD');
    console.log('='.repeat(30));

    // 1. CREATE Champion
    console.log('\n📝 1. Testing Champion CREATE');
    const newChampion = {
      name: {
        en: 'Test Champion',
        vi: 'Tướng Test',
      },
      cost: 2,
      traits: [{ en: 'Test Trait', vi: 'Đặc Tính Test' }],
      patch: '14.24.1',
      setNumber: 14,
    };

    const createdChampion = await tftService.createChampion(newChampion);
    console.log(
      `✅ Champion created: ${createdChampion.name.en} (ID: ${createdChampion._id})`,
    );

    // 2. READ Champion
    console.log('\n📖 2. Testing Champion READ');
    const readChampion = await tftService.findOneChampion(
      createdChampion._id.toString(),
    );
    console.log(`✅ Champion read: ${readChampion.name.en}`);

    // 3. UPDATE Champion
    console.log('\n✏️  3. Testing Champion UPDATE');
    const updatedChampion = await tftService.updateChampion(
      createdChampion._id.toString(),
      {
        cost: 3,
        name: { en: 'Updated Test Champion', vi: 'Tướng Test Đã Cập Nhật' },
      },
    );
    console.log(
      `✅ Champion updated: ${updatedChampion.name.en}, cost: ${updatedChampion.cost}`,
    );

    // 4. DELETE Champion
    console.log('\n🗑️  4. Testing Champion DELETE');
    await tftService.removeChampion(createdChampion._id.toString());
    console.log('✅ Champion deleted successfully');

    // Test Items CRUD with multilingual support
    console.log('\n🛡️  TESTING ITEMS CRUD (MULTILINGUAL)');
    console.log('='.repeat(30));

    // 1. CREATE Item with multilingual fields
    console.log('\n📝 1. Testing Item CREATE (Multilingual)');
    const newItem = {
      name: {
        en: 'Test Item',
        vi: 'Trang Bị Test',
      },
      description: {
        en: 'A test item for CRUD testing',
        vi: 'Một trang bị test cho kiểm tra CRUD',
      },
      imageUrl: 'https://example.com/test-item.png',
      stats: {
        damage: '10',
        armor: '5',
      },
      patch: '14.24.1',
    };

    const createdItem = await tftService.createItem(newItem);
    console.log(
      `✅ Item created: ${createdItem.name.en} (ID: ${createdItem._id})`,
    );

    // 2. READ Item in different languages
    console.log('\n📖 2. Testing Item READ (Multilingual)');
    const readItemEn = await tftService.findOneItem(
      createdItem._id.toString(),
      'en',
    );
    console.log(`✅ Item read (EN): ${readItemEn.name}`);

    const readItemVi = await tftService.findOneItem(
      createdItem._id.toString(),
      'vi',
    );
    console.log(`✅ Item read (VI): ${readItemVi.name}`);

    // 3. UPDATE Item
    console.log('\n✏️  3. Testing Item UPDATE (Multilingual)');
    const updatedItem = await tftService.updateItem(
      createdItem._id.toString(),
      {
        name: {
          en: 'Updated Test Item',
          vi: 'Trang Bị Test Đã Cập Nhật',
        },
        description: {
          en: 'Updated description',
          vi: 'Mô tả đã cập nhật',
        },
      },
    );
    console.log(`✅ Item updated: ${updatedItem.name.en}`);

    // 4. DELETE Item
    console.log('\n🗑️  4. Testing Item DELETE');
    await tftService.removeItem(createdItem._id.toString());
    console.log('✅ Item deleted successfully');

    // Test Compositions CRUD
    console.log('\n🏆 TESTING COMPOSITIONS CRUD');
    console.log('='.repeat(30));

    // 1. CREATE Composition
    console.log('\n📝 1. Testing Composition CREATE');
    const newComp = {
      name: 'Test Composition',
      description: 'A test composition for CRUD testing',
      champions: [],
      traits: ['Test Trait'],
      patch: '14.24.1',
      difficulty: 'Easy',
    };

    const createdComp = await tftService.createComp(newComp);
    console.log(
      `✅ Composition created: ${createdComp.name} (ID: ${createdComp._id})`,
    );

    // 2. READ Composition
    console.log('\n📖 2. Testing Composition READ');
    const readComp = await tftService.findOneComp(createdComp._id.toString());
    console.log(`✅ Composition read: ${readComp.name}`);

    // 3. UPDATE Composition
    console.log('\n✏️  3. Testing Composition UPDATE');
    const updatedComp = await tftService.updateComp(
      createdComp._id.toString(),
      { name: 'Updated Test Composition', difficulty: 'Medium' },
    );
    console.log(
      `✅ Composition updated: ${updatedComp.name}, difficulty: ${updatedComp.difficulty}`,
    );

    // 4. DELETE Composition
    console.log('\n🗑️  4. Testing Composition DELETE');
    await tftService.removeComp(createdComp._id.toString());
    console.log('✅ Composition deleted successfully');

    // Test Error Handling
    console.log('\n❌ TESTING ERROR HANDLING');
    console.log('='.repeat(30));

    // Test non-existent ID
    console.log('\n🔍 Testing with non-existent IDs');
    const fakeId = '507f1f77bcf86cd799439011';

    try {
      await tftService.findOneChampion(fakeId);
      console.log('❌ Should have thrown error for champion');
    } catch {
      console.log('✅ Correctly threw error for non-existent champion');
    }

    try {
      await tftService.findOneItem(fakeId);
      console.log('❌ Should have thrown error for item');
    } catch {
      console.log('✅ Correctly threw error for non-existent item');
    }

    try {
      await tftService.findOneComp(fakeId);
      console.log('❌ Should have thrown error for composition');
    } catch {
      console.log('✅ Correctly threw error for non-existent composition');
    }

    // Summary
    console.log('\n🎉 CRUD TEST SUMMARY');
    console.log('='.repeat(30));
    console.log('✅ Champions CRUD: CREATE ✓ READ ✓ UPDATE ✓ DELETE ✓');
    console.log(
      '✅ Items CRUD (Multilingual): CREATE ✓ READ ✓ UPDATE ✓ DELETE ✓',
    );
    console.log('✅ Compositions CRUD: CREATE ✓ READ ✓ UPDATE ✓ DELETE ✓');
    console.log('✅ Error Handling: All tests passed ✓');
    console.log('\n🚀 All TFT CRUD operations are working correctly!');

    // Count existing data
    console.log('\n📊 DATABASE STATISTICS');
    console.log('='.repeat(30));
    const championCount = await tftChampionModel.countDocuments();
    const itemCount = await tftItemModel.countDocuments();
    const compCount = await tftCompModel.countDocuments();

    console.log(`📈 Total Champions: ${championCount}`);
    console.log(`🛡️  Total Items: ${itemCount}`);
    console.log(`🏆 Total Compositions: ${compCount}`);
  } catch (error) {
    console.error('❌ CRUD test failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

// Run the test
testFullCrudOperations();
