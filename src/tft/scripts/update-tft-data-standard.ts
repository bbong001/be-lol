import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TftChampion } from '../schemas/tft-champion.schema';

class TftDataStandardUpdater {
  constructor(private readonly tftChampionModel: Model<TftChampion>) {}

  /**
   * Comprehensive Vietnamese translations mapping
   */
  private getStandardMappings() {
    return {
      traits: {
        // Core TFT Set 14 traits
        'Golden Ox': 'Bò Vàng',
        'A.M.P.': 'A.M.P.',
        Bruiser: 'Võ Sĩ',
        Marksman: 'Xạ Thủ',
        Sorcerer: 'Phù Thủy',
        'Anima Squad': 'Đội Linh Hồn',
        Bastion: 'Pháo Đài',
        BoomBots: 'Robot Nổ',
        Cyberboss: 'Ông Chủ Mạng',
        Cypher: 'Mật Mã',
        Divinicorp: 'Tập Đoàn Thần Thánh',
        Dynamo: 'Máy Phát Điện',
        Executioner: 'Đao Phủ',
        Exotech: 'Công Nghệ Ngoại',
        'God of the Net': 'Thần Mạng',
        Nitro: 'Nitro',
        Overlord: 'Bá Chủ',
        Rapidfire: 'Bắn Nhanh',
        Slayer: 'Sát Thủ',
        'Soul Killer': 'Giết Linh Hồn',
        Strategist: 'Chiến Lược Gia',
        'Street Demon': 'Quỷ Đường Phố',
        Syndicate: 'Tổ Chức',
        Techie: 'Kỹ Thuật Viên',
        Virus: 'Vi-rút',
        Sentinel: 'Lính Canh',
        Invoker: 'Triệu Hồi Sư',
        Academy: 'Học Viện',
        Challenger: 'Thách Đấu',
        Colossus: 'Khổng Lồ',
        Dominator: 'Thống Trị',
        Emissary: 'Sứ Giả',
        Family: 'Gia Đình',
        Form: 'Hình Thái',
        Frost: 'Băng Giá',
        Honeymancy: 'Thuật Mật Ong',
        Multistriker: 'Đa Đòn',
        Portal: 'Cổng Thời Gian',
        Preserver: 'Bảo Tồn',
        Pyro: 'Hỏa Thuật',
        Quickstriker: 'Đòn Nhanh',
        Scholar: 'Học Giả',
        Shapeshifter: 'Biến Hình',
        Sugarcraft: 'Thủ Công Đường',
        Visionary: 'Viễn Kiến',
        Warrior: 'Chiến Binh',
        Witchcraft: 'Phù Thủy',
      },
      items: {
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
        'Frozen Heart': 'Trái Tim Băng Giá',

        // Offensive Items
        Deathblade: 'Lưỡi Tử Thần',
        'Giant Slayer': 'Kẻ Diệt Khổng Lồ',
        'Hextech Gunblade': 'Súng Kiếm Hextech',
        Bloodthirster: 'Khát Máu',
        'Infinity Edge': 'Lưỡi Vô Cực',
        'Last Whisper': 'Lời Thì Thầm Cuối',
        'Lord Dominiks Regard': 'Lời Chào Lord Dominik',
        'Mortal Reminder': 'Lời Nhắc Nhở Chết Chóc',
        "Runaan's Hurricane": 'Cơn Bão Runaan',
        'Statikk Shiv': 'Lưỡi Dao Statikk',

        // Magic Items
        'Rabadons Deathcap': 'Mũ Tử Thần Rabadon',
        "Archangel's Staff": 'Gậy Thiên Thần',
        Morellonomicon: 'Sách Phép Morello',
        'Ionic Spark': 'Tia Lửa Ion',
        'Jeweled Gauntlet': 'Găng Tay Ngọc',
        "Nashor's Tooth": 'Răng Nashor',
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
        "Sterak's Gage": 'Đồng Hồ Sterak',
        'Red Buff': 'Buff Đỏ',
        'Blue Buff': 'Buff Xanh',
        'Locket of the Iron Solari': 'Mề Đay Thép Solari',

        // Additional items
        'Flux Capacitor': 'Tụ Điện Thông Lượng',
        "Guinsoo's Rageblade": 'Lưỡi Cuồng Nộ Guinsoo',
        'Hyper Fangs': 'Răng Nanh Siêu Tốc',
        'Pulse Stabilizer': 'Bộ Ổn Định Xung',
        "Titan's Resolve": 'Ý Chí Titan',
      },
    };
  }

  /**
   * Get Vietnamese translation for trait
   */
  private getVietnameseTrait(englishTrait: string): string {
    const mapping = this.getStandardMappings().traits;
    return mapping[englishTrait] || englishTrait;
  }

  /**
   * Get Vietnamese translation for item
   */
  private getVietnameseItem(englishItem: string): string {
    const mapping = this.getStandardMappings().items;
    return mapping[englishItem] || englishItem;
  }

  /**
   * Validate and standardize data structure
   */
  async validateDataStructure() {
    console.log('🔍 Validating TFT data structure...');

    const champions = await this.tftChampionModel.find().lean();
    const issues = [];

    for (const champion of champions) {
      const championData = champion as any;
      const champName =
        typeof championData.name === 'string'
          ? championData.name
          : championData.name?.en || 'Unknown';

      // Check name structure
      if (!championData.name || typeof championData.name !== 'object') {
        issues.push(`${champName}: Invalid name structure`);
      }

      // Check traits structure
      if (!Array.isArray(championData.traits)) {
        issues.push(`${champName}: Traits is not an array`);
      } else {
        championData.traits.forEach((trait: any, index: number) => {
          if (typeof trait !== 'object' || !trait.en) {
            issues.push(`${champName}: Trait ${index} invalid structure`);
          }
        });
      }

      // Check ability structure
      if (championData.ability && typeof championData.ability !== 'object') {
        issues.push(`${champName}: Invalid ability structure`);
      }

      // Check recommendedItems structure
      if (championData.recommendedItems) {
        if (!Array.isArray(championData.recommendedItems)) {
          issues.push(`${champName}: recommendedItems is not an array`);
        } else {
          championData.recommendedItems.forEach((item: any, index: number) => {
            if (typeof item !== 'object' || !item.en) {
              issues.push(
                `${champName}: recommendedItems[${index}] invalid structure`,
              );
            }
          });
        }
      }
    }

    if (issues.length > 0) {
      console.log('❌ Data structure issues found:');
      issues.forEach((issue) => console.log(`  - ${issue}`));
      return false;
    }

    console.log('✅ Data structure is valid');
    return true;
  }

  /**
   * Update missing translations
   */
  async updateMissingTranslations() {
    console.log('🔄 Updating missing translations...');

    const champions = await this.tftChampionModel.find().lean();
    let updated = 0;

    for (const champion of champions) {
      const championData = champion as any;
      let needsUpdate = false;
      const updateData: any = {};

      // Update traits translations
      if (championData.traits && Array.isArray(championData.traits)) {
        const updatedTraits = championData.traits.map((trait: any) => {
          if (typeof trait === 'object' && trait.en) {
            const newViTrait = this.getVietnameseTrait(trait.en);
            if (!trait.vi || trait.vi === trait.en) {
              needsUpdate = true;
              return { en: trait.en, vi: newViTrait };
            }
          }
          return trait;
        });

        if (needsUpdate) {
          updateData.traits = updatedTraits;
        }
      }

      // Update recommendedItems translations
      if (
        championData.recommendedItems &&
        Array.isArray(championData.recommendedItems)
      ) {
        const updatedItems = championData.recommendedItems.map((item: any) => {
          if (typeof item === 'object' && item.en) {
            const newViItem = this.getVietnameseItem(item.en);
            if (!item.vi || item.vi === item.en) {
              needsUpdate = true;
              return { en: item.en, vi: newViItem };
            }
          }
          return item;
        });

        if (needsUpdate) {
          updateData.recommendedItems = updatedItems;
        }
      }

      // Update recommendedItemsData translations
      if (
        championData.recommendedItemsData &&
        Array.isArray(championData.recommendedItemsData)
      ) {
        const updatedItemsData = championData.recommendedItemsData.map(
          (item: any) => {
            if (item.name && typeof item.name === 'object' && item.name.en) {
              const newViName = this.getVietnameseItem(item.name.en);
              if (!item.name.vi || item.name.vi === item.name.en) {
                needsUpdate = true;
                return {
                  ...item,
                  name: { en: item.name.en, vi: newViName },
                };
              }
            }
            return item;
          },
        );

        if (needsUpdate) {
          updateData.recommendedItemsData = updatedItemsData;
        }
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

        console.log(`✅ Updated translations for ${champName}`);
        updated++;
      }
    }

    console.log(`📊 Updated ${updated} champions`);
    return updated;
  }

  /**
   * Generate comprehensive report
   */
  async generateReport() {
    console.log('📊 Generating TFT data report...');

    const champions = await this.tftChampionModel.find().lean();
    const report = {
      totalChampions: champions.length,
      dataStructure: {
        validNames: 0,
        validTraits: 0,
        validAbilities: 0,
        validRecommendedItems: 0,
      },
      translations: {
        traitsWithTranslations: 0,
        itemsWithTranslations: 0,
        missingTraitTranslations: 0,
        missingItemTranslations: 0,
      },
      uniqueTraits: new Set<string>(),
      uniqueItems: new Set<string>(),
    };

    champions.forEach((champion: any) => {
      // Validate structure
      if (
        champion.name &&
        typeof champion.name === 'object' &&
        champion.name.en
      ) {
        report.dataStructure.validNames++;
      }

      if (Array.isArray(champion.traits)) {
        report.dataStructure.validTraits++;
        champion.traits.forEach((trait: any) => {
          if (trait?.en) report.uniqueTraits.add(trait.en);
        });
      }

      if (champion.ability && typeof champion.ability === 'object') {
        report.dataStructure.validAbilities++;
      }

      if (Array.isArray(champion.recommendedItems)) {
        report.dataStructure.validRecommendedItems++;
        champion.recommendedItems.forEach((item: any) => {
          if (item?.en) report.uniqueItems.add(item.en);
        });
      }

      // Check translations
      if (champion.traits) {
        champion.traits.forEach((trait: any) => {
          if (trait?.en) {
            const viTrait = this.getVietnameseTrait(trait.en);
            if (viTrait !== trait.en) {
              report.translations.traitsWithTranslations++;
            } else {
              report.translations.missingTraitTranslations++;
            }
          }
        });
      }

      if (champion.recommendedItems) {
        champion.recommendedItems.forEach((item: any) => {
          if (item?.en) {
            const viItem = this.getVietnameseItem(item.en);
            if (viItem !== item.en) {
              report.translations.itemsWithTranslations++;
            } else {
              report.translations.missingItemTranslations++;
            }
          }
        });
      }
    });

    console.log('\n📈 TFT Data Report:');
    console.log('==================');
    console.log(`📊 Total Champions: ${report.totalChampions}`);
    console.log('\n🏗️  Data Structure:');
    console.log(
      `  ✅ Valid Names: ${report.dataStructure.validNames}/${report.totalChampions}`,
    );
    console.log(
      `  ✅ Valid Traits: ${report.dataStructure.validTraits}/${report.totalChampions}`,
    );
    console.log(
      `  ✅ Valid Abilities: ${report.dataStructure.validAbilities}/${report.totalChampions}`,
    );
    console.log(
      `  ✅ Valid Items: ${report.dataStructure.validRecommendedItems}/${report.totalChampions}`,
    );
    console.log('\n🌐 Translations:');
    console.log(`  🏷️  Unique Traits: ${report.uniqueTraits.size}`);
    console.log(`  🛡️  Unique Items: ${report.uniqueItems.size}`);
    console.log(
      `  ✅ Traits with translations: ${report.translations.traitsWithTranslations}`,
    );
    console.log(
      `  ❌ Missing trait translations: ${report.translations.missingTraitTranslations}`,
    );
    console.log(
      `  ✅ Items with translations: ${report.translations.itemsWithTranslations}`,
    );
    console.log(
      `  ❌ Missing item translations: ${report.translations.missingItemTranslations}`,
    );

    return report;
  }

  /**
   * Cleanup and standardize data
   */
  async cleanupData() {
    console.log('🧹 Cleaning up TFT data...');

    const champions = await this.tftChampionModel.find().lean();
    let cleaned = 0;

    for (const champion of champions) {
      const championData = champion as any;
      let needsCleanup = false;
      const updateData: any = {};

      // Remove any null or undefined fields
      Object.keys(championData).forEach((key) => {
        if (championData[key] === null || championData[key] === undefined) {
          needsCleanup = true;
          updateData[key] = undefined; // Will remove the field
        }
      });

      // Ensure all required fields have proper defaults
      if (!championData.patch) {
        needsCleanup = true;
        updateData.patch = '14.24.1';
      }

      if (!championData.setNumber) {
        needsCleanup = true;
        updateData.setNumber = 14;
      }

      if (needsCleanup) {
        await this.tftChampionModel.updateOne(
          { _id: championData._id },
          { $set: updateData },
        );

        const champName =
          typeof championData.name === 'string'
            ? championData.name
            : championData.name?.en || 'Unknown';

        console.log(`🧹 Cleaned ${champName}`);
        cleaned++;
      }
    }

    console.log(`📊 Cleaned ${cleaned} champions`);
    return cleaned;
  }

  /**
   * Run comprehensive update process
   */
  async runStandardUpdate() {
    console.log('🚀 Running TFT Standard Update Process');
    console.log('=====================================');

    try {
      // 1. Validate structure
      const isValid = await this.validateDataStructure();
      if (!isValid) {
        console.log(
          '❌ Data structure validation failed. Please fix issues first.',
        );
        return;
      }

      // 2. Update missing translations
      await this.updateMissingTranslations();

      // 3. Cleanup data
      await this.cleanupData();

      // 4. Generate final report
      await this.generateReport();

      console.log('\n🎉 TFT Standard Update completed successfully!');
    } catch (error) {
      console.error('❌ Standard update failed:', error.message);
      throw error;
    }
  }
}

async function runTftStandardUpdate() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const tftChampionModel = app.get<Model<TftChampion>>(
      getModelToken(TftChampion.name),
    );
    const updater = new TftDataStandardUpdater(tftChampionModel);

    await updater.runStandardUpdate();
  } catch (error) {
    console.error('❌ TFT Standard Update failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

// Run the standard update
runTftStandardUpdate();
