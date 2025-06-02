import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { ChampionDocument } from '../schemas/champion.schema';

class FixNestedMultilingual {
  constructor(private championModel: Model<ChampionDocument>) {}

  // Enhanced mapping with reverse lookup
  private viToEnMapping = {
    // ===== RUNES =====
    'Áp Đảo': 'Domination',
    'Chính Xác': 'Precision',
    'Chuẩn Xác': 'Precision', // Backup mapping
    'Pháp Thuật': 'Sorcery',
    'Quyết Tâm': 'Resolve',
    'Kiên Định': 'Resolve', // Backup mapping
    'Cảm Hứng': 'Inspiration',

    // Domination Runes
    'Sốc Điện': 'Electrocute',
    'Kẻ Săn Mồi': 'Predator',
    'Thu Hoạch Bóng Tối': 'Dark Harvest',
    'Mưa Kiếm': 'Hail of Blades',
    'Đòn Hèn': 'Cheap Shot',
    'Vị Máu': 'Taste of Blood',
    'Va Chạm Đột Ngột': 'Sudden Impact',
    'Mắt Zombie': 'Zombie Ward',
    'Ma Poro': 'Ghost Poro',
    'Bộ Sưu Tập Nhãn Cầu': 'Eyeball Collection',
    'Ký Ức Kinh Hoàng': 'Eyeball Collection',
    'Thợ Săn Kho Báu': 'Treasure Hunter',
    'Thợ Săn Khôn Ngoan': 'Ingenious Hunter',
    'Thợ Săn Kiên Cường': 'Relentless Hunter',
    'Thợ Săn Tối Thượng': 'Ultimate Hunter',

    // Sorcery Runes
    'Triệu Hồi Aery': 'Summon Aery',
    'Sao Chổi Bí Thuật': 'Arcane Comet',
    'Lao Vọt': 'Phase Rush',
    'Quả Cầu Vô Hiệu': 'Nullifying Orb',
    'Dải Băng Năng Lượng': 'Manaflow Band',
    'Áo Choàng Mây': 'Nimbus Cloak',
    'Siêu Việt': 'Transcendence',
    'Nhanh Nhẹn': 'Celerity',
    'Tập Trung Tuyệt Đối': 'Absolute Focus',
    'Thiêu Đốt': 'Scorch',
    'Đi Trên Nước': 'Waterwalking',
    'Tụ Tập Bão Tố': 'Gathering Storm',

    // Precision Runes
    'Đôi Chân Nhanh': 'Fleet Footwork',
    'Chiến Thắng': 'Triumph',
    'Huyền Thoại: Dòng Máu': 'Legend: Bloodline',
    'Huyền Thoại: Độ Bền': 'Legend: Tenacity',
    'Huyền Thoại: Tốc Độ Đánh': 'Legend: Alacrity',
    'Đòn Cuối': 'Coup de Grace',
    'Cắt Hạ': 'Cut Down',
    'Không Khoan Nhượng': 'Last Stand',

    // Resolve Runes
    'Rung Chấn': 'Aftershock',
    'Bảo Vệ': 'Guardian',
    'Xương Cốt': 'Bone Plating',
    'Khoảng Cách': 'Demolish',
    'Sống Sót': 'Revitalize',
    'Tăng Trưởng': 'Overgrowth',
    'Ý Chí Bất Khuất': 'Unflinching',

    // Inspiration Runes
    'Giày Ma Thuật': 'Magical Footwear',
    'Thị Trường Tương Lai': "Future's Market",
    'Tốc Độ Tiếp Cận': 'Approach Velocity',
    'Tia Sét Vũ Trụ': 'Cosmic Insight',
    'Đồng Hồ Thời Gian': 'Time Warp Tonic',

    // Stat Shards
    'Tốc Độ Đánh': 'Attack Speed',
    'Sức Mạnh Thích Ứng': 'Adaptive Force',
    'Giảm Hồi Chiêu': 'Ability Haste',
    Giáp: 'Armor',
    'Kháng Phép': 'Magic Resist',
    'Máu Tăng Tiến': 'Health',
    Máu: 'Health',

    // ===== ITEMS =====
    'Nhẫn Doran': "Doran's Ring",
    'Khiên Doran': "Doran's Shield",
    'Kiếm Doran': "Doran's Blade",
    'Bình Máu': 'Health Potion',
    Giày: 'Boots',
    'Tôm Khô': 'Cull',
    'Thần Khí': 'Relic Shield',
    'Lưỡi Thép': 'Steel Shoulderguards',
    'Chiếc Móng': 'Spectral Sickle',

    // Add more mappings as needed...
    'Giày Pháp Sư': "Sorcerer's Shoes",
    'Giày Khai Sáng Ionia': 'Ionian Boots of Lucidity',
    'Giày Thủy Ngân': "Mercury's Treads",
    'Giày Thép Tăng Cường': 'Plated Steelcaps',
    'Giày Nhanh': 'Boots of Swiftness',
    'Giày Berserker': "Berserker's Greaves",
  };

  /**
   * Fix nested multilingual object to flat multilingual
   */
  private fixNestedMultilingual(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    // Check if it's nested multilingual like { en: { en: "...", vi: "..." }, vi: { en: "...", vi: "..." } }
    if (
      obj.en &&
      obj.vi &&
      typeof obj.en === 'object' &&
      typeof obj.vi === 'object'
    ) {
      // Extract Vietnamese text from the nested structure
      const viText = obj.vi.vi || obj.en.vi || obj.vi.en || obj.en.en;
      const enText = this.viToEnMapping[viText] || viText;

      return {
        en: enText,
        vi: viText,
      };
    }

    // Check if it's already flat multilingual { en: "...", vi: "..." }
    if (
      obj.en &&
      obj.vi &&
      typeof obj.en === 'string' &&
      typeof obj.vi === 'string'
    ) {
      return obj; // Already correct format
    }

    return obj;
  }

  /**
   * Fix recommended runes structure
   */
  private fixRecommendedRunes(runes: any[]) {
    if (!runes || runes.length === 0) return runes;

    let hasChanges = false;

    runes.forEach((runeGroup) => {
      // Fix primary tree
      if (runeGroup.primaryTree?.name) {
        const fixed = this.fixNestedMultilingual(runeGroup.primaryTree.name);
        if (
          JSON.stringify(fixed) !== JSON.stringify(runeGroup.primaryTree.name)
        ) {
          runeGroup.primaryTree.name = fixed;
          hasChanges = true;
        }

        if (runeGroup.primaryTree.runes) {
          runeGroup.primaryTree.runes.forEach((rune, index) => {
            const fixedRune = this.fixNestedMultilingual(rune);
            if (JSON.stringify(fixedRune) !== JSON.stringify(rune)) {
              runeGroup.primaryTree.runes[index] = fixedRune;
              hasChanges = true;
            }
          });
        }
      }

      // Fix secondary tree
      if (runeGroup.secondaryTree?.name) {
        const fixed = this.fixNestedMultilingual(runeGroup.secondaryTree.name);
        if (
          JSON.stringify(fixed) !== JSON.stringify(runeGroup.secondaryTree.name)
        ) {
          runeGroup.secondaryTree.name = fixed;
          hasChanges = true;
        }

        if (runeGroup.secondaryTree.runes) {
          runeGroup.secondaryTree.runes.forEach((rune, index) => {
            const fixedRune = this.fixNestedMultilingual(rune);
            if (JSON.stringify(fixedRune) !== JSON.stringify(rune)) {
              runeGroup.secondaryTree.runes[index] = fixedRune;
              hasChanges = true;
            }
          });
        }
      }

      // Fix stat shards
      if (runeGroup.statShards) {
        runeGroup.statShards.forEach((shard, index) => {
          const fixedShard = this.fixNestedMultilingual(shard);
          if (JSON.stringify(fixedShard) !== JSON.stringify(shard)) {
            runeGroup.statShards[index] = fixedShard;
            hasChanges = true;
          }
        });
      }
    });

    return hasChanges ? runes : null;
  }

  /**
   * Fix recommended items structure
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
              const fixedItem = this.fixNestedMultilingual(item);
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
            const fixedName = this.fixNestedMultilingual(boot.name);
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
              const fixedItem = this.fixNestedMultilingual(item);
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
                const fixedName = this.fixNestedMultilingual(item.name);
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
   * Fix all champions with nested multilingual issues
   */
  async fixAllChampions() {
    console.log('🚨 URGENT: Fixing Nested Multilingual Objects');
    console.log('==============================================');

    const champions = await this.championModel.find().lean();
    let processedCount = 0;
    let updatedCount = 0;

    for (const champion of champions) {
      try {
        console.log(`🔄 Processing ${champion.id}...`);
        processedCount++;

        const updateData: any = {};
        let needsUpdate = false;

        // Fix recommended runes
        if (champion.recommendedRunes && champion.recommendedRunes.length > 0) {
          const fixedRunes = this.fixRecommendedRunes(
            champion.recommendedRunes,
          );
          if (fixedRunes) {
            updateData.recommendedRunes = fixedRunes;
            needsUpdate = true;
            console.log(`✅ Fixed nested runes for ${champion.id}`);
          }
        }

        // Fix recommended items
        if (champion.recommendedItems && champion.recommendedItems.length > 0) {
          const fixedItems = this.fixRecommendedItems(
            champion.recommendedItems,
          );
          if (fixedItems) {
            updateData.recommendedItems = fixedItems;
            needsUpdate = true;
            console.log(`✅ Fixed nested items for ${champion.id}`);
          }
        }

        // Update in database
        if (needsUpdate) {
          await this.championModel.updateOne(
            { _id: champion._id },
            { $set: updateData },
          );
          updatedCount++;
          console.log(`✅ Updated ${champion.id}`);
        } else {
          console.log(`⏭️  No nested issues for ${champion.id}`);
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

async function runNestedFix() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championModel = app.get('ChampionModel');
    const fixer = new FixNestedMultilingual(championModel);

    await fixer.fixAllChampions();

    console.log('\n🎉 Nested multilingual fix completed!');
    console.log('\n🔗 Test with: npm run check:specific-champions');
  } catch (error) {
    console.error('❌ Nested fix failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

runNestedFix().catch(console.error);
