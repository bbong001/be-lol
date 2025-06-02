import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { WildriftService } from '../wildrift.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const wildriftService = app.get(WildriftService);

  try {
    console.log('🔍 Checking Wild Rift items in database...\n');

    // Get all items from database
    const allItemsResult = await wildriftService.findAllItems({ limit: 1000 });
    const { items, total } = allItemsResult;

    console.log(`📊 Total items in database: ${total}\n`);

    if (total === 0) {
      console.log('❌ No items found in database');
      console.log('💡 Run "npm run crawl:wr-items" to crawl items first');
      return;
    }

    // Group items by category
    const itemsByCategory = items.reduce(
      (acc, item) => {
        const category = item.category || 'Unknown';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(item);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    console.log('📋 Items by category:\n');
    Object.entries(itemsByCategory).forEach(([category, categoryItems]) => {
      console.log(`🎯 ${category}: ${categoryItems.length} items`);

      // Show first 5 items in each category
      const itemsToShow = categoryItems.slice(0, 5);
      itemsToShow.forEach((item, index) => {
        const hasImage = item.imageUrl ? '🖼️' : '❌';
        console.log(`   ${index + 1}. ${item.name} ${hasImage}`);
      });

      if (categoryItems.length > 5) {
        console.log(`   ... and ${categoryItems.length - 5} more items`);
      }
      console.log('');
    });

    // Check for items without images
    const itemsWithoutImages = items.filter((item) => !item.imageUrl);
    if (itemsWithoutImages.length > 0) {
      console.log(`⚠️  Items without images: ${itemsWithoutImages.length}`);
      itemsWithoutImages.slice(0, 10).forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.name} (${item.category})`);
      });
      if (itemsWithoutImages.length > 10) {
        console.log(`   ... and ${itemsWithoutImages.length - 10} more`);
      }
      console.log('');
    }

    // Check for duplicate names
    const nameCount = {};
    items.forEach((item) => {
      const name = item.name.toLowerCase();
      nameCount[name] = (nameCount[name] || 0) + 1;
    });

    const duplicates = Object.entries(nameCount).filter(
      ([, count]) => (count as number) > 1,
    );
    if (duplicates.length > 0) {
      console.log(`⚠️  Duplicate item names found: ${duplicates.length}`);
      duplicates.slice(0, 10).forEach(([name, count]) => {
        console.log(`   "${name}": ${count} times`);
      });
      if (duplicates.length > 10) {
        console.log(`   ... and ${duplicates.length - 10} more`);
      }
      console.log('');
    }

    // Show sample items with details
    console.log('📋 Sample items with full details:\n');
    const sampleItems = items.slice(0, 3);
    sampleItems.forEach((item, index) => {
      console.log(`${index + 1}. 📄 ${item.name}`);
      console.log(`   Category: ${item.category}`);
      console.log(`   Price: ${item.price} gold`);
      console.log(`   Image: ${item.imageUrl ? '✅ Available' : '❌ Missing'}`);
      console.log(`   Description: ${item.description || 'No description'}`);
      console.log(
        `   Stats: ${Object.keys(item.stats || {}).length} properties`,
      );
      console.log(`   Active: ${item.isActive ? 'Yes' : 'No'}`);
      console.log(`   Patch: ${item.patch}`);
      console.log('');
    });

    console.log('✅ Check completed!');
  } catch (error) {
    console.error('❌ Error checking Wild Rift items:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
