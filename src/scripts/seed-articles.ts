import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { NewsService } from '../news/news.service';
import { testArticles } from '../../test/data/articles';
import { Model } from 'mongoose';
import { User } from '../user/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const newsService = app.get(NewsService);
  const userModel = app.get<Model<User>>(getModelToken(User.name));

  console.log('Starting to seed articles...');

  try {
    // Find first admin user or create one if none exists
    let adminUser = await userModel.findOne({ role: 'admin' });

    if (!adminUser) {
      console.log('No admin user found, creating one...');
      adminUser = await userModel.create({
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'admin123', // This will be hashed by the pre-save hook
        role: 'admin',
      });
      console.log('Created admin user:', adminUser._id);
    }

    const userId = adminUser._id.toString();
    console.log('Using user ID:', userId);

    for (const article of testArticles) {
      try {
        await newsService.create(
          {
            title: article.title,
            content: article.content,
            summary: article.summary,
            imageUrl: article.imageUrl,
            tags: article.tags,
            published: article.published,
            slug: article.slug,
          },
          userId,
        );
        console.log(`Created article: ${article.title}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`Article already exists: ${article.title}`);
        } else {
          console.error(
            `Error creating article ${article.title}:`,
            error.message,
          );
        }
      }
    }

    console.log('Finished seeding articles!');
  } catch (error) {
    console.error('Error seeding articles:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
