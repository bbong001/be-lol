import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

async function testCacheHeaders() {
  console.log('🔍 Testing cache headers...\n');

  const app: INestApplication = await NestFactory.create(AppModule);
  await app.init();

  try {
    // Test PC Builds endpoint
    console.log('📋 Testing /api/pc-build/builds headers...');
    const buildsResponse = await request(app.getHttpServer())
      .get('/pc-build/builds')
      .expect(200);

    console.log('📡 Response headers:');
    console.log(`Cache-Control: ${buildsResponse.headers['cache-control']}`);
    console.log(`Pragma: ${buildsResponse.headers['pragma']}`);
    console.log(`Expires: ${buildsResponse.headers['expires']}`);
    console.log(`ETag: ${buildsResponse.headers['etag']}`);
    console.log(`Last-Modified: ${buildsResponse.headers['last-modified']}`);

    // Test Home endpoint  
    console.log('\n🏠 Testing /api/home headers...');
    const homeResponse = await request(app.getHttpServer())
      .get('/home')
      .expect(200);

    console.log('📡 Response headers:');
    console.log(`Cache-Control: ${homeResponse.headers['cache-control']}`);
    console.log(`Pragma: ${homeResponse.headers['pragma']}`);
    console.log(`Expires: ${homeResponse.headers['expires']}`);
    console.log(`ETag: ${homeResponse.headers['etag']}`);
    console.log(`Last-Modified: ${homeResponse.headers['last-modified']}`);

    // Check if no-cache headers are present
    console.log('\n✅ Cache prevention status:');
    const buildsCacheControl = buildsResponse.headers['cache-control'];
    const homeCacheControl = homeResponse.headers['cache-control'];

    if (buildsCacheControl && buildsCacheControl.includes('no-cache')) {
      console.log('✅ PC Builds: No-cache headers present');
    } else {
      console.log('❌ PC Builds: Missing no-cache headers');
    }

    if (homeCacheControl && homeCacheControl.includes('no-cache')) {
      console.log('✅ Home: No-cache headers present');
    } else {
      console.log('❌ Home: Missing no-cache headers');
    }

    console.log('\n📊 Response data length:');
    console.log(`PC Builds: ${JSON.stringify(buildsResponse.body).length} chars`);
    console.log(`Home: ${JSON.stringify(homeResponse.body).length} chars`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await app.close();
  }
}

testCacheHeaders().catch(console.error); 