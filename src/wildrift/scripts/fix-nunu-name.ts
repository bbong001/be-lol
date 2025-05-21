import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';

/**
 * Script để cập nhật tên Nunu & Willump thành Nunu cho phù hợp với Wild Rift
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('Bắt đầu cập nhật tên tướng Nunu & Willump -> Nunu');

    // Lấy WrChampion model
    const wrChampionModel = app.get(getModelToken('WrChampion'));

    // Tìm tướng Nunu & Willump
    const nunu = await wrChampionModel
      .findOne({ name: 'Nunu & Willump' })
      .exec();

    if (!nunu) {
      console.log('Không tìm thấy tướng Nunu & Willump trong database');
      return;
    }

    // Cập nhật tên
    const result = await wrChampionModel.updateOne(
      { _id: nunu._id },
      { name: 'Nunu' },
    );

    if (result.matchedCount === 1 && result.modifiedCount === 1) {
      console.log(
        'Đã cập nhật thành công tên tướng từ "Nunu & Willump" thành "Nunu"',
      );
    } else {
      console.log('Không thể cập nhật tên tướng, có lỗi xảy ra');
    }
  } catch (error) {
    console.error(`Lỗi: ${error.message}`);
    console.error(error);
  } finally {
    await app.close();
    console.log('Hoàn thành cập nhật tên tướng');
  }
}

// Chạy script
bootstrap();
