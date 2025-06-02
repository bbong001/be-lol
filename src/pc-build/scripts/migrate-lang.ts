import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { PCBuild, PCBuildDocument } from '../schemas/pc-build.schema';
import { getModelToken } from '@nestjs/mongoose';

async function migratePCBuildsLang() {
  console.log('🔄 Starting PC Builds Lang Migration...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const pcBuildModel: Model<PCBuildDocument> = app.get(
    getModelToken(PCBuild.name),
  );

  try {
    // Check current state
    console.log('📊 Checking current state...');
    const totalBuilds = await pcBuildModel.countDocuments().exec();
    const buildsWithLang = await pcBuildModel
      .countDocuments({ lang: { $exists: true } })
      .exec();
    const buildsWithoutLang = totalBuilds - buildsWithLang;

    console.log(`Total PC builds: ${totalBuilds}`);
    console.log(`Builds with lang field: ${buildsWithLang}`);
    console.log(`Builds without lang field: ${buildsWithoutLang}\n`);

    if (buildsWithoutLang === 0) {
      console.log(
        '✅ All PC builds already have lang field. Migration not needed.',
      );
      return;
    }

    // Perform migration
    console.log('🚀 Starting migration...');

    const result = await pcBuildModel
      .updateMany({ lang: { $exists: false } }, { $set: { lang: 'vi' } })
      .exec();

    console.log(`✅ Migration completed successfully!`);
    console.log(`Updated ${result.modifiedCount} PC builds with lang: 'vi'\n`);

    // Verify migration
    console.log('🔍 Verifying migration...');
    const finalBuildsWithLang = await pcBuildModel
      .countDocuments({ lang: { $exists: true } })
      .exec();
    const finalBuildsWithoutLang = totalBuilds - finalBuildsWithLang;

    console.log(`Builds with lang field: ${finalBuildsWithLang}`);
    console.log(`Builds without lang field: ${finalBuildsWithoutLang}`);

    if (finalBuildsWithoutLang === 0) {
      console.log(
        '✅ Migration verification successful! All builds now have lang field.',
      );
    } else {
      console.log('⚠️ Warning: Some builds still missing lang field.');
    }

    // Show language distribution
    console.log('\n📈 Language distribution:');
    const viBuilds = await pcBuildModel.countDocuments({ lang: 'vi' }).exec();
    const enBuilds = await pcBuildModel.countDocuments({ lang: 'en' }).exec();

    console.log(`Vietnamese (vi): ${viBuilds} builds`);
    console.log(`English (en): ${enBuilds} builds`);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await app.close();
    console.log('\n🏁 Migration process completed');
  }
}

// Run migration
migratePCBuildsLang()
  .then(() => {
    console.log('\n✨ PC Builds lang migration finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 PC Builds lang migration failed:', error);
    process.exit(1);
  });
