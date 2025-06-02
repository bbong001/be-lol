import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { Article, ArticleDocument } from '../schemas/article.schema';
import { getModelToken } from '@nestjs/mongoose';

async function migrateLangField() {
  console.log('🚀 Starting lang field migration...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const articleModel: Model<ArticleDocument> = app.get(
    getModelToken(Article.name),
  );

  try {
    // Check articles without lang field
    const articlesWithoutLang = await articleModel.countDocuments({
      lang: { $exists: false },
    });

    console.log(`📊 Found ${articlesWithoutLang} articles without lang field`);

    if (articlesWithoutLang === 0) {
      console.log(
        '✅ All articles already have lang field. Migration not needed.',
      );
      await app.close();
      return;
    }

    // Update all articles without lang field to have lang: 'vi'
    const result = await articleModel.updateMany(
      { lang: { $exists: false } },
      { $set: { lang: 'vi' } },
    );

    console.log(`✅ Updated ${result.modifiedCount} articles with lang: 'vi'`);

    // Verify the migration
    const verification = await articleModel.find({}).limit(5).exec();
    console.log('\n🔍 Sample articles after migration:');
    verification.forEach((article, index) => {
      console.log(`${index + 1}. ${article.title} - Lang: ${article.lang}`);
    });

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully updated: ${result.modifiedCount} articles`);
    console.log('✅ All existing articles now have lang: "vi"');
    console.log('✅ Admin can now create new articles with lang: "en"');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await app.close();
    console.log('\n🏁 Migration completed');
  }
}

// Run migration
migrateLangField()
  .then(() => {
    console.log('✨ Migration script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
