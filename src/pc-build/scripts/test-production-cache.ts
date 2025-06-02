import * as https from 'https';

async function testProductionCache() {
  console.log('🌐 Testing production cache headers...\n');

  const urls = [
    'https://api.loltips.net/api/pc-build/builds',
    'https://api.loltips.net/api/home'
  ];

  for (const url of urls) {
    console.log(`📡 Testing: ${url}`);
    
    try {
      const options = {
        method: 'GET',
        headers: {
          'User-Agent': 'Cache-Test/1.0'
        }
      };

      await new Promise<void>((resolve, reject) => {
        const req = https.request(url, options, (res) => {
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Cache-Control: ${res.headers['cache-control']}`);
          console.log(`   Pragma: ${res.headers['pragma']}`);
          console.log(`   Expires: ${res.headers['expires']}`);
          console.log(`   ETag: ${res.headers['etag']}`);
          console.log(`   Content-Length: ${res.headers['content-length']}`);
          console.log('');

          // Read response data
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            const jsonData = JSON.parse(data);
            console.log(`   📊 Response data:`);
            if (url.includes('pc-build')) {
              console.log(`      Total builds: ${jsonData.data?.total || 0}`);
              console.log(`      Builds returned: ${jsonData.data?.builds?.length || 0}`);
            } else if (url.includes('home')) {
              console.log(`      News: ${jsonData.data?.latestNews?.total || 0}`);
              console.log(`      PC Builds: ${jsonData.data?.latestPcBuilds?.total || 0}`);
            }
            console.log('   ----------------------------------------\n');
            resolve();
          });
        });

        req.on('error', (error) => {
          console.error(`   ❌ Error: ${error.message}\n`);
          reject(error);
        });

        req.end();
      });

    } catch (error: any) {
      console.error(`❌ Failed to test ${url}: ${error.message}\n`);
    }
  }

  console.log('🎉 Production cache test completed!');
}

testProductionCache().catch(console.error); 