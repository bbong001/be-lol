import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { PcBuildService } from '../pc-build.service';

async function checkCrawledPCBuilds() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const pcBuildService = app.get(PcBuildService);

  try {
    console.log('🔍 Checking crawled PC builds...');

    // Get latest PC builds
    const result = await pcBuildService.findAllBuilds(10, 1);

    console.log(`📄 Found ${result.builds.length} PC builds in database:`);
    console.log(`📊 Total PC builds: ${result.total}`);

    for (const build of result.builds) {
      console.log(`\n🖥️ PC Build: ${build.name}`);
      console.log(`📝 Description: ${build.description?.substring(0, 100)}...`);
      console.log(`🏷️ Tags: ${build.tags?.join(', ')}`);
      console.log(`🌐 Public: ${build.isPublic ? 'Yes' : 'No'}`);
      console.log(`📷 Image: ${build.imageUrl ? 'Yes' : 'No'}`);

      // Check content length and preview
      console.log(`📄 Content length: ${build.content.length} characters`);

      // Check for any remaining <a> tags
      const hasLinks = /<a[^>]*>.*?<\/a>/gi.test(build.content);

      if (hasLinks) {
        console.log('❌ Found remaining <a> tags!');
        const matches = build.content.match(/<a[^>]*>.*?<\/a>/gi);
        console.log('Links found:', matches?.slice(0, 2)); // Show first 2 matches
      } else {
        console.log('✅ No <a> tags found - Clean!');
      }

      const preview = build.content.replace(/<[^>]*>/g, '').substring(0, 150);
      console.log(`Preview: ${preview}...`);
    }

    console.log('\n✅ Check completed!');
  } catch (error) {
    console.error('❌ Error during check:', error);
  } finally {
    await app.close();
  }
}

checkCrawledPCBuilds().catch(console.error);
