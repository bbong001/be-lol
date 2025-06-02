import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CounterService } from '../services/counter.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const counterService = app.get(CounterService);

  try {
    console.log('🗑️ Deleting Zeri counter data...');

    // Find and delete Zeri counter data
    await counterService.removeByChampionAndRole('Zeri', 'adc');

    console.log('✅ Successfully deleted Zeri counter data!');
  } catch (error) {
    console.error('❌ Error deleting Zeri counter data:', error.message);
  } finally {
    await app.close();
  }
}

main().catch(console.error);
