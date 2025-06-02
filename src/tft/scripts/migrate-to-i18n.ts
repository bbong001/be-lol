import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TftChampion } from '../schemas/tft-champion.schema';

class TftI18nMigration {
  private readonly version = '14.24.1'; // Current TFT set version

  constructor(private readonly tftChampionModel: Model<TftChampion>) {}

  /**
   * Detect if text is Vietnamese
   */
  private detectVietnamese(text: string): boolean {
    const vietnamesePattern =
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    return vietnamesePattern.test(text);
  }

  /**
   * Mapping for Vietnamese TFT traits
   */
  private getVietnameseTraitMapping(): Record<string, string> {
    return {
      // Set 14 TFT traits
      Rebel: 'Kẻ Nổi Loạn',
      Marksman: 'Xạ Thủ',
      Sorcerer: 'Phù Thủy',
      Brawler: 'Võ Sĩ',
      Infiltrator: 'Ám Sát',
      Support: 'Hỗ Trợ',
      Mystic: 'Huyền Thuật',
      Protector: 'Bảo Vệ',
      Blademaster: 'Kiếm Sĩ',
      Vanguard: 'Tiền Phong',
      Demolitionist: 'Phá Hủy',
      Cybernetic: 'Điện Tử',
      Void: 'Hư Không',
      'Dark Star': 'Ngôi Sao Đen',
      'Mech-Pilot': 'Phi Công Robot',
      Chrono: 'Thời Gian',
      Battlecast: 'Chiến Thuật',
      Astro: 'Phi Hành Gia',
      Sniper: 'Bắn Tỉa',

      // Additional TFT Set 14 traits
      'Golden Ox': 'Bò Vàng',
      'A.M.P.': 'A.M.P.',
      Bruiser: 'Võ Sĩ',
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
      // Add more mappings as needed
    };
  }

  /**
   * Get Vietnamese translation for trait
   */
  private getVietnameseTrait(englishTrait: string): string {
    const mapping = this.getVietnameseTraitMapping();
    return mapping[englishTrait] || englishTrait;
  }

  /**
   * Fetch TFT champion details from a Vietnamese TFT source (placeholder)
   */
  private async fetchVietnameseChampionData(
    championName: string,
  ): Promise<any> {
    try {
      // This is a placeholder - you would need to implement actual Vietnamese data source
      // For now, we'll use simple translation mapping
      console.log(`⚠️  Using placeholder Vietnamese data for ${championName}`);

      return {
        name: championName, // Usually names stay the same
        ability: {
          name: `${championName} - Kỹ Năng`,
          description: `Mô tả kỹ năng của ${championName} (cần cập nhật thực tế)`,
        },
      };
    } catch (error) {
      console.error(
        `Error fetching Vietnamese data for ${championName}:`,
        error.message,
      );
      return null;
    }
  }

  /**
   * Analyze current data structure
   */
  async analyzeCurrentData() {
    console.log('🔍 Analyzing current TFT champion data...');

    const champions = await this.tftChampionModel.find().limit(10).lean();

    if (champions.length === 0) {
      console.log('❌ No TFT champions found in database');
      return null;
    }

    const firstChampion = champions[0] as any;

    // Check if already multilingual
    if (
      typeof firstChampion.name === 'object' &&
      firstChampion.name.en &&
      firstChampion.name.vi
    ) {
      console.log('✅ Data is already in multilingual format');
      return {
        isMultilingual: true,
        currentStructure: 'multilingual',
      };
    }

    // Check if single language
    if (typeof firstChampion.name === 'string') {
      const isVietnamese = this.detectVietnamese(firstChampion.name);
      const sampleChampions = champions.slice(0, 5);

      console.log('\n📊 Sample data analysis:');
      sampleChampions.forEach((champ) => {
        const championData = champ as any;
        const champName =
          typeof championData.name === 'string'
            ? championData.name
            : championData.name?.en || championData.id;
        const lang = this.detectVietnamese(champName)
          ? 'Vietnamese'
          : 'English';
        console.log(`- ${champName} - Detected: ${lang}`);
      });

      return {
        isMultilingual: false,
        currentLanguage: isVietnamese ? ('vi' as const) : ('en' as const),
        totalChampions: await this.tftChampionModel.countDocuments(),
      };
    }

    console.log('❓ Unknown data structure');
    return null;
  }

  /**
   * Convert single language data to multilingual
   */
  async convertToMultilingual(currentLang: 'en' | 'vi') {
    console.log(
      `\n🔄 Converting TFT champions from ${currentLang} to multilingual format...`,
    );

    const champions = await this.tftChampionModel.find().lean();
    let converted = 0;
    let failed = 0;

    for (const champion of champions) {
      try {
        const championData = champion as any;

        // Skip if already multilingual
        if (typeof championData.name === 'object') {
          console.log(`⏭️  Skipping ${championData.id} - already multilingual`);
          continue;
        }

        console.log(`🔄 Converting ${championData.name}...`);

        // For TFT, we'll use the current English data and add placeholder Vietnamese
        const vietnameseData = await this.fetchVietnameseChampionData(
          championData.name,
        );

        // Create multilingual structure
        const multilingualData: any = {
          name: {
            en: championData.name,
            vi: vietnameseData?.name || championData.name,
          },
          lang: 'en', // Mark as migrated
        };

        // Convert traits to multilingual
        if (championData.traits && Array.isArray(championData.traits)) {
          multilingualData.traits = championData.traits.map(
            (trait: string) => ({
              en: trait,
              vi: this.getVietnameseTrait(trait),
            }),
          );
        }

        // Convert ability to multilingual
        if (championData.ability) {
          multilingualData.ability = {
            name: {
              en: championData.ability.name || `${championData.name} Ability`,
              vi:
                vietnameseData?.ability?.name || `Kỹ Năng ${championData.name}`,
            },
            description: {
              en: championData.ability.description || 'Ability description',
              vi: vietnameseData?.ability?.description || 'Mô tả kỹ năng',
            },
            mana: championData.ability.mana || '0',
          };
        }

        // Convert recommendedItemsData to multilingual
        if (
          championData.recommendedItemsData &&
          Array.isArray(championData.recommendedItemsData)
        ) {
          multilingualData.recommendedItemsData =
            championData.recommendedItemsData.map((item: any) => ({
              name: {
                en: item.name || 'Unknown Item',
                vi: item.name || 'Vật Phẩm Không Rõ', // Placeholder, should be properly translated
              },
              imageUrl: item.imageUrl,
            }));
        }

        // Update in database
        await this.tftChampionModel.updateOne(
          { _id: championData._id },
          { $set: multilingualData },
        );

        console.log(`✅ Converted ${championData.name}`);
        converted++;

        // Add delay to avoid potential issues
        await new Promise((resolve) => setTimeout(resolve, 50));
      } catch (error) {
        console.error(`❌ Error converting ${champion.name}:`, error.message);
        failed++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successfully converted: ${converted}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📝 Total processed: ${champions.length}`);
  }

  /**
   * Validate converted data
   */
  async validateConversion() {
    console.log('\n🔍 Validating converted TFT data...');

    const champions = await this.tftChampionModel.find().limit(5).lean();

    let valid = 0;
    let invalid = 0;

    champions.forEach((champion: any) => {
      const hasMultilingualName =
        champion.name &&
        typeof champion.name === 'object' &&
        champion.name.en &&
        champion.name.vi;

      const hasMultilingualTraits =
        champion.traits &&
        Array.isArray(champion.traits) &&
        champion.traits.length > 0 &&
        champion.traits[0].en &&
        champion.traits[0].vi;

      if (hasMultilingualName && hasMultilingualTraits) {
        console.log(
          `✅ ${champion.name.en}: EN(${champion.name.en}) / VI(${champion.name.vi})`,
        );
        valid++;
      } else {
        console.log(
          `❌ ${champion.name?.en || champion.name}: Invalid structure`,
        );
        invalid++;
      }
    });

    console.log(`\n📊 Validation Result:`);
    console.log(`✅ Valid: ${valid}/${champions.length}`);
    console.log(`❌ Invalid: ${invalid}/${champions.length}`);

    return { valid, invalid, total: champions.length };
  }
}

async function runTftMigration() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const tftChampionModel = app.get<Model<TftChampion>>(
      getModelToken(TftChampion.name),
    );
    const migration = new TftI18nMigration(tftChampionModel);

    console.log('🚀 TFT Champion i18n Migration Tool');
    console.log('===================================');

    // 1. Analyze current data
    const analysis = await migration.analyzeCurrentData();

    if (!analysis) {
      console.log('❌ Could not analyze data structure');
      return;
    }

    if (analysis.isMultilingual) {
      console.log('✅ Data is already multilingual. Validating...');
      await migration.validateConversion();
      return;
    }

    // 2. Convert to multilingual if needed
    if (!analysis.isMultilingual) {
      console.log(
        `\n🔄 Current data is in ${analysis.currentLanguage === 'en' ? 'English' : 'Vietnamese'}`,
      );
      console.log(
        `📊 Total TFT champions to convert: ${analysis.totalChampions}`,
      );

      console.log(
        '\n⚠️  This will modify all TFT champion records in the database',
      );
      console.log('🚀 Starting conversion...');

      await migration.convertToMultilingual(analysis.currentLanguage);
    }

    // 3. Validate conversion
    await migration.validateConversion();

    console.log('\n🎉 TFT Migration completed successfully!');
    console.log('\n📖 You can now use:');
    console.log('- GET /tft/champions?lang=en (English)');
    console.log('- GET /tft/champions?lang=vi (Vietnamese)');
    console.log('- GET /tft/champions/name/Jinx?lang=vi');
  } catch (error) {
    console.error('❌ TFT Migration failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

// Run migration
runTftMigration();
