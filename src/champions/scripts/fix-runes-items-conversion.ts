import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { ChampionDocument } from '../schemas/champion.schema';

class FixRunesItemsConversion {
  constructor(private championModel: Model<ChampionDocument>) {}

  // Reverse mapping from Vietnamese to English
  private viToEnMapping = {
    // Runes
    'Áp Đảo': 'Domination',
    'Chính Xác': 'Precision',
    'Pháp Thuật': 'Sorcery',
    'Quyết Tâm': 'Resolve',
    'Cảm Hứng': 'Inspiration',

    'Sốc Điện': 'Electrocute',
    'Vị Máu': 'Taste of Blood',
    'Ký Ức Kinh Hoàng': 'Eyeball Collection',
    'Thợ Săn Tối Thượng': 'Ultimate Hunter',
    'Dải Băng Năng Lượng': 'Manaflow Band',
    'Tốc Độ Đánh': 'Attack Speed',
    'Sức Mạnh Thích Ứng': 'Adaptive Force',
    'Máu Tăng Tiến': 'Health',

    // Items
    'Nhẫn Doran': "Doran's Ring",
    'Bình Máu': 'Health Potion',
    Giày: 'Boots',
    'Giày Pháp Sư': "Sorcerer's Shoes",
    'Giày Khai Sáng Ionia': 'Ionian Boots of Lucidity',
    'Mặt Nạ Đọa Đày Liandry': "Liandry's Anguish",
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
  };

  /**
   * Convert Vietnamese name to multilingual object
   */
  private convertToMultilingual(viName: string) {
    const enName = this.viToEnMapping[viName] || viName;
    return {
      en: enName,
      vi: viName,
    };
  }

  /**
   * Check if value is already multilingual
   */
  private isMultilingual(value: any): boolean {
    return typeof value === 'object' && value.en && value.vi;
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
   * Fix all champions runes and items
   */
  async fixAllChampions() {
    console.log('🔧 Fixing Runes and Items Conversion');
    console.log('====================================');

    const champions = await this.championModel.find().lean();
    let processedCount = 0;
    let updatedCount = 0;

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

    return { processedCount, updatedCount };
  }
}

async function runFix() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championModel = app.get('ChampionModel');
    const fixer = new FixRunesItemsConversion(championModel);

    await fixer.fixAllChampions();

    console.log('\n🎉 Runes and Items conversion fixed!');
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

runFix().catch(console.error);
