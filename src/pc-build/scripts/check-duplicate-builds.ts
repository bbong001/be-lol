import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PcBuildService } from '../pc-build.service';

async function checkSpecificBuilds() {
  console.log('🔍 Checking specific duplicate builds...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const pcBuildService = app.get(PcBuildService);
  
  const ids = ['682c0a81badf603f6f0a5ee6', '68304d24c03ddc61afde601f'];
  
  for (const id of ids) {
    try {
      const build: any = await pcBuildService.findBuildById(id);
      console.log(`✅ ID ${id}: EXISTS`);
      console.log(`   - Name: ${build.name}`);
      console.log(`   - Created: ${build.createdAt}`);
      console.log(`   - Public: ${build.isPublic}`);
      console.log('');
    } catch (error: any) {
      console.log(`❌ ID ${id}: NOT FOUND - ${error.message}`);
      console.log('');
    }
  }
  
  await app.close();
}

checkSpecificBuilds().catch(console.error); 