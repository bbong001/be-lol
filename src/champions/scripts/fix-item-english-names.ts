import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { ChampionDocument } from '../schemas/champion.schema';

class FixItemEnglishNames {
  constructor(private championModel: Model<ChampionDocument>) {}

  // COMPLETE mapping từ Vietnamese sang English cho items
  private viToEnItemMapping = {
    // ===== STARTING ITEMS =====
    'Nhẫn Doran': "Doran's Ring",
    'Khiên Doran': "Doran's Shield",
    'Kiếm Doran': "Doran's Blade",
    'Bình Máu': 'Health Potion',
    'Mắt Sủng': 'Control Ward',
    'Tôm Khô': 'Cull',
    'Thần Khí': 'Relic Shield',
    'Lưỡi Thép': 'Steel Shoulderguards',
    'Chiếc Móng': 'Spectral Sickle',
    Giày: 'Boots',

    // ===== BOOTS =====
    'Giày Pháp Sư': "Sorcerer's Shoes",
    'Giày Khai Sáng Ionia': 'Ionian Boots of Lucidity',
    'Giày Thủy Ngân': "Mercury's Treads",
    'Giày Thép Tăng Cường': 'Plated Steelcaps',
    'Giày Thép Gai': 'Plated Steelcaps',
    'Giày Nhanh': 'Boots of Swiftness',
    'Giày Berserker': "Berserker's Greaves",
    'Giày Ma Thuật': 'Magical Footwear',

    // ===== CORE ITEMS =====
    'Giáo Thiên Ly': 'Eclipse',
    'Rìu Đen': 'Black Cleaver',
    'Móng Vuốt Sterak': "Sterak's Gage",
    'Nguyệt Đao': "Youmuu's Ghostblade",
    'Ngọn Giáo Shojin': 'Spear of Shojin',
    'Áo Choàng Diệt Vong': 'Edge of Night',
    'Vũ Điệu Tử Thần': "Death's Dance",
    'Giáp Thiên Thần': 'Guardian Angel',
    'Giáp Liệt Sĩ': "Randuin's Omen",
    'Kiếm Ác Xà': "Serpent's Fang",

    // Add more items based on common League items
    'Máu Dọi': 'Bloodthirster',
    'Lưỡi Vô Cực': 'Infinity Edge',
    'Pháo Nhanh': 'Rapid Firecannon',
    'Đấm Ma Thuật': "Rabadon's Deathcap",
    'Cây Đũa Vô Hiệu': 'Void Staff',
    'Đồng Hồ Cát': "Zhonya's Hourglass",
    'Giáp Gai': 'Thornmail',
    'Mặt Nạ Sống': 'Spirit Visage',
    'Giấy Chắn Gió': "Banshee's Veil",
    'Cành Ô Liu': 'Last Whisper',
    'Kinh Thánh Hồi Máu': 'Bloodthirster',
    'Lưỡi Kiếm Thép': 'Blade of the Ruined King',
    'Áo Giáp Tấn Công': 'Sunfire Aegis',
    'Khiên Frozen Heart': 'Frozen Heart',

    // Additional Vietnamese items
    'Cung Thiên Thần': 'Guardian Angel',
    'Linh Hồn Phong Hố': 'Serrated Dirk',
    'Đá Sức Mạnh': 'Amplifying Tome',
    'Kiếm Dài': 'Long Sword',
    'Áo Choàng': 'Cloth Armor',
    'Nhẫn Rubbie': 'Ruby Crystal',
    'Lá Chắn': 'Dagger',
    'Cuốn Sách': 'Tome',
    Gậy: 'Rod',

    // More specific items that might appear
    'Đôi Kiếm': 'Dual Blades',
    Giáo: 'Spear',
    Búa: 'Hammer',
    Cung: 'Bow',
    Rìu: 'Axe',
    Khiên: 'Shield',
    'Áo Giáp': 'Armor',
    Nhẫn: 'Ring',
    Mũ: 'Hat',
    'Găng Tay': 'Gloves',
    'Dây Chuyền': 'Necklace',
    'Vòng Tay': 'Bracelet',
  };

  /**
   * Fix English names for items
   */
  private fixItemEnglishName(itemName: any): any {
    if (!itemName || typeof itemName !== 'object') return itemName;

    // Check if it's multilingual object
    if (
      itemName.en &&
      itemName.vi &&
      typeof itemName.en === 'string' &&
      typeof itemName.vi === 'string'
    ) {
      const viName = itemName.vi;
      const currentEnName = itemName.en;

      // Check if English name is actually Vietnamese (common issue)
      if (this.viToEnItemMapping[currentEnName] || currentEnName === viName) {
        const correctEnName =
          this.viToEnItemMapping[viName] ||
          this.viToEnItemMapping[currentEnName] ||
          viName;

        return {
          en: correctEnName,
          vi: viName,
        };
      }
    }

    return itemName;
  }

  /**
   * Fix all items in recommended items structure
   */
  private fixRecommendedItems(items: any[]) {
    if (!items || items.length === 0) return items;

    let hasChanges = false;

    items.forEach((itemGroup) => {
      // Fix starting items
      if (itemGroup.startingItems) {
        itemGroup.startingItems.forEach((startGroup) => {
          if (startGroup.items) {
            startGroup.items.forEach((item, index) => {
              const fixedItem = this.fixItemEnglishName(item);
              if (JSON.stringify(fixedItem) !== JSON.stringify(item)) {
                startGroup.items[index] = fixedItem;
                hasChanges = true;
              }
            });
          }
        });
      }

      // Fix boots
      if (itemGroup.boots) {
        itemGroup.boots.forEach((boot) => {
          if (boot.name) {
            const fixedName = this.fixItemEnglishName(boot.name);
            if (JSON.stringify(fixedName) !== JSON.stringify(boot.name)) {
              boot.name = fixedName;
              hasChanges = true;
            }
          }
        });
      }

      // Fix core builds
      if (itemGroup.coreBuilds) {
        itemGroup.coreBuilds.forEach((build) => {
          if (build.items) {
            build.items.forEach((item, index) => {
              const fixedItem = this.fixItemEnglishName(item);
              if (JSON.stringify(fixedItem) !== JSON.stringify(item)) {
                build.items[index] = fixedItem;
                hasChanges = true;
              }
            });
          }
        });
      }

      // Fix situational items
      if (itemGroup.situational) {
        Object.keys(itemGroup.situational).forEach((key) => {
          if (Array.isArray(itemGroup.situational[key])) {
            itemGroup.situational[key].forEach((item) => {
              if (item.name) {
                const fixedName = this.fixItemEnglishName(item.name);
                if (JSON.stringify(fixedName) !== JSON.stringify(item.name)) {
                  item.name = fixedName;
                  hasChanges = true;
                }
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
    console.log('🔧 Fixing Item English Names');
    console.log('============================');

    const champions = await this.championModel.find().lean();
    let processedCount = 0;
    let updatedCount = 0;

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
            console.log(`✅ Fixed item English names for ${champion.id}`);
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
          console.log(`⏭️  No item fixes needed for ${champion.id}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${champion.id}:`, error.message);
      }
    }

    console.log(`\n📊 Fix Summary:`);
    console.log(`✅ Processed: ${processedCount}`);
    console.log(`✅ Updated: ${updatedCount}`);

    return { processedCount, updatedCount };
  }
}

async function runItemEnglishFix() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championModel = app.get('ChampionModel');
    const fixer = new FixItemEnglishNames(championModel);

    await fixer.fixAllChampions();

    console.log('\n🎉 Item English names fix completed!');
    console.log('\n🔗 Test with: npm run debug:pantheon-items');
  } catch (error) {
    console.error('❌ Item fix failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

runItemEnglishFix().catch(console.error);
