import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TftChampion } from '../schemas/tft-champion.schema';

class TftItemsFixer {
  constructor(private readonly tftChampionModel: Model<TftChampion>) {}

  /**
   * Mapping for Vietnamese TFT item names
   */
  private getVietnameseItemMapping(): Record<string, string> {
    return {
      // Defensive Items
      'Gargoyle Stoneplate': 'Giáp Thạch Quỷ',
      'Sunfire Cape': 'Áo Choàng Lửa Mặt Trời',
      "Warmog's Armor": 'Giáp Warmog',
      'Dragon Claw': 'Móng Vuốt Rồng',
      'Force of Nature': 'Sức Mạnh Tự Nhiên',
      'Bramble Vest': 'Áo Giáp Gai',
      'Titans Resolve': 'Ý Chí Titan',
      Redemption: 'Cứu Chuộc',
      'Zeke Herald': 'Lệnh Zeke',

      // Offensive Items
      Deathblade: 'Lưỡi Tử Thần',
      'Giant Slayer': 'Kẻ Diệt Khổng Lồ',
      'Hextech Gunblade': 'Súng Kiếm Hextech',
      Bloodthirster: 'Khát Máu',
      'Infinity Edge': 'Lưỡi Vô Cực',
      'Last Whisper': 'Lời Thì Thầm Cuối',
      'Lord Dominiks Regard': 'Lời Chào Lord Dominik',
      'Mortal Reminder': 'Lời Nhắc Nhở Chết Chóc',
      'Runaans Hurricane': 'Cơn Bão Runaan',
      'Statikk Shiv': 'Lưỡi Dao Statikk',

      // Magic Items
      'Rabadons Deathcap': 'Mũ Tử Thần Rabadon',
      'Archangels Staff': 'Gậy Thiên Thần',
      Morellonomicon: 'Sách Phép Morello',
      'Ionic Spark': 'Tia Lửa Ion',
      'Jeweled Gauntlet': 'Găng Tay Ngọc',
      'Nashors Tooth': 'Răng Nashor',
      'Spear of Shojin': 'Giáo Shojin',

      // Utility Items
      'Thieves Gloves': 'Găng Tay Trộm',
      'Tacticians Crown': 'Vương Miện Chiến Thuật Gia',
      'Shroud of Stillness': 'Tấm Che Tĩnh Lặng',
      Zephyr: 'Gió Tây',
      Quicksilver: 'Thủy Ngân',
      'Banshees Claw': 'Móng Vuốt Banshee',
      'Edge of Night': 'Bờ Vực Đêm',
      'Hand of Justice': 'Bàn Tay Công Lý',
      Guardbreaker: 'Phá Vệ',

      // Component Items
      'B.F. Sword': 'Kiếm B.F.',
      'Recurve Bow': 'Cung Cong',
      'Needlessly Large Rod': 'Gậy To Vô Ích',
      'Tear of the Goddess': 'Nước Mắt Nữ Thần',
      'Chain Vest': 'Áo Giáp Xích',
      'Negatron Cloak': 'Áo Choàng Negatron',
      'Giants Belt': 'Thắt Lưng Khổng Lồ',
      Spatula: 'Thìa Xúc',
      Glove: 'Găng Tay',

      // Set 14 Specific Items
      'Anima Visage': 'Diện Mạo Linh Hồn',
      'Adaptive Helm': 'Mũ Thích Ứng',
      Crownguard: 'Bảo Vệ Vương Miện',
      'Spectral Gauntlet': 'Găng Tay Ma Quái',
      'Protectors Vow': 'Lời Thề Bảo Vệ',
      'Steraks Gage': 'Đồng Hồ Sterak',
      'Red Buff': 'Buff Đỏ',
      'Blue Buff': 'Buff Xanh',
      'Locket of the Iron Solari': 'Mề Đay Thép Solari',
      'Frozen Heart': 'Trái Tim Băng Giá',

      // Missing items from analysis
      "Archangel's Staff": 'Gậy Thiên Thần',
      'Flux Capacitor': 'Tụ Điện Thông Lượng',
      "Guinsoo's Rageblade": 'Lưỡi Cuồng Nộ Guinsoo',
      'Hyper Fangs': 'Răng Nanh Siêu Tốc',
      "Nashor's Tooth": 'Răng Nashor',
      'Pulse Stabilizer': 'Bộ Ổn Định Xung',
      "Runaan's Hurricane": 'Cơn Bão Runaan',
      "Sterak's Gage": 'Đồng Hồ Sterak',
      "Titan's Resolve": 'Ý Chí Titan',
    };
  }

  /**
   * Get Vietnamese translation for item name
   */
  private getVietnameseItemName(englishItemName: string): string {
    const mapping = this.getVietnameseItemMapping();
    return mapping[englishItemName] || englishItemName;
  }

  /**
   * Fix recommendedItems and recommendedItemsData for all champions
   */
  async fixRecommendedItems() {
    console.log('🔧 Fixing recommendedItems and recommendedItemsData...');

    const champions = await this.tftChampionModel.find().lean();
    let updated = 0;
    let noChangeNeeded = 0;

    for (const champion of champions) {
      try {
        const championData = champion as any;
        let needsUpdate = false;
        const updateData: any = {};

        // Fix recommendedItems - convert to multilingual format
        if (
          championData.recommendedItems &&
          Array.isArray(championData.recommendedItems)
        ) {
          const multilingualItems = championData.recommendedItems.map(
            (item: string) => ({
              en: item,
              vi: this.getVietnameseItemName(item),
            }),
          );

          updateData.recommendedItems = multilingualItems;
          needsUpdate = true;
        }

        // Fix recommendedItemsData - update Vietnamese translations
        if (
          championData.recommendedItemsData &&
          Array.isArray(championData.recommendedItemsData)
        ) {
          const updatedItemsData = championData.recommendedItemsData.map(
            (item: any) => {
              if (item.name && typeof item.name === 'object' && item.name.en) {
                // Update Vietnamese translation if it's missing or same as English
                const newViName = this.getVietnameseItemName(item.name.en);
                if (!item.name.vi || item.name.vi === item.name.en) {
                  return {
                    ...item,
                    name: {
                      en: item.name.en,
                      vi: newViName,
                    },
                  };
                }
              } else if (typeof item.name === 'string') {
                // Convert string name to multilingual format
                return {
                  ...item,
                  name: {
                    en: item.name,
                    vi: this.getVietnameseItemName(item.name),
                  },
                };
              }
              return item;
            },
          );

          updateData.recommendedItemsData = updatedItemsData;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await this.tftChampionModel.updateOne(
            { _id: championData._id },
            { $set: updateData },
          );

          const champName =
            typeof championData.name === 'string'
              ? championData.name
              : championData.name?.en || 'Unknown';

          console.log(`✅ Fixed items for ${champName}`);
          updated++;
        } else {
          noChangeNeeded++;
        }
      } catch (error) {
        const champName =
          typeof champion.name === 'string'
            ? champion.name
            : champion.name?.en || 'Unknown';

        console.error(`❌ Error fixing items for ${champName}:`, error.message);
      }
    }

    console.log(`\n📊 Fix Summary:`);
    console.log(`✅ Fixed: ${updated}`);
    console.log(`⏭️  No change needed: ${noChangeNeeded}`);
    console.log(`📝 Total processed: ${champions.length}`);
  }

  /**
   * List all unique items to check translations
   */
  async listAllItems() {
    console.log('📋 Listing all unique items...');

    const champions = await this.tftChampionModel.find().lean();
    const allItems = new Set<string>();

    champions.forEach((champion: any) => {
      // From recommendedItems
      if (
        champion.recommendedItems &&
        Array.isArray(champion.recommendedItems)
      ) {
        champion.recommendedItems.forEach((item: any) => {
          if (typeof item === 'string') {
            allItems.add(item);
          } else if (typeof item === 'object' && item.en) {
            allItems.add(item.en);
          }
        });
      }

      // From recommendedItemsData
      if (
        champion.recommendedItemsData &&
        Array.isArray(champion.recommendedItemsData)
      ) {
        champion.recommendedItemsData.forEach((item: any) => {
          if (item.name) {
            if (typeof item.name === 'string') {
              allItems.add(item.name);
            } else if (typeof item.name === 'object' && item.name.en) {
              allItems.add(item.name.en);
            }
          }
        });
      }
    });

    console.log('\n🛡️  All items found:');
    Array.from(allItems)
      .sort()
      .forEach((item) => {
        const viItem = this.getVietnameseItemName(item);
        const hasTranslation = viItem !== item;
        console.log(
          `- ${item} ${hasTranslation ? '✅' : '❌'} ${hasTranslation ? `→ ${viItem}` : '(No translation)'}`,
        );
      });

    return allItems;
  }

  /**
   * Validate the fix by checking a few champions
   */
  async validateFix() {
    console.log('\n🔍 Validating items fix...');

    const champions = await this.tftChampionModel.find().limit(3).lean();

    champions.forEach((champion: any, index) => {
      const champName =
        typeof champion.name === 'string'
          ? champion.name
          : champion.name?.en || 'Unknown';

      console.log(`\n${index + 1}. ${champName}:`);

      // Check recommendedItems structure
      if (champion.recommendedItems && champion.recommendedItems.length > 0) {
        const firstItem = champion.recommendedItems[0];
        const isMultilingual =
          typeof firstItem === 'object' && firstItem.en && firstItem.vi;
        console.log(
          `   📦 recommendedItems: ${isMultilingual ? '✅ Multilingual' : '❌ Not multilingual'}`,
        );
        if (isMultilingual) {
          console.log(
            `       Example: EN(${firstItem.en}) / VI(${firstItem.vi})`,
          );
        }
      }

      // Check recommendedItemsData structure
      if (
        champion.recommendedItemsData &&
        champion.recommendedItemsData.length > 0
      ) {
        const firstItem = champion.recommendedItemsData[0];
        const hasMultilingualName =
          firstItem.name &&
          typeof firstItem.name === 'object' &&
          firstItem.name.en &&
          firstItem.name.vi;
        console.log(
          `   🎯 recommendedItemsData: ${hasMultilingualName ? '✅ Multilingual' : '❌ Not multilingual'}`,
        );
        if (hasMultilingualName) {
          console.log(
            `       Example: EN(${firstItem.name.en}) / VI(${firstItem.name.vi})`,
          );
        }
      }
    });
  }
}

async function runItemsFix() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const tftChampionModel = app.get<Model<TftChampion>>(
      getModelToken(TftChampion.name),
    );
    const fixer = new TftItemsFixer(tftChampionModel);

    console.log('🚀 TFT Items Fix Tool');
    console.log('=====================');

    // 1. List all items first
    await fixer.listAllItems();

    // 2. Fix items
    await fixer.fixRecommendedItems();

    // 3. Validate fix
    await fixer.validateFix();

    console.log('\n🎉 Items fix completed!');
  } catch (error) {
    console.error('❌ Items fix failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

// Run the fix
runItemsFix();
