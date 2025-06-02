import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { ChampionsService } from '../champions.service';
import { InjectModel } from '@nestjs/mongoose';
import { Champion, ChampionDocument } from '../schemas/champion.schema';
import { Model } from 'mongoose';
import axios from 'axios';

class MigrationService {
  constructor(
    private championModel: Model<ChampionDocument>,
    private championsService: ChampionsService,
  ) {}

  private readonly version = '15.9.1';

  /**
   * Detect if text is Vietnamese by checking for Vietnamese characters
   */
  private detectVietnamese(text: string): boolean {
    if (!text) return false;

    // Vietnamese specific characters
    const vietnameseChars =
      /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

    // Common Vietnamese words in LoL
    const vietnameseWords =
      /(cửu vĩ|thần tốc|bóng tối|băng giá|lửa|sét|ma thuật|chiến binh|pháp sư|sát thủ)/i;

    return vietnameseChars.test(text) || vietnameseWords.test(text);
  }

  /**
   * Fetch translation from Riot API
   */
  private async fetchTranslation(
    championId: string,
    isVietnamese: boolean,
  ): Promise<any> {
    try {
      // If current data is Vietnamese, fetch English; if English, fetch Vietnamese
      const targetLang = isVietnamese ? 'en_US' : 'vi_VN';

      const response = await axios.get(
        `https://ddragon.leagueoflegends.com/cdn/${this.version}/data/${targetLang}/champion/${championId}.json`,
      );

      return response.data.data[championId];
    } catch (error) {
      console.error(
        `Error fetching translation for ${championId}:`,
        error.message,
      );
      return null;
    }
  }

  /**
   * Check current data structure and language
   */
  async analyzeCurrentData() {
    console.log('🔍 Analyzing current champion data...');

    const champions = await this.championModel.find().limit(10).lean();

    if (champions.length === 0) {
      console.log('❌ No champions found in database');
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
        // Cast to any to handle mixed type scenario
        const championData = champ as any;
        const champName =
          typeof championData.name === 'string'
            ? championData.name
            : championData.name?.en || championData.id;
        const lang = this.detectVietnamese(champName)
          ? 'Vietnamese'
          : 'English';
        console.log(
          `- ${champName} (${championData.title || championData.title?.en || 'N/A'}) - Detected: ${lang}`,
        );
      });

      return {
        isMultilingual: false,
        currentLanguage: isVietnamese ? ('vi' as const) : ('en' as const),
        totalChampions: await this.championModel.countDocuments(),
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
      `\n🔄 Converting from ${currentLang} to multilingual format...`,
    );

    const champions = await this.championModel.find().lean();
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

        console.log(
          `🔄 Converting ${championData.name} (${championData.id})...`,
        );

        // Fetch translation
        const translation = await this.fetchTranslation(
          championData.id,
          currentLang === 'vi',
        );

        if (!translation) {
          console.log(`❌ Failed to fetch translation for ${championData.id}`);
          failed++;
          continue;
        }

        // Create multilingual structure
        const multilingualData = {
          name: {
            [currentLang]: championData.name,
            [currentLang === 'en' ? 'vi' : 'en']: translation.name,
          },
          title: {
            [currentLang]: championData.title || '',
            [currentLang === 'en' ? 'vi' : 'en']: translation.title || '',
          },
        };

        // Update in database
        await this.championModel.updateOne(
          { _id: championData._id },
          {
            $set: multilingualData,
          },
        );

        console.log(`✅ Converted ${championData.name} -> ${translation.name}`);
        converted++;

        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Error converting ${champion.id}:`, error.message);
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
    console.log('\n🔍 Validating converted data...');

    const champions = await this.championModel.find().limit(5).lean();

    let valid = 0;
    let invalid = 0;

    champions.forEach((champion: any) => {
      const hasMultilingualName =
        champion.name &&
        typeof champion.name === 'object' &&
        champion.name.en &&
        champion.name.vi;

      const hasMultilingualTitle =
        champion.title &&
        typeof champion.title === 'object' &&
        champion.title.en &&
        champion.title.vi;

      if (hasMultilingualName && hasMultilingualTitle) {
        console.log(
          `✅ ${champion.id}: EN(${champion.name.en}) / VI(${champion.name.vi})`,
        );
        valid++;
      } else {
        console.log(`❌ ${champion.id}: Invalid structure`);
        invalid++;
      }
    });

    console.log(`\n📊 Validation Result:`);
    console.log(`✅ Valid: ${valid}/${champions.length}`);
    console.log(`❌ Invalid: ${invalid}/${champions.length}`);

    return { valid, invalid, total: champions.length };
  }
}

async function runMigration() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get services
  const championsService = app.get(ChampionsService);
  const championModel = app.get('ChampionModel'); // Get the model token

  const migrationService = new MigrationService(
    championModel,
    championsService,
  );

  console.log('🚀 Champion i18n Migration Tool');
  console.log('================================');

  try {
    // 1. Analyze current data
    const analysis = await migrationService.analyzeCurrentData();

    if (!analysis) {
      console.log('❌ Could not analyze data structure');
      return;
    }

    if (analysis.isMultilingual) {
      console.log('✅ Data is already multilingual. Validating...');
      await migrationService.validateConversion();
      return;
    }

    // 2. Convert to multilingual if needed
    if (!analysis.isMultilingual) {
      console.log(
        `\n🔄 Current data is in ${analysis.currentLanguage === 'en' ? 'English' : 'Vietnamese'}`,
      );
      console.log(`📊 Total champions to convert: ${analysis.totalChampions}`);

      // Ask for confirmation (in real scenario)
      console.log(
        '\n⚠️  This will modify all champion records in the database',
      );
      console.log('🚀 Starting conversion...');

      await migrationService.convertToMultilingual(analysis.currentLanguage);
    }

    // 3. Validate conversion
    await migrationService.validateConversion();

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📖 You can now use:');
    console.log('- GET /champions?lang=en (English)');
    console.log('- GET /champions?lang=vi (Vietnamese)');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

// Run the migration
runMigration().catch(console.error);
