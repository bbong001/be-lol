import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { ChampionDocument } from '../schemas/champion.schema';

class FixStartingItems {
  constructor(private championModel: Model<ChampionDocument>) {}

  // Enhanced mapping for starting items
  private viToEnItemMapping = {
    // Starting Items
    'Nhẫn Doran': "Doran's Ring",
    'Khiên Doran': "Doran's Shield",
    'Kiếm Doran': "Doran's Blade",
    'Bình Máu': 'Health Potion',
    'Thuốc Tái Sử Dụng': 'Refillable Potion',
    'Nước Mắt Nữ Thần': 'Tear of the Goddess',
    Giày: 'Boots',
    'Mắt Sủng': 'Control Ward',
    'Tôm Khô': 'Cull',
    'Thần Khí': 'Relic Shield',
    'Lưỡi Thép': 'Steel Shoulderguards',
    'Chiếc Móng': 'Spectral Sickle',

    // Jungle Items
    'Linh Hồn Phong Hồ': 'Serrated Dirk',
    'Linh Hồn Hỏa Khuyển': 'Hailblade',
    'Linh Hồn Mộc Long': 'Mosstomper Seedling',

    // Basic Items
    'Kiếm Dài': 'Long Sword',
    'Áo Choàng': 'Cloth Armor',
    'Nhẫn Rubbie': 'Ruby Crystal',
    'Lá Chắn': 'Dagger',
    'Lưỡi Hái': 'Cull',
    'Bụi Lấp Lánh': 'Faerie Charm',
    'Phong Ấn Hắc Ám': 'Dark Seal',
    'Lam Ngọc': 'Sapphire Crystal',

    // Additional items found in starting items
    'Đá Sức Mạnh': 'Amplifying Tome',
    'Cuốn Sách': 'Tome',
    Gậy: 'Rod',
  };

  /**
   * Convert string item to multilingual object
   */
  private convertStartingItem(item: any): any {
    if (typeof item === 'string') {
      const englishName = this.viToEnItemMapping[item] || item;
      return {
        en: englishName,
        vi: item,
      };
    }
    return item; // Already converted or unknown format
  }

  /**
   * Fix starting items in recommendedItems structure
   */
  private fixRecommendedItems(items: any[]) {
    if (!items || items.length === 0) return items;

    let hasChanges = false;

    items.forEach((itemGroup) => {
      // Fix 'starting' field (this is the main one that needs fixing)
      if (itemGroup.starting) {
        itemGroup.starting.forEach((startGroup) => {
          if (startGroup.items) {
            startGroup.items.forEach((item, index) => {
              if (typeof item === 'string') {
                const convertedItem = this.convertStartingItem(item);
                startGroup.items[index] = convertedItem;
                hasChanges = true;
              }
            });
          }
        });
      }

      // Also fix 'startingItems' field (just in case)
      if (itemGroup.startingItems) {
        itemGroup.startingItems.forEach((startGroup) => {
          if (startGroup.items) {
            startGroup.items.forEach((item, index) => {
              if (typeof item === 'string') {
                const convertedItem = this.convertStartingItem(item);
                startGroup.items[index] = convertedItem;
                hasChanges = true;
              }
            });
          }
        });
      }
    });

    return hasChanges ? items : null;
  }

  /**
   * Fix all champions
   */
  async fixAllChampions() {
    console.log('🔧 Fixing Starting Items Conversion');
    console.log('===================================');

    const champions = await this.championModel.find().lean();
    let processedCount = 0;
    let updatedCount = 0;
    let totalStartingItems = 0;
    let convertedItems = 0;

    for (const champion of champions) {
      try {
        console.log(`🔄 Processing ${champion.id}...`);
        processedCount++;

        const updateData: any = {};
        let needsUpdate = false;

        // Fix recommended items
        if (champion.recommendedItems && champion.recommendedItems.length > 0) {
          const fixedItems = this.fixRecommendedItems(
            champion.recommendedItems,
          );
          if (fixedItems) {
            updateData.recommendedItems = fixedItems;
            needsUpdate = true;

            // Count converted items for this champion
            fixedItems.forEach((itemGroup) => {
              if (itemGroup.starting) {
                itemGroup.starting.forEach((startGroup) => {
                  if (startGroup.items) {
                    startGroup.items.forEach((item) => {
                      totalStartingItems++;
                      if (typeof item === 'object' && item.en && item.vi) {
                        convertedItems++;
                      }
                    });
                  }
                });
              }
            });

            console.log(`✅ Fixed starting items for ${champion.id}`);
          }
        }

        // Update in database
        if (needsUpdate) {
          await this.championModel.updateOne(
            { _id: champion._id },
            { $set: updateData },
          );
          updatedCount++;
        } else {
          console.log(`⏭️  No starting item fixes needed for ${champion.id}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${champion.id}:`, error.message);
      }
    }

    console.log(`\n📊 Fix Summary:`);
    console.log(`✅ Processed: ${processedCount}`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`🔄 Total starting items converted: ${convertedItems}`);

    return { processedCount, updatedCount, convertedItems };
  }
}

async function runStartingItemsFix() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championModel = app.get('ChampionModel');
    const fixer = new FixStartingItems(championModel);

    await fixer.fixAllChampions();

    console.log('\n🎉 Starting items fix completed!');
    console.log('\n🔗 Test with: npm run check:starting-items');
  } catch (error) {
    console.error('❌ Starting items fix failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

runStartingItemsFix().catch(console.error);
