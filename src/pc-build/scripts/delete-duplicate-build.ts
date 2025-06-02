import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PcBuildService } from '../pc-build.service';

async function deleteDuplicateBuild() {
  console.log('🗑️ Deleting duplicate build...\n');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const pcBuildService = app.get(PcBuildService);
  
  // ID của bài viết cũ cần xóa
  const oldBuildId = '682c0a81badf603f6f0a5ee6';
  const adminUserId = '681dcf20cf2e99c8b82923a7'; // Admin user ID
  
  try {
    // Kiểm tra bài viết trước khi xóa
    const build: any = await pcBuildService.findBuildById(oldBuildId);
    console.log(`📋 Found build to delete:`);
    console.log(`   - ID: ${oldBuildId}`);
    console.log(`   - Name: ${build.name}`);
    console.log(`   - Created: ${build.createdAt}`);
    console.log('');
    
    // Xóa bài viết (với quyền admin)
    await pcBuildService.deleteBuild(oldBuildId, adminUserId, ['admin']);
    console.log(`✅ Successfully deleted duplicate build: ${oldBuildId}`);
    
    // Kiểm tra lại danh sách sau khi xóa
    console.log('\n🔍 Checking remaining builds...');
    const remainingBuilds = await pcBuildService.findAllBuilds(10, 1, 'vi');
    
    const sensConverterBuilds = remainingBuilds.builds.filter((build: any) => 
      build.name.includes('Sens Converter')
    );
    
    console.log(`📊 Remaining "Sens Converter" builds: ${sensConverterBuilds.length}`);
    sensConverterBuilds.forEach((build: any) => {
      console.log(`   - ID: ${build._id}, Created: ${build.createdAt}`);
    });
    
  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  } finally {
    await app.close();
  }
}

deleteDuplicateBuild().catch(console.error); 