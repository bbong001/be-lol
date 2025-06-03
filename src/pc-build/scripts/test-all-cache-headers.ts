import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

async function testAllCacheHeaders() {
  console.log('🔍 Testing all endpoints cache headers...\n');

  const app: INestApplication = await NestFactory.create(AppModule);
  await app.init();

  const endpoints = [
    // Home
    { path: '/home', name: 'Home Page' },
    
    // PC Builds
    { path: '/pc-build/builds', name: 'PC Builds List' },
    { path: '/pc-build/builds/68304d24c03ddc61afde601f', name: 'PC Build Detail' },
    
    // News
    { path: '/news', name: 'News List' },
    { path: '/news/tag/league-of-legends', name: 'News by Tag' },
    
    // TFT
    { path: '/tft/champions', name: 'TFT Champions' },
    { path: '/tft/items', name: 'TFT Items' },
    { path: '/tft/comps', name: 'TFT Compositions' },
    
    // Wildrift
    { path: '/wildrift/champions', name: 'Wildrift Champions' },
    
    // Stats
    { path: '/stats/champions', name: 'Champion Stats' },
    
    // Champions (might need auth)
    { path: '/champions', name: 'Champions List' },
  ];

  let passCount = 0;
  let failCount = 0;

  for (const endpoint of endpoints) {
    try {
      console.log(`📋 Testing ${endpoint.name}: ${endpoint.path}`);
      
      const response = await request(app.getHttpServer())
        .get(endpoint.path)
        .expect((res) => {
          // Accept both 200 and 401 (for protected endpoints)
          if (res.status !== 200 && res.status !== 401) {
            throw new Error(`Expected 200 or 401, got ${res.status}`);
          }
        });

      const cacheControl = response.headers['cache-control'];
      const pragma = response.headers['pragma'];
      const expires = response.headers['expires'];

      console.log(`   Cache-Control: ${cacheControl}`);
      console.log(`   Pragma: ${pragma}`);
      console.log(`   Expires: ${expires}`);

      if (cacheControl && cacheControl.includes('no-cache')) {
        console.log('   ✅ Cache headers present\n');
        passCount++;
      } else {
        console.log('   ❌ Missing cache headers\n');
        failCount++;
      }

    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
      failCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`🎯 Total: ${endpoints.length}`);

  if (failCount === 0) {
    console.log('\n🎉 All endpoints have proper cache headers!');
  } else {
    console.log('\n⚠️ Some endpoints need cache headers!');
  }

  await app.close();
}

testAllCacheHeaders().catch(console.error); 