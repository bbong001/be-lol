import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { ChampionDocument } from '../schemas/champion.schema';

async function testCompleteMigration() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championModel = app.get('ChampionModel') as Model<ChampionDocument>;

    console.log('🧪 Testing Complete Migration Results');
    console.log('=====================================');

    // Test with Ahri
    const champion = await championModel.findOne({ id: 'Ahri' }).lean();

    if (!champion) {
      console.log('❌ Champion not found');
      return;
    }

    console.log(`\n🎯 Testing Champion: ${champion.id}`);
    console.log('=====================================');

    // Test Name and Title
    console.log('📝 Name & Title:');
    console.log(`   EN: ${champion.name?.en} - ${champion.title?.en}`);
    console.log(`   VI: ${champion.name?.vi} - ${champion.title?.vi}`);

    // Test Abilities
    console.log(`\n⚡ Abilities: ${champion.abilities?.length || 0} found`);
    if (champion.abilities && champion.abilities.length > 0) {
      champion.abilities.slice(0, 2).forEach((ability: any, index: number) => {
        console.log(`   ${index + 1}. EN: ${ability.name?.en}`);
        console.log(`      VI: ${ability.name?.vi}`);
      });
    }

    // Test Recommended Runes
    console.log(
      `\n🎯 Recommended Runes: ${champion.recommendedRunes?.length || 0} sets`,
    );
    if (champion.recommendedRunes && champion.recommendedRunes.length > 0) {
      const rune = champion.recommendedRunes[0] as any;
      if (rune.primaryTree?.name) {
        console.log(`   Primary Tree:`);
        console.log(
          `      EN: ${rune.primaryTree.name?.en || rune.primaryTree.name}`,
        );
        console.log(
          `      VI: ${rune.primaryTree.name?.vi || rune.primaryTree.name}`,
        );
      }
    }

    // Test Recommended Items
    console.log(
      `\n🛡️  Recommended Items: ${champion.recommendedItems?.length || 0} sets`,
    );
    if (champion.recommendedItems && champion.recommendedItems.length > 0) {
      const itemSet = champion.recommendedItems[0] as any;
      if (itemSet.boots && itemSet.boots.length > 0) {
        const boot = itemSet.boots[0];
        console.log(`   First Boot:`);
        console.log(`      EN: ${boot.name?.en || boot.name}`);
        console.log(`      VI: ${boot.name?.vi || boot.name}`);
      }
    }

    // Summary
    console.log('\n📊 Migration Status:');
    console.log(
      `✅ Name & Title: ${champion.name?.en && champion.name?.vi ? 'Multilingual' : 'Single Language'}`,
    );
    console.log(
      `✅ Abilities: ${champion.abilities?.length > 0 ? 'Available' : 'Missing'}`,
    );
    console.log(
      `✅ Recommended Runes: ${champion.recommendedRunes?.length > 0 ? 'Available' : 'Missing'}`,
    );
    console.log(
      `✅ Recommended Items: ${champion.recommendedItems?.length > 0 ? 'Available' : 'Missing'}`,
    );

    // Test if abilities have multilingual names
    if (champion.abilities && champion.abilities.length > 0) {
      const firstAbility = champion.abilities[0] as any;
      const hasMultilingualAbility =
        firstAbility.name?.en && firstAbility.name?.vi;
      console.log(
        `✅ Abilities Multilingual: ${hasMultilingualAbility ? 'Yes' : 'No'}`,
      );
    }

    // Test if runes have multilingual names
    if (champion.recommendedRunes && champion.recommendedRunes.length > 0) {
      const rune = champion.recommendedRunes[0] as any;
      const hasMultilingualRunes =
        rune.primaryTree?.name?.en && rune.primaryTree?.name?.vi;
      console.log(
        `✅ Runes Multilingual: ${hasMultilingualRunes ? 'Yes' : 'No'}`,
      );
    }

    // Test if items have multilingual names
    if (champion.recommendedItems && champion.recommendedItems.length > 0) {
      const itemSet = champion.recommendedItems[0] as any;
      let hasMultilingualItems = false;
      if (itemSet.boots && itemSet.boots.length > 0) {
        const boot = itemSet.boots[0];
        hasMultilingualItems = boot.name?.en && boot.name?.vi;
      }
      console.log(
        `✅ Items Multilingual: ${hasMultilingualItems ? 'Yes' : 'No'}`,
      );
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await app.close();
  }
}

testCompleteMigration().catch(console.error);
