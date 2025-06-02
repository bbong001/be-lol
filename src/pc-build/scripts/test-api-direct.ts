import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PcBuildService } from '../pc-build.service';

async function testPcBuildAPI() {
  console.log('🔧 Testing PC Build API directly...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const pcBuildService = app.get(PcBuildService);

  try {
    // Test 1: Get all builds using service
    console.log('📋 Test 1: Getting all builds via service...');
    const serviceResult = await pcBuildService.findAllBuilds(10, 1, 'vi');
    console.log(
      `✅ Service returned ${serviceResult.builds.length} builds out of ${serviceResult.total} total`,
    );
    
    console.log('\n📝 Build details from service:');
    serviceResult.builds.forEach((build: any, index) => {
      console.log(`${index + 1}. "${build.name}" (ID: ${build._id})`);
      console.log(`   - Created: ${build.createdAt}`);
      console.log(`   - Public: ${build.isPublic}`);
      console.log(`   - Language: ${build.lang}`);
      console.log('');
    });

    // Test 2: Check each build individually
    console.log('🔍 Test 2: Checking each build individually...');
    for (const build of serviceResult.builds) {
      try {
        const buildDoc = build as any;
        const individualBuild = await pcBuildService.findBuildById(buildDoc._id);
        console.log(`✅ Build "${build.name}" exists individually`);
      } catch (error: any) {
        console.log(
          `❌ Build "${build.name}" NOT FOUND individually! Error: ${error.message}`,
        );
      }
    }

    // Test 3: Check duplicate builds
    console.log('\n🔍 Test 3: Checking for duplicate builds...');
    const buildNames = serviceResult.builds.map((build) => build.name);
    const duplicateNames = buildNames.filter(
      (name, index) => buildNames.indexOf(name) !== index,
    );
    
    if (duplicateNames.length > 0) {
      console.log('⚠️ Found duplicate build names:');
      duplicateNames.forEach((name) => {
        const duplicates = serviceResult.builds.filter((build) => build.name === name);
        console.log(`  - "${name}" appears ${duplicates.length} times:`);
        duplicates.forEach((build: any) => {
          console.log(`    ID: ${build._id}, Created: ${build.createdAt}`);
        });
      });
    } else {
      console.log('✅ No duplicate build names found');
    }

    console.log('\n🎉 API test completed successfully!');

  } catch (error) {
    console.error('❌ Error during API test:', error);
  } finally {
    await app.close();
  }
}

// Run the test
testPcBuildAPI().catch(console.error); 