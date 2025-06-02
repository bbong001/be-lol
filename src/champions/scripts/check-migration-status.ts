import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { ChampionDocument } from '../schemas/champion.schema';

async function checkMigrationStatus() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const championModel = app.get('ChampionModel') as Model<ChampionDocument>;

    console.log('🔍 Checking Migration Status');
    console.log('=============================');

    const allChampions = await championModel.find({}).lean();
    console.log(`Total champions: ${allChampions.length}`);

    let migratedCount = 0;
    let notMigratedCount = 0;
    const notMigrated = [];
    const migrated = [];

    for (const champion of allChampions) {
      const isNameMultilingual =
        typeof champion.name === 'object' &&
        champion.name?.en &&
        champion.name?.vi;
      const isTitleMultilingual =
        typeof champion.title === 'object' &&
        champion.title?.en &&
        champion.title?.vi;

      if (isNameMultilingual && isTitleMultilingual) {
        migratedCount++;
        migrated.push(champion.id);
      } else {
        notMigratedCount++;
        notMigrated.push({
          id: champion.id,
          name: champion.name,
          title: champion.title,
          nameType: typeof champion.name,
          titleType: typeof champion.title,
        });
      }
    }

    console.log(`\n📊 Migration Status:`);
    console.log(`✅ Migrated: ${migratedCount}`);
    console.log(`❌ Not Migrated: ${notMigratedCount}`);

    if (notMigrated.length > 0) {
      console.log(`\n❌ Champions NOT migrated:`);
      notMigrated.forEach((champ) => {
        console.log(
          `- ${champ.id}: name(${champ.nameType}), title(${champ.titleType})`,
        );
        if (typeof champ.name === 'string') {
          console.log(`  Name: "${champ.name}"`);
        }
        if (typeof champ.title === 'string') {
          console.log(`  Title: "${champ.title}"`);
        }
      });
    }

    if (migrated.length > 0 && migrated.length <= 10) {
      console.log(`\n✅ Sample migrated champions:`);
      migrated.slice(0, 5).forEach((id) => console.log(`- ${id}`));
    }

    return {
      migratedCount,
      notMigratedCount,
      notMigrated: notMigrated.map((c) => c.id),
    };
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await app.close();
  }
}

checkMigrationStatus().catch(console.error);
