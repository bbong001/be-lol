import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { ChampionDocument } from '../schemas/champion.schema';

class ForceFixMapping {
  constructor(private championModel: Model<ChampionDocument>) {}

  // COMPLETE mapping từ Vietnamese sang English
  private viToEnMapping = {
    // ===== RUNES =====
    'Áp Đảo': 'Domination',
    'Chính Xác': 'Precision',
    'Pháp Thuật': 'Sorcery',
    'Quyết Tâm': 'Resolve',
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

    // Boots
    'Giày Pháp Sư': "Sorcerer's Shoes",
    'Giày Khai Sáng Ionia': 'Ionian Boots of Lucidity',
    'Giày Thủy Ngân': "Mercury's Treads",
    'Giày Thép Tăng Cường': 'Plated Steelcaps',
    'Giày Nhanh': 'Boots of Swiftness',
    'Giày Berserker': "Berserker's Greaves",

    // Mythic & Legendary Items
    'Mặt Nạ Đọa Đày Liandry': "Liandry's Anguish",
    'Bão Tố Luden': "Luden's Tempest",
    'Hỏa Khuẩn': 'Everfrost',
    'Ngọn Lửa Hắc Hóa': 'Shadowflame',
    'Mũ Phù Thủy Rabadon': "Rabadon's Deathcap",
    'Đồng Hồ Cát Zhonya': "Zhonya's Hourglass",
    'Trượng Hư Vô': 'Void Staff',
    'Sách Chiêu Hồn Mejai': "Mejai's Soulstealer",
    'Động Cơ Vũ Trụ': 'Cosmic Drive',
    'Quyền Trượng Bão Tố': 'Stormsurge',
    'Quyền Trượng Ác Thần': 'Malignance',
    'Trượng Trường Sinh': 'Rod of Ages',
    'Kính Nhắm Ma Pháp': 'Horizon Focus',
    'Sách Cấm Morellonomicon': 'Morellonomicon',
    'Khăn Choàng Banshee': "Banshee's Veil",
    'Kiếm Tai Ương': 'Lich Bane',
    'Răng Nanh Nashor': "Nashor's Tooth",
    'Động Cơ Tên Lửa Hextech': 'Hextech Rocketbelt',
    'Hoa Nở Địa Ngục': 'Cryptbloom',
    'Đá Canh Gác': 'Vigilant Wardstone',
    'Phù Phép Mikael': "Mikael's Blessing",
    'Cứu Chuộc': 'Redemption',
    'Trượng Nước Chảy': 'Staff of Flowing Water',
    'Đá Mặt Trăng Tái Sinh': 'Moonstone Renewer',
    'Lệnh Hoàng Gia': 'Imperial Mandate',
    'Dây Chuyền Chữ Thập': 'Chemtech Putrifier',
    'Móng Vuốt Sterak': "Sterak's Gage",
    'Giáp Thép Gai': 'Thornmail',
    'Mặt Nạ Thần Linh': 'Spirit Visage',
    'Giáp Randuin': "Randuin's Omen",
    'Đôi Cánh Thiên Thần': 'Guardian Angel',
    'Kiếm Vô Cực': 'Infinity Edge',
  };

  /**
   * Force convert EN name from VI name using mapping
   */
  private forceConvertEn(obj: any) {
    if (typeof obj === 'object' && obj?.vi) {
      const viName = obj.vi;
      const enName = this.viToEnMapping[viName] || viName;
      obj.en = enName; // Force update EN
      return true; // Indicates change was made
    }
    return false;
  }

  /**
   * Force fix recommended runes
   */
  private forceFixRunes(runes: any[]) {
    if (!runes || runes.length === 0) return runes;

    let hasChanges = false;

    runes.forEach((runeGroup) => {
      // Fix primary tree
      if (runeGroup.primaryTree?.name) {
        if (this.forceConvertEn(runeGroup.primaryTree.name)) hasChanges = true;

        if (runeGroup.primaryTree.runes) {
          runeGroup.primaryTree.runes.forEach((rune) => {
            if (this.forceConvertEn(rune)) hasChanges = true;
          });
        }
      }

      // Fix secondary tree
      if (runeGroup.secondaryTree?.name) {
        if (this.forceConvertEn(runeGroup.secondaryTree.name))
          hasChanges = true;

        if (runeGroup.secondaryTree.runes) {
          runeGroup.secondaryTree.runes.forEach((rune) => {
            if (this.forceConvertEn(rune)) hasChanges = true;
          });
        }
      }

      // Fix stat shards
      if (runeGroup.statShards) {
        runeGroup.statShards.forEach((shard) => {
          if (this.forceConvertEn(shard)) hasChanges = true;
        });
      }
    });

    return hasChanges ? runes : null;
  }

  /**
   * Force fix recommended items
   */
  private forceFixItems(items: any[]) {
    if (!items || items.length === 0) return items;

    let hasChanges = false;

    items.forEach((itemGroup) => {
      // Fix starting items
      if (itemGroup.startingItems) {
        itemGroup.startingItems.forEach((startGroup) => {
          if (startGroup.items) {
            startGroup.items.forEach((item) => {
              if (this.forceConvertEn(item)) hasChanges = true;
            });
          }
        });
      }

      // Fix boots
      if (itemGroup.boots) {
        itemGroup.boots.forEach((boot) => {
          if (boot.name && this.forceConvertEn(boot.name)) hasChanges = true;
        });
      }

      // Fix core builds
      if (itemGroup.coreBuilds) {
        itemGroup.coreBuilds.forEach((build) => {
          if (build.items) {
            build.items.forEach((item) => {
              if (this.forceConvertEn(item)) hasChanges = true;
            });
          }
        });
      }

      // Fix situational items
      if (itemGroup.situational) {
        Object.keys(itemGroup.situational).forEach((key) => {
          if (Array.isArray(itemGroup.situational[key])) {
            itemGroup.situational[key].forEach((item) => {
              if (item.name && this.forceConvertEn(item.name))
                hasChanges = true;
            });
          }
        });
      }
    });

    return hasChanges ? items : null;
  }

  /**
   * Force fix all champions
   */
  async forceFixAllChampions() {
    console.log('🔧 FORCE Fixing EN Names from VI Names');
    console.log('======================================');

    const champions = await this.championModel.find().lean();
    let processedCount = 0;
    let updatedCount = 0;
    let missingsCount = 0;

    for (const champion of champions) {
      try {
        console.log(`🔄 Processing ${champion.id}...`);
        processedCount++;

        const updateData: any = {};
        let needsUpdate = false;

        // Force fix recommended runes
        if (champion.recommendedRunes && champion.recommendedRunes.length > 0) {
          const fixedRunes = this.forceFixRunes(champion.recommendedRunes);
          if (fixedRunes) {
            updateData.recommendedRunes = fixedRunes;
            needsUpdate = true;
            console.log(`✅ Force fixed runes for ${champion.id}`);
          }
        }

        // Force fix recommended items
        if (champion.recommendedItems && champion.recommendedItems.length > 0) {
          const fixedItems = this.forceFixItems(champion.recommendedItems);
          if (fixedItems) {
            updateData.recommendedItems = fixedItems;
            needsUpdate = true;
            console.log(`✅ Force fixed items for ${champion.id}`);
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
          console.log(`⏭️  No changes needed for ${champion.id}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${champion.id}:`, error.message);
      }
    }

    console.log(`\n📊 Force Fix Summary:`);
    console.log(`✅ Processed: ${processedCount}`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⚠️  Missing mappings: ${missingsCount}`);

    return { processedCount, updatedCount, missingsCount };
  }
}

async function runForceFix() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championModel = app.get('ChampionModel');
    const fixer = new ForceFixMapping(championModel);

    await fixer.forceFixAllChampions();

    console.log('\n🎉 Force mapping fix completed!');
    console.log('\n🔗 Test with: npm run test:complete-migration');
  } catch (error) {
    console.error('❌ Force fix failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

runForceFix().catch(console.error);
