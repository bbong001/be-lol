import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TftChampion } from '../schemas/tft-champion.schema';

class TftDataValidator {
  constructor(private readonly tftChampionModel: Model<TftChampion>) {}

  /**
   * Validate data structure and integrity
   */
  async validateDataIntegrity() {
    console.log('🔍 Validating TFT data integrity...');

    const champions = await this.tftChampionModel.find().lean();
    const validationResults = {
      totalChampions: champions.length,
      validChampions: 0,
      issues: [] as string[],
      structure: {
        validNames: 0,
        validTraits: 0,
        validAbilities: 0,
        validItems: 0,
      },
      translations: {
        completeTraits: 0,
        completeItems: 0,
        incompleteTraits: 0,
        incompleteItems: 0,
      },
    };

    for (const champion of champions) {
      const championData = champion as any;
      const champName = this.getChampionName(championData);
      let championValid = true;

      // Validate name structure
      if (this.validateName(championData)) {
        validationResults.structure.validNames++;
      } else {
        championValid = false;
        validationResults.issues.push(`${champName}: Invalid name structure`);
      }

      // Validate traits
      if (this.validateTraits(championData)) {
        validationResults.structure.validTraits++;
      } else {
        championValid = false;
        validationResults.issues.push(`${champName}: Invalid traits structure`);
      }

      // Validate ability
      if (this.validateAbility(championData)) {
        validationResults.structure.validAbilities++;
      } else {
        validationResults.issues.push(
          `${champName}: Invalid ability structure`,
        );
      }

      // Validate items
      if (this.validateItems(championData)) {
        validationResults.structure.validItems++;
      } else {
        validationResults.issues.push(`${champName}: Invalid items structure`);
      }

      // Check translations completeness
      this.checkTranslations(championData, validationResults);

      if (championValid) {
        validationResults.validChampions++;
      }
    }

    this.printValidationReport(validationResults);
    return validationResults;
  }

  private getChampionName(championData: any): string {
    return typeof championData.name === 'string'
      ? championData.name
      : championData.name?.en || 'Unknown';
  }

  private validateName(championData: any): boolean {
    return (
      championData.name &&
      typeof championData.name === 'object' &&
      championData.name.en &&
      championData.name.vi
    );
  }

  private validateTraits(championData: any): boolean {
    if (!Array.isArray(championData.traits)) return false;

    return championData.traits.every(
      (trait: any) =>
        typeof trait === 'object' && trait.en && typeof trait.en === 'string',
    );
  }

  private validateAbility(championData: any): boolean {
    if (!championData.ability) return true; // Optional field

    return (
      typeof championData.ability === 'object' &&
      (championData.ability.name === undefined ||
        (typeof championData.ability.name === 'object' &&
          championData.ability.name.en))
    );
  }

  private validateItems(championData: any): boolean {
    // Validate recommendedItems
    if (
      championData.recommendedItems &&
      !Array.isArray(championData.recommendedItems)
    ) {
      return false;
    }

    if (championData.recommendedItems) {
      const validItems = championData.recommendedItems.every(
        (item: any) =>
          typeof item === 'object' && item.en && typeof item.en === 'string',
      );
      if (!validItems) return false;
    }

    // Validate recommendedItemsData
    if (
      championData.recommendedItemsData &&
      !Array.isArray(championData.recommendedItemsData)
    ) {
      return false;
    }

    if (championData.recommendedItemsData) {
      const validItemsData = championData.recommendedItemsData.every(
        (item: any) =>
          item.name &&
          typeof item.name === 'object' &&
          item.name.en &&
          item.imageUrl,
      );
      if (!validItemsData) return false;
    }

    return true;
  }

  private checkTranslations(championData: any, results: any) {
    // Check trait translations
    if (Array.isArray(championData.traits)) {
      championData.traits.forEach((trait: any) => {
        if (trait.vi && trait.vi !== trait.en) {
          results.translations.completeTraits++;
        } else {
          results.translations.incompleteTraits++;
        }
      });
    }

    // Check item translations
    if (Array.isArray(championData.recommendedItems)) {
      championData.recommendedItems.forEach((item: any) => {
        if (item.vi && item.vi !== item.en) {
          results.translations.completeItems++;
        } else {
          results.translations.incompleteItems++;
        }
      });
    }
  }

  private printValidationReport(results: any) {
    console.log('\n📊 TFT Data Validation Report');
    console.log('============================');
    console.log(`📊 Total Champions: ${results.totalChampions}`);
    console.log(`✅ Valid Champions: ${results.validChampions}`);
    console.log(
      `❌ Champions with Issues: ${results.totalChampions - results.validChampions}`,
    );

    console.log('\n🏗️  Structure Validation:');
    console.log(
      `  ✅ Valid Names: ${results.structure.validNames}/${results.totalChampions}`,
    );
    console.log(
      `  ✅ Valid Traits: ${results.structure.validTraits}/${results.totalChampions}`,
    );
    console.log(
      `  ✅ Valid Abilities: ${results.structure.validAbilities}/${results.totalChampions}`,
    );
    console.log(
      `  ✅ Valid Items: ${results.structure.validItems}/${results.totalChampions}`,
    );

    console.log('\n🌐 Translation Status:');
    console.log(
      `  ✅ Complete Trait Translations: ${results.translations.completeTraits}`,
    );
    console.log(
      `  ❌ Incomplete Trait Translations: ${results.translations.incompleteTraits}`,
    );
    console.log(
      `  ✅ Complete Item Translations: ${results.translations.completeItems}`,
    );
    console.log(
      `  ❌ Incomplete Item Translations: ${results.translations.incompleteItems}`,
    );

    if (results.issues.length > 0) {
      console.log('\n❌ Issues Found:');
      results.issues.slice(0, 10).forEach((issue: string) => {
        console.log(`  - ${issue}`);
      });
      if (results.issues.length > 10) {
        console.log(`  ... and ${results.issues.length - 10} more issues`);
      }
    }

    const overallScore =
      (results.validChampions / results.totalChampions) * 100;
    console.log(`\n📈 Overall Data Quality Score: ${overallScore.toFixed(1)}%`);

    if (overallScore >= 95) {
      console.log('🎉 Excellent data quality!');
    } else if (overallScore >= 85) {
      console.log('👍 Good data quality');
    } else if (overallScore >= 70) {
      console.log('⚠️  Data quality needs improvement');
    } else {
      console.log('🚨 Poor data quality - immediate attention required');
    }
  }

  /**
   * Quick health check
   */
  async quickHealthCheck() {
    console.log('⚡ Running TFT data quick health check...');

    const totalChampions = await this.tftChampionModel.countDocuments();
    const championsWithNames = await this.tftChampionModel.countDocuments({
      'name.en': { $exists: true, $ne: null },
    });
    const championsWithTraits = await this.tftChampionModel.countDocuments({
      traits: { $exists: true, $type: 'array', $ne: [] },
    });

    console.log(`📊 Total Champions: ${totalChampions}`);
    console.log(`✅ Champions with Names: ${championsWithNames}`);
    console.log(`✅ Champions with Traits: ${championsWithTraits}`);

    const healthScore =
      ((championsWithNames + championsWithTraits) / (totalChampions * 2)) * 100;
    console.log(`💊 Health Score: ${healthScore.toFixed(1)}%`);

    return {
      totalChampions,
      championsWithNames,
      championsWithTraits,
      healthScore,
    };
  }
}

async function runTftDataValidation() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const tftChampionModel = app.get<Model<TftChampion>>(
      getModelToken(TftChampion.name),
    );
    const validator = new TftDataValidator(tftChampionModel);

    // Run quick health check first
    await validator.quickHealthCheck();

    console.log('\n' + '='.repeat(50));

    // Run full validation
    const results = await validator.validateDataIntegrity();

    if (results.issues.length === 0) {
      console.log('\n🎉 All TFT data validation checks passed!');
    } else {
      console.log(
        '\n⚠️  TFT data validation found issues that need attention.',
      );
    }
  } catch (error) {
    console.error('❌ TFT data validation failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

// Run validation
runTftDataValidation();
