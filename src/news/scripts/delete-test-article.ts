import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { NewsService } from '../news.service';

async function deleteTestArticle() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const newsService = app.get(NewsService);

  try {
    const slug = 'tuong-lol-ho-tro-duoc-chon-choi-nhieu-nhat';

    console.log(`🗑️ Xóa bài viết với slug: ${slug}`);

    await newsService.delete(slug);

    console.log('✅ Đã xóa bài viết thành công!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await app.close();
  }
}

deleteTestArticle().catch(console.error);
