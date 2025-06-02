import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';

interface WrItemDocument {
  _id: string;
  name: string;
  description?: string;
  stats?: Record<string, any>;
  price?: number;
  buildsFrom?: string[];
  buildsInto?: string[];
  category: string;
  isActive?: boolean;
  activeDescription?: string;
  cooldown?: number;
  imageUrl?: string;
  patch?: string;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    console.log('Checking Wild Rift items from tocchien.net crawl...\n');

    // Get all items from database
    const items: WrItemDocument[] = await itemModel.find({}).lean();
    console.log(`Total items in database: ${items.length}\n`);

    // Group by category
    const itemsByCategory = items.reduce(
      (acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<string, WrItemDocument[]>,
    );

    console.log('=== ITEMS BY CATEGORY ===');
    Object.entries(itemsByCategory).forEach(([category, categoryItems]) => {
      console.log(`\n${category}: ${categoryItems.length} items`);
      categoryItems.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.name}`);
        if (item.imageUrl) {
          console.log(`     Image: ${item.imageUrl}`);
        }
        if (item.price && item.price > 0) {
          console.log(`     Price: ${item.price} gold`);
        }
        if (item.stats && Object.keys(item.stats).length > 0) {
          console.log(`     Stats: ${JSON.stringify(item.stats)}`);
        }
        if (
          item.description &&
          item.description !== `${item.name} - Trang bị Liên Minh Tốc Chiến`
        ) {
          console.log(
            `     Description: ${item.description.substring(0, 100)}...`,
          );
        }
        if (item.isActive && item.activeDescription) {
          console.log(
            `     Active: ${item.activeDescription.substring(0, 100)}...`,
          );
        }
        if (item.buildsFrom && item.buildsFrom.length > 0) {
          console.log(`     Builds from: ${item.buildsFrom.join(', ')}`);
        }
        if (item.buildsInto && item.buildsInto.length > 0) {
          console.log(`     Builds into: ${item.buildsInto.join(', ')}`);
        }
      });
    });

    // Statistics
    console.log('\n=== STATISTICS ===');
    const itemsWithImages = items.filter(
      (item) => item.imageUrl && item.imageUrl.length > 0,
    );
    const itemsWithStats = items.filter(
      (item) => item.stats && Object.keys(item.stats).length > 0,
    );
    const itemsWithPrice = items.filter((item) => item.price && item.price > 0);
    const itemsWithDescription = items.filter(
      (item) =>
        item.description &&
        item.description !== `${item.name} - Trang bị Liên Minh Tốc Chiến`,
    );
    const activeItems = items.filter((item) => item.isActive);
    const itemsWithComponents = items.filter(
      (item) =>
        (item.buildsFrom && item.buildsFrom.length > 0) ||
        (item.buildsInto && item.buildsInto.length > 0),
    );

    console.log(
      `Items with images: ${itemsWithImages.length}/${items.length} (${Math.round((itemsWithImages.length / items.length) * 100)}%)`,
    );
    console.log(
      `Items with stats: ${itemsWithStats.length}/${items.length} (${Math.round((itemsWithStats.length / items.length) * 100)}%)`,
    );
    console.log(
      `Items with price: ${itemsWithPrice.length}/${items.length} (${Math.round((itemsWithPrice.length / items.length) * 100)}%)`,
    );
    console.log(
      `Items with detailed description: ${itemsWithDescription.length}/${items.length} (${Math.round((itemsWithDescription.length / items.length) * 100)}%)`,
    );
    console.log(
      `Active items: ${activeItems.length}/${items.length} (${Math.round((activeItems.length / items.length) * 100)}%)`,
    );
    console.log(
      `Items with build components: ${itemsWithComponents.length}/${items.length} (${Math.round((itemsWithComponents.length / items.length) * 100)}%)`,
    );

    // Sample items for each category
    console.log('\n=== SAMPLE ITEMS ===');
    Object.entries(itemsByCategory).forEach(([category, categoryItems]) => {
      if (categoryItems.length > 0) {
        const sampleItem = categoryItems[0];
        console.log(`\n${category} sample - ${sampleItem.name}:`);
        console.log(`  Image: ${sampleItem.imageUrl || 'No image'}`);
        console.log(`  Price: ${sampleItem.price || 0} gold`);
        console.log(`  Stats: ${JSON.stringify(sampleItem.stats || {})}`);
        console.log(
          `  Description: ${sampleItem.description || 'No description'}`,
        );
        if (sampleItem.isActive) {
          console.log(
            `  Active: ${sampleItem.activeDescription || 'No active description'}`,
          );
        }
      }
    });

    // Check for potential issues
    console.log('\n=== POTENTIAL ISSUES ===');
    const itemsWithoutImages = items.filter(
      (item) => !item.imageUrl || item.imageUrl.length === 0,
    );
    const itemsWithoutStats = items.filter(
      (item) => !item.stats || Object.keys(item.stats).length === 0,
    );
    const itemsWithoutPrice = items.filter(
      (item) => !item.price || item.price === 0,
    );

    if (itemsWithoutImages.length > 0) {
      console.log(`\nItems without images (${itemsWithoutImages.length}):`);
      itemsWithoutImages.slice(0, 10).forEach((item) => {
        console.log(`  - ${item.name}`);
      });
      if (itemsWithoutImages.length > 10) {
        console.log(`  ... and ${itemsWithoutImages.length - 10} more`);
      }
    }

    if (itemsWithoutStats.length > 0) {
      console.log(`\nItems without stats (${itemsWithoutStats.length}):`);
      itemsWithoutStats.slice(0, 10).forEach((item) => {
        console.log(`  - ${item.name}`);
      });
      if (itemsWithoutStats.length > 10) {
        console.log(`  ... and ${itemsWithoutStats.length - 10} more`);
      }
    }

    if (itemsWithoutPrice.length > 0) {
      console.log(`\nItems without price (${itemsWithoutPrice.length}):`);
      itemsWithoutPrice.slice(0, 10).forEach((item) => {
        console.log(`  - ${item.name}`);
      });
      if (itemsWithoutPrice.length > 10) {
        console.log(`  ... and ${itemsWithoutPrice.length - 10} more`);
      }
    }
  } catch (error) {
    console.error('Error checking items:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
