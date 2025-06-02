// Test CORS configuration
const https = require('https');
const http = require('http');

const testCors = (url, origin) => {
  const urlObj = new URL(url);
  const client = urlObj.protocol === 'https:' ? https : http;
  
  const options = {
    hostname: urlObj.hostname,
    port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
    path: urlObj.pathname,
    method: 'OPTIONS',
    headers: {
      'Origin': origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type, Authorization'
    }
  };

  const req = client.request(options, (res) => {
    console.log(`\n=== CORS Test for ${origin} ===`);
    console.log(`Status: ${res.statusCode}`);
    console.log('Response Headers:');
    Object.keys(res.headers).forEach(key => {
      if (key.toLowerCase().includes('access-control') || key.toLowerCase().includes('origin')) {
        console.log(`  ${key}: ${res.headers[key]}`);
      }
    });
    
    if (res.headers['access-control-allow-origin']) {
      console.log('✅ CORS configured correctly');
    } else {
      console.log('❌ CORS not configured');
    }
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.end();
};

// Test different origins
const apiUrl = 'https://api.loltips.net/api/auth/login';
const testOrigins = [
  'https://cms.loltips.net',
  'https://loltips.net',
  'http://localhost:3000',
  'http://localhost:8080'
];

console.log('Testing CORS configuration...');
testOrigins.forEach(origin => {
  setTimeout(() => testCors(apiUrl, origin), 1000);
}); 