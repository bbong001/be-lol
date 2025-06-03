import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { HomeService } from '../home.service';

async function testHomeI18nFunctionality() {
  console.log('🧪 Testing Home API Multi-language Functionality...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const homeService = app.get(HomeService);

  try {
    console.log('=== 1. TESTING VIETNAMESE DATA ===');
    console.log('📝 Getting Vietnamese home data...');
    const viData = await homeService.getHomePageData('vi');
    console.log(`✅ Vietnamese data loaded successfully`);
    console.log(`📰 Latest news: ${viData.data.latestNews.articles?.length || 0} articles`);
    console.log(`🔧 PC builds: ${viData.data.latestPcBuilds.builds?.length || 0} builds`);
    console.log(`⚔️ LoL champions: ${viData.data.randomChampions?.length || 0} champions`);
    console.log(`🎲 TFT champions: ${viData.data.randomTftChampions?.length || 0} champions`);
    console.log(`📱 WR champions: ${viData.data.randomWrChampions?.length || 0} champions`);
    
    if (viData.data.latestNews.articles?.length > 0) {
      console.log(`📋 Sample Vietnamese news: "${viData.data.latestNews.articles[0].title}"`);
    }

    console.log('\n=== 2. TESTING ENGLISH DATA ===');
    console.log('📝 Getting English home data...');
    const enData = await homeService.getHomePageData('en');
    console.log(`✅ English data loaded successfully`);
    console.log(`📰 Latest news: ${enData.data.latestNews.articles?.length || 0} articles`);
    console.log(`🔧 PC builds: ${enData.data.latestPcBuilds.builds?.length || 0} builds`);
    console.log(`⚔️ LoL champions: ${enData.data.randomChampions?.length || 0} champions`);
    console.log(`🎲 TFT champions: ${enData.data.randomTftChampions?.length || 0} champions`);
    console.log(`📱 WR champions: ${enData.data.randomWrChampions?.length || 0} champions`);
    
    if (enData.data.latestNews.articles?.length > 0) {
      console.log(`📋 Sample English news: "${enData.data.latestNews.articles[0].title}"`);
    }

    console.log('\n=== 3. TESTING DEFAULT BEHAVIOR ===');
    console.log('📝 Getting default data (should be Vietnamese)...');
    const defaultData = await homeService.getHomePageData();
    console.log(`✅ Default data loaded successfully`);
    console.log(`📰 Latest news: ${defaultData.data.latestNews.articles?.length || 0} articles`);
    
    console.log('\n=== 4. TESTING CHAMPION DATA STRUCTURE ===');
    if (viData.data.randomChampions?.length > 0) {
      const sampleChampion = viData.data.randomChampions[0];
      console.log('🔍 Sample LoL champion structure:');
      console.log(`- Name: ${sampleChampion.name || 'N/A'}`);
      console.log(`- ID: ${sampleChampion.id || 'N/A'}`);
      console.log(`- Image: ${sampleChampion.image ? '✅' : '❌'}`);
    }

    if (viData.data.randomTftChampions?.length > 0) {
      const sampleTftChampion = viData.data.randomTftChampions[0];
      console.log('🔍 Sample TFT champion structure:');
      console.log(`- Name: ${sampleTftChampion.name || 'N/A'}`);
      console.log(`- Cost: ${sampleTftChampion.cost || 'N/A'}`);
      console.log(`- Image: ${sampleTftChampion.imageUrl ? '✅' : '❌'}`);
    }

    if (viData.data.randomWrChampions?.length > 0) {
      const sampleWrChampion = viData.data.randomWrChampions[0];
      console.log('🔍 Sample Wild Rift champion structure:');
      console.log(`- Name: ${sampleWrChampion.name || 'N/A'}`);
      console.log(`- Title: ${sampleWrChampion.title || 'N/A'}`);
      console.log(`- Image: ${sampleWrChampion.imageUrl ? '✅' : '❌'}`);
    }

    console.log('\n✅ Home API multi-language functionality test completed successfully!');
    console.log('\n📖 How to use:');
    console.log('- GET /home?lang=vi (Vietnamese content)');
    console.log('- GET /home?lang=en (English content)');
    console.log('- GET /home (Default: Vietnamese content)');
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  } finally {
    await app.close();
  }
}

// Run the test
testHomeI18nFunctionality(); 