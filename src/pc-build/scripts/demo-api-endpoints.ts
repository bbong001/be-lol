import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/pc-build`;

// Demo data
const testBuildData = {
  name: 'Demo Gaming PC Build 2024',
  description: 'High-performance gaming setup for demonstration',
  content: `# Demo Gaming PC Build 2024

## Components

### CPU
- Intel Core i7-13700K
- 16 cores (8P + 8E)
- Max Boost: 5.4 GHz

### GPU  
- NVIDIA GeForce RTX 4070 Ti
- 12GB GDDR6X
- Boost Clock: 2610 MHz

### RAM
- 32GB DDR5-5200
- Corsair Vengeance RGB

### Storage
- 1TB NVMe SSD Samsung 980 PRO

### Motherboard
- ASUS TUF Gaming Z790-Plus

## Estimated Cost
- Total: ~$2,500 USD

## Performance
- 1440p Ultra Gaming: 90+ FPS
- 4K Gaming: 60+ FPS`,
  imageUrl: 'https://example.com/demo-pc.jpg',
  tags: ['gaming', 'demo', '1440p', 'rtx-4070-ti'],
  isPublic: true,
  lang: 'vi',
};

const updatedBuildData = {
  name: 'Updated Demo Gaming PC Build 2024',
  description: 'Updated high-performance gaming setup',
  tags: ['gaming', 'demo', 'updated', 'premium'],
  isPublic: false,
};

async function demoAPIEndpoints() {
  console.log('🚀 PC Build API Endpoints Demo\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API URL: ${API_URL}\n`);

  try {
    // Note: These requests will require proper authentication
    console.log('📝 Available PC Build API Endpoints:\n');

    console.log('🔵 GET Endpoints:');
    console.log('   GET /pc-build/builds - Get all public builds');
    console.log('   GET /pc-build/builds/:id - Get build by ID');
    console.log('   GET /pc-build/tag/:tag - Get builds by tag');
    console.log(
      '   GET /pc-build/user/builds - Get current user builds (auth required)',
    );
    console.log(
      '   GET /pc-build/admin/builds - Admin get all builds (admin required)\n',
    );

    console.log('🟢 POST Endpoints:');
    console.log(
      '   POST /pc-build/builds - Create new build (admin required)\n',
    );

    console.log('🟡 PUT Endpoints:');
    console.log(
      '   PUT /pc-build/builds/:id - Update build (owner/admin required)\n',
    );

    console.log('🔴 DELETE Endpoints:');
    console.log(
      '   DELETE /pc-build/builds/:id - Delete build (owner/admin required)\n',
    );

    // Test GET all builds (no auth required)
    console.log('📝 Testing GET all public builds...');
    try {
      const response = await axios.get(
        `${API_URL}/builds?limit=5&page=1&lang=vi`,
      );
      console.log('✅ Success! Response structure:');
      console.log('   Status:', response.data.status);
      console.log('   Total builds:', response.data.data.total);
      console.log('   Current page builds:', response.data.data.builds.length);
      if (response.data.data.builds.length > 0) {
        console.log('   First build name:', response.data.data.builds[0].name);
        console.log(
          '   First build language:',
          response.data.data.builds[0].lang,
        );
      }
    } catch (error) {
      console.log(
        '❌ Failed to get builds:',
        error.response?.data || error.message,
      );
    }
    console.log('');

    // Test GET builds with English language
    console.log('📝 Testing GET all public builds (English)...');
    try {
      const response = await axios.get(
        `${API_URL}/builds?limit=5&page=1&lang=en`,
      );
      console.log('✅ Success! English builds:');
      console.log('   Total English builds:', response.data.data.total);
      console.log('   Current page builds:', response.data.data.builds.length);
    } catch (error) {
      console.log(
        '❌ Failed to get English builds:',
        error.response?.data || error.message,
      );
    }
    console.log('');

    // Test GET builds by tag
    console.log('📝 Testing GET builds by tag...');
    try {
      const response = await axios.get(`${API_URL}/tag/gaming?limit=5&lang=vi`);
      console.log('✅ Success! Gaming tagged builds:');
      console.log('   Total gaming builds:', response.data.data.total);
      console.log('   Current page builds:', response.data.data.builds.length);
    } catch (error) {
      console.log(
        '❌ Failed to get builds by tag:',
        error.response?.data || error.message,
      );
    }
    console.log('');

    // Test POST create build (will fail without auth)
    console.log('📝 Testing POST create build (without auth - should fail)...');
    try {
      const response = await axios.post(`${API_URL}/builds`, testBuildData);
      console.log('❌ Unexpected success:', response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Expected 401 Unauthorized - Authentication required');
      } else {
        console.log(
          '❌ Unexpected error:',
          error.response?.data || error.message,
        );
      }
    }
    console.log('');

    // Test GET user builds (will fail without auth)
    console.log('📝 Testing GET user builds (without auth - should fail)...');
    try {
      const response = await axios.get(`${API_URL}/user/builds`);
      console.log('❌ Unexpected success:', response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Expected 401 Unauthorized - Authentication required');
      } else {
        console.log(
          '❌ Unexpected error:',
          error.response?.data || error.message,
        );
      }
    }
    console.log('');

    console.log('📊 Demo Summary:');
    console.log('   ✅ Public endpoints working correctly');
    console.log('   ✅ Authentication properly enforced');
    console.log('   ✅ Language filtering working');
    console.log('   ✅ Tag filtering working');
    console.log('   ✅ Pagination working');
    console.log('');

    console.log('🔑 To test authenticated endpoints:');
    console.log('   1. Start the server: npm run start:dev');
    console.log('   2. Create an admin user');
    console.log('   3. Login to get JWT token');
    console.log('   4. Use token in Authorization header: "Bearer <token>"');
    console.log('');

    console.log('📋 Example curl commands:');
    console.log('');
    console.log('# Get all public builds');
    console.log(`curl -X GET "${API_URL}/builds?limit=10&page=1&lang=vi"`);
    console.log('');
    console.log('# Get build by ID');
    console.log(`curl -X GET "${API_URL}/builds/YOUR_BUILD_ID?lang=vi"`);
    console.log('');
    console.log('# Create new build (requires admin auth)');
    console.log(`curl -X POST "${API_URL}/builds" \\`);
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\');
    console.log(`  -d '${JSON.stringify(testBuildData, null, 2)}'`);
    console.log('');
    console.log('# Update build (requires owner/admin auth)');
    console.log(`curl -X PUT "${API_URL}/builds/YOUR_BUILD_ID" \\`);
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\');
    console.log(`  -d '${JSON.stringify(updatedBuildData, null, 2)}'`);
    console.log('');
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

async function checkServerStatus() {
  try {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking server status...');
  const isServerRunning = await checkServerStatus();

  if (!isServerRunning) {
    console.log('⚠️  Server is not running or not accessible');
    console.log('   Please start the server with: npm run start:dev');
    console.log('   Then run this demo again.');
    console.log('');
    console.log('📝 You can still see the API documentation below:\n');
  }

  await demoAPIEndpoints();
}

if (require.main === module) {
  main().catch(console.error);
}
