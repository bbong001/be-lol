import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { ChampionsService } from '../champions.service';
import { Champion, ChampionDocument } from '../schemas/champion.schema';
import { Model } from 'mongoose';
import axios from 'axios';

class CompleteI18nMigration {
  private readonly version = '15.9.1';

  constructor(
    private championModel: Model<ChampionDocument>,
    private championsService: ChampionsService,
  ) {}

  /**
   * Fetch champion detailed data from Data Dragon API
   */
  private async fetchChampionDetails(
    championId: string,
    lang: 'en_US' | 'vi_VN',
  ) {
    try {
      const response = await axios.get(
        `https://ddragon.leagueoflegends.com/cdn/${this.version}/data/${lang}/champion/${championId}.json`,
      );
      return response.data.data[championId];
    } catch (error) {
      console.error(
        `❌ Error fetching ${championId} in ${lang}:`,
        error.message,
      );
      return null;
    }
  }

  /**
   * Map English item names to Vietnamese
   */
  private itemNameMapping = {
    // Starting Items
    "Doran's Ring": 'Nhẫn Doran',
    'Health Potion': 'Bình Máu',
    Boots: 'Giày',

    // Boots
    "Sorcerer's Shoes": 'Giày Pháp Sư',
    'Ionian Boots of Lucidity': 'Giày Khai Sáng Ionia',
    "Mercury's Treads": 'Giày Thủy Ngân',
    'Plated Steelcaps': 'Giày Thép Tăng Cường',

    // Core Items
    "Liandry's Anguish": 'Mặt Nạ Đọa Đày Liandry',
    "Luden's Tempest": 'Bão Tố Luden',
    Everfrost: 'Hỏa Khuẩn',
    Shadowflame: 'Ngọn Lửa Hắc Hóa',
    "Rabadon's Deathcap": 'Mũ Phù Thủy Rabadon',
    "Zhonya's Hourglass": 'Đồng Hồ Cát Zhonya',
    'Void Staff': 'Trượng Hư Vô',
    "Mejai's Soulstealer": 'Sách Chiêu Hồn Mejai',
    'Cosmic Drive': 'Động Cơ Vũ Trụ',
    Stormsurge: 'Quyền Trượng Bão Tố',
    Malignance: 'Quyền Trượng Ác Thần',
    'Rod of Ages': 'Trượng Trường Sinh',
    'Horizon Focus': 'Kính Nhắm Ma Pháp',

    // Other Items
    Morellonomicon: 'Sách Cấm Morellonomicon',
    "Banshee's Veil": 'Khăn Choàng Banshee',
    'Lich Bane': 'Kiếm Tai Ương',
    "Nashor's Tooth": 'Răng Nanh Nashor',
    'Hextech Rocketbelt': 'Động Cơ Tên Lửa Hextech',
    Cryptbloom: 'Hoa Nở Địa Ngục',
    'Vigilant Wardstone': 'Đá Canh Gác',
    "Mikael's Blessing": 'Phù Phép Mikael',
    Redemption: 'Cứu Chuộc',
    'Staff of Flowing Water': 'Trượng Nước Chảy',
    'Moonstone Renewer': 'Đá Mặt Trăng Tái Sinh',
    'Imperial Mandate': 'Lệnh Hoàng Gia',
  };

  /**
   * Map English rune names to Vietnamese
   */
  private runeNameMapping = {
    // Primary Trees
    Domination: 'Áp Đảo',
    Precision: 'Chính Xác',
    Sorcery: 'Pháp Thuật',
    Resolve: 'Quyết Tâm',
    Inspiration: 'Cảm Hứng',

    // Domination Runes
    Electrocute: 'Sốc Điện',
    Predator: 'Kẻ Săn Mồi',
    'Dark Harvest': 'Thu Hoạch Bóng Tối',
    'Hail of Blades': 'Mưa Kiếm',
    'Cheap Shot': 'Đòn Hèn',
    'Taste of Blood': 'Vị Máu',
    'Sudden Impact': 'Va Chạm Đột Ngột',
    'Zombie Ward': 'Mắt Zombie',
    'Ghost Poro': 'Ma Poro',
    'Eyeball Collection': 'Bộ Sưu Tập Nhãn Cầu',
    'Treasure Hunter': 'Thợ Săn Kho Báu',
    'Ingenious Hunter': 'Thợ Săn Khôn Ngoan',
    'Relentless Hunter': 'Thợ Săn Kiên Cường',
    'Ultimate Hunter': 'Thợ Săn Tối Thượng',

    // Sorcery Runes
    'Summon Aery': 'Triệu Hồi Aery',
    'Arcane Comet': 'Sao Chổi Bí Thuật',
    'Phase Rush': 'Lao Vọt',
    'Nullifying Orb': 'Quả Cầu Vô Hiệu',
    'Manaflow Band': 'Dải Băng Năng Lượng',
    'Nimbus Cloak': 'Áo Choàng Mây',
    Transcendence: 'Siêu Việt',
    Celerity: 'Nhanh Nhẹn',
    'Absolute Focus': 'Tập Trung Tuyệt Đối',
    Scorch: 'Thiêu Đốt',
    Waterwalking: 'Đi Trên Nước',
    'Gathering Storm': 'Tụ Tập Bão Tố',

    // Stat Shards
    'Attack Speed': 'Tốc Độ Đánh',
    'Adaptive Force': 'Sức Mạnh Thích Ứng',
    'Ability Haste': 'Giảm Hồi Chiêu',
    Armor: 'Giáp',
    'Magic Resist': 'Kháng Phép',
    Health: 'Máu Tăng Tiến',
    'Health Scaling': 'Máu Tăng Tiến',
  };

  /**
   * Convert item name to multilingual format
   */
  private convertItemName(itemName: string) {
    const viName = this.itemNameMapping[itemName] || itemName;
    return {
      en: itemName,
      vi: viName,
    };
  }

  /**
   * Convert rune name to multilingual format
   */
  private convertRuneName(runeName: string) {
    const viName = this.runeNameMapping[runeName] || runeName;
    return {
      en: runeName,
      vi: viName,
    };
  }

  /**
   * Convert recommended items to multilingual format
   */
  private convertRecommendedItems(items: any[]) {
    if (!items || items.length === 0) return items;

    return items.map((itemGroup) => {
      const converted = { ...itemGroup };

      // Convert starting items
      if (converted.startingItems) {
        converted.startingItems = converted.startingItems.map((startGroup) => ({
          ...startGroup,
          items: startGroup.items.map((item) => this.convertItemName(item)),
        }));
      }

      // Convert boots
      if (converted.boots) {
        converted.boots = converted.boots.map((boot) => ({
          ...boot,
          name: this.convertItemName(boot.name),
        }));
      }

      // Convert core builds
      if (converted.coreBuilds) {
        converted.coreBuilds = converted.coreBuilds.map((build) => ({
          ...build,
          items: build.items.map((item) => this.convertItemName(item)),
        }));
      }

      // Convert situational items
      if (converted.situational) {
        Object.keys(converted.situational).forEach((key) => {
          if (Array.isArray(converted.situational[key])) {
            converted.situational[key] = converted.situational[key].map(
              (item) => ({
                ...item,
                name: this.convertItemName(item.name),
              }),
            );
          }
        });
      }

      return converted;
    });
  }

  /**
   * Convert recommended runes to multilingual format
   */
  private convertRecommendedRunes(runes: any[]) {
    if (!runes || runes.length === 0) return runes;

    return runes.map((runeGroup) => {
      const converted = { ...runeGroup };

      // Convert primary tree
      if (converted.primaryTree) {
        converted.primaryTree = {
          name: this.convertRuneName(converted.primaryTree.name),
          runes: converted.primaryTree.runes.map((rune) =>
            this.convertRuneName(rune),
          ),
        };
      }

      // Convert secondary tree
      if (converted.secondaryTree) {
        converted.secondaryTree = {
          name: this.convertRuneName(converted.secondaryTree.name),
          runes: converted.secondaryTree.runes.map((rune) =>
            this.convertRuneName(rune),
          ),
        };
      }

      // Convert stat shards
      if (converted.statShards) {
        converted.statShards = converted.statShards.map((shard) =>
          this.convertRuneName(shard),
        );
      }

      return converted;
    });
  }

  /**
   * Complete migration for all champions
   */
  async runCompleteMigration() {
    console.log('🚀 Starting Complete i18n Migration');
    console.log('===================================');

    const champions = await this.championModel.find().lean();
    let processedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const champion of champions) {
      try {
        console.log(`\n🔄 Processing ${champion.id}...`);
        processedCount++;

        // Fetch detailed data from both languages
        const [enDetails, viDetails] = await Promise.all([
          this.fetchChampionDetails(champion.id, 'en_US'),
          this.fetchChampionDetails(champion.id, 'vi_VN'),
        ]);

        if (!enDetails || !viDetails) {
          console.log(`❌ Could not fetch details for ${champion.id}`);
          errorCount++;
          continue;
        }

        // Prepare update data
        const updateData: any = {};

        // Convert abilities to multilingual if empty
        if (!champion.abilities || champion.abilities.length === 0) {
          const abilities = [];

          // Process spells (Q, W, E, R)
          if (enDetails.spells && viDetails.spells) {
            for (let i = 0; i < enDetails.spells.length; i++) {
              const enSpell = enDetails.spells[i];
              const viSpell = viDetails.spells[i];

              abilities.push({
                name: {
                  en: enSpell.name,
                  vi: viSpell.name,
                },
                description: {
                  en: enSpell.description,
                  vi: viSpell.description,
                },
                imageUrl: `https://ddragon.leagueoflegends.com/cdn/${this.version}/img/spell/${enSpell.image.full}`,
              });
            }
          }

          // Add passive
          if (enDetails.passive && viDetails.passive) {
            abilities.unshift({
              name: {
                en: enDetails.passive.name,
                vi: viDetails.passive.name,
              },
              description: {
                en: enDetails.passive.description,
                vi: viDetails.passive.description,
              },
              imageUrl: `https://ddragon.leagueoflegends.com/cdn/${this.version}/img/passive/${enDetails.passive.image.full}`,
            });
          }

          updateData.abilities = abilities;
          console.log(`✅ Added ${abilities.length} abilities`);
        }

        // Convert recommended items to multilingual
        if (champion.recommendedItems && champion.recommendedItems.length > 0) {
          updateData.recommendedItems = this.convertRecommendedItems(
            champion.recommendedItems,
          );
          console.log(`✅ Converted recommended items`);
        }

        // Convert recommended runes to multilingual
        if (champion.recommendedRunes && champion.recommendedRunes.length > 0) {
          updateData.recommendedRunes = this.convertRecommendedRunes(
            champion.recommendedRunes,
          );
          console.log(`✅ Converted recommended runes`);
        }

        // Update in database if there are changes
        if (Object.keys(updateData).length > 0) {
          await this.championModel.updateOne(
            { _id: champion._id },
            { $set: updateData },
          );
          updatedCount++;
          console.log(`✅ Updated ${champion.id}`);
        } else {
          console.log(`⏭️  No changes needed for ${champion.id}`);
        }

        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`❌ Error processing ${champion.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Processed: ${processedCount}`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`❌ Errors: ${errorCount}`);

    return { processedCount, updatedCount, errorCount };
  }
}

async function runCompleteMigration() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championsService = app.get(ChampionsService);
    const championModel = app.get('ChampionModel');

    const migration = new CompleteI18nMigration(
      championModel,
      championsService,
    );

    await migration.runCompleteMigration();

    console.log('\n🎉 Complete i18n migration finished!');
    console.log('\n📋 What was updated:');
    console.log('✅ Champion abilities (EN + VI)');
    console.log('✅ Recommended items (multilingual names)');
    console.log('✅ Recommended runes (multilingual names)');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

runCompleteMigration().catch(console.error);
