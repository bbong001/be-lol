import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { ChampionDocument } from '../schemas/champion.schema';

class FixCompleteMapping {
  constructor(private championModel: Model<ChampionDocument>) {}

  // COMPLETE mapping từ Vietnamese sang English
  private viToEnMapping = {
    // ===== RUNES =====
    // Primary Trees
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
    'Chuẩn Xác': 'Precision',
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
    // Starting Items
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
    'Giáp Thép Gai Bramble': 'Bramble Vest',
    'Khiên Thích Ứng': 'Adaptive Helm',

    // Support Items
    'Lư Hương': 'Relic Shield',
    'Gậy Thép': 'Steel Shoulderguards',
    'Dao Liềm Ma': 'Spectral Sickle',
    'Đồng Xu Cổ': 'Ancient Coin',

    // AD Items
    'Đao Phong': 'Blade of the Ruined King',
    'Cung Thần Tốc': 'Rapid Firecannon',
    'Lưỡi Bão Tố': 'Stormrazor',
    'Máu Khát': 'Bloodthirster',
    'Kiếm Chém': 'Kraken Slayer',
    'Gươm Bão Tố': 'Galeforce',
    'Tử Thần': 'The Collector',
    'Lưỡi Phantom': 'Phantom Dancer',
    'Ký Ức Chúa': "Lord Dominik's Regards",
    'Giáp Phá': 'Mortal Reminder',

    // Tank Items
    'Áo Giáp Sunfire': 'Sunfire Aegis',
    'Găng Tay Băng': 'Frostfire Gauntlet',
    'Khiên Thần Thánh': 'Locket of the Iron Solari',
    'Kính Nhắm Ritchous': 'Righteous Glory',
    'Mặt Nạ Abyssal': 'Abyssal Mask',
    'Quan Tài Băng': 'Frozen Heart',

    // Jungle Items
    'Dao Rìu Hái': 'Hailblade',
    'Dao Đỏ': 'Emberknife',
    'Dao Xanh': 'Hailblade',

    // Consumables & Others
    'Mắt Thường': 'Stealth Ward',
    'Mắt Kiểm Soát': 'Control Ward',
    'Ống Nhòm': 'Farsight Alteration',
    'Đèn Lồng': 'Oracle Lens',
    'Bình Mana': 'Mana Potion',
    'Bánh Quy': 'Biscuit Delivery',

    // Các item khác có thể thiếu
    'Cây Gậy Thời Gian': 'Stopwatch',
    'Đá Quý': 'Tear of the Goddess',
    'Đá Quý Thiên Thần': "Archangel's Staff",
    'Đồng Hồ Vàng': 'Stopwatch',
  };

  /**
   * Convert Vietnamese name to multilingual object
   */
  private convertToMultilingual(viName: string) {
    const enName = this.viToEnMapping[viName];

    if (!enName) {
      console.log(`⚠️  Missing mapping for: "${viName}"`);
      return {
        en: viName, // Fallback to original name
        vi: viName,
      };
    }

    return {
      en: enName,
      vi: viName,
    };
  }

  /**
   * Check if value is already multilingual
   */
  private isMultilingual(value: any): boolean {
    return typeof value === 'object' && value?.en && value?.vi;
  }

  /**
   * Fix recommended runes conversion
   */
  private fixRecommendedRunes(runes: any[]) {
    if (!runes || runes.length === 0) return runes;

    return runes.map((runeGroup) => {
      const fixed = { ...runeGroup };

      // Fix primary tree
      if (fixed.primaryTree?.name) {
        if (!this.isMultilingual(fixed.primaryTree.name)) {
          fixed.primaryTree.name = this.convertToMultilingual(
            fixed.primaryTree.name,
          );
        }

        if (fixed.primaryTree.runes) {
          fixed.primaryTree.runes = fixed.primaryTree.runes.map((rune) =>
            this.isMultilingual(rune) ? rune : this.convertToMultilingual(rune),
          );
        }
      }

      // Fix secondary tree
      if (fixed.secondaryTree?.name) {
        if (!this.isMultilingual(fixed.secondaryTree.name)) {
          fixed.secondaryTree.name = this.convertToMultilingual(
            fixed.secondaryTree.name,
          );
        }

        if (fixed.secondaryTree.runes) {
          fixed.secondaryTree.runes = fixed.secondaryTree.runes.map((rune) =>
            this.isMultilingual(rune) ? rune : this.convertToMultilingual(rune),
          );
        }
      }

      // Fix stat shards
      if (fixed.statShards) {
        fixed.statShards = fixed.statShards.map((shard) =>
          this.isMultilingual(shard)
            ? shard
            : this.convertToMultilingual(shard),
        );
      }

      return fixed;
    });
  }

  /**
   * Fix recommended items conversion
   */
  private fixRecommendedItems(items: any[]) {
    if (!items || items.length === 0) return items;

    return items.map((itemGroup) => {
      const fixed = { ...itemGroup };

      // Fix starting items
      if (fixed.startingItems) {
        fixed.startingItems = fixed.startingItems.map((startGroup) => ({
          ...startGroup,
          items: startGroup.items.map((item) =>
            this.isMultilingual(item) ? item : this.convertToMultilingual(item),
          ),
        }));
      }

      // Fix boots
      if (fixed.boots) {
        fixed.boots = fixed.boots.map((boot) => ({
          ...boot,
          name: this.isMultilingual(boot.name)
            ? boot.name
            : this.convertToMultilingual(boot.name),
        }));
      }

      // Fix core builds
      if (fixed.coreBuilds) {
        fixed.coreBuilds = fixed.coreBuilds.map((build) => ({
          ...build,
          items: build.items.map((item) =>
            this.isMultilingual(item) ? item : this.convertToMultilingual(item),
          ),
        }));
      }

      // Fix situational items
      if (fixed.situational) {
        Object.keys(fixed.situational).forEach((key) => {
          if (Array.isArray(fixed.situational[key])) {
            fixed.situational[key] = fixed.situational[key].map((item) => ({
              ...item,
              name: this.isMultilingual(item.name)
                ? item.name
                : this.convertToMultilingual(item.name),
            }));
          }
        });
      }

      return fixed;
    });
  }

  /**
   * Fix all champions with complete mapping
   */
  async fixAllChampions() {
    console.log('🔧 Fixing Complete Runes and Items Mapping');
    console.log('==========================================');

    const champions = await this.championModel.find().lean();
    let processedCount = 0;
    let updatedCount = 0;
    let missingMappings = new Set();

    for (const champion of champions) {
      try {
        console.log(`🔄 Processing ${champion.id}...`);
        processedCount++;

        const updateData: any = {};
        let hasChanges = false;

        // Fix recommended runes
        if (champion.recommendedRunes && champion.recommendedRunes.length > 0) {
          const fixedRunes = this.fixRecommendedRunes(
            champion.recommendedRunes,
          );
          updateData.recommendedRunes = fixedRunes;
          hasChanges = true;
          console.log(`✅ Fixed runes for ${champion.id}`);
        }

        // Fix recommended items
        if (champion.recommendedItems && champion.recommendedItems.length > 0) {
          const fixedItems = this.fixRecommendedItems(
            champion.recommendedItems,
          );
          updateData.recommendedItems = fixedItems;
          hasChanges = true;
          console.log(`✅ Fixed items for ${champion.id}`);
        }

        // Update in database
        if (hasChanges) {
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

    console.log(`\n📊 Fix Summary:`);
    console.log(`✅ Processed: ${processedCount}`);
    console.log(`✅ Updated: ${updatedCount}`);

    if (missingMappings.size > 0) {
      console.log(`\n⚠️  Missing mappings found:`);
      Array.from(missingMappings).forEach((name) => {
        console.log(`   - "${name}"`);
      });
    }

    return {
      processedCount,
      updatedCount,
      missingMappings: Array.from(missingMappings),
    };
  }
}

async function runCompleteMapping() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championModel = app.get('ChampionModel');
    const fixer = new FixCompleteMapping(championModel);

    await fixer.fixAllChampions();

    console.log('\n🎉 Complete mapping fix finished!');
    console.log('\n🔗 Now test with: npm run test:complete-migration');
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

runCompleteMapping().catch(console.error);
