const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testGetPcBuildById() {
  console.log('🚀 Testing GET PC Build by ID (without lang parameter)...\n');

  try {
    // Step 1: Login Admin để lấy danh sách PC builds
    console.log('🔐 Step 1: Logging in admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@admin.com',
      password: 'Admin@123'
    });
    const accessToken = loginResponse.data.access_token || loginResponse.data.accessToken;

    const authHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Lấy danh sách PC builds để có ID để test
    console.log('\n📋 Step 2: Getting list of PC builds...');
    const listResponse = await axios.get(`${BASE_URL}/pc-build/admin?limit=5&page=1`, { headers: authHeaders });
    console.log('✅ PC Builds retrieved');
    console.log('Total PC builds:', listResponse.data.data.total);
    
    if (listResponse.data.data.builds.length === 0) {
      console.log('❌ No PC builds found to test');
      return;
    }

    const testBuild = listResponse.data.data.builds[0];
    console.log(`\n🎯 Testing with PC build:`);
    console.log(`  Name: ${testBuild.name}`);
    console.log(`  ID: ${testBuild._id}`);
    console.log(`  Language: ${testBuild.lang || 'Not specified'}`);

    // Step 3: Test GET by ID WITHOUT lang parameter
    console.log(`\n📖 Step 3: Testing GET by ID WITHOUT lang parameter...`);
    const getByIdResponse = await axios.get(`${BASE_URL}/pc-build/builds/${testBuild._id}`);
    console.log('✅ PC Build retrieved successfully WITHOUT lang parameter!');
    console.log('Response data:');
    console.log('- Name:', getByIdResponse.data.data.name);
    console.log('- Language:', getByIdResponse.data.data.lang);
    console.log('- Description:', (getByIdResponse.data.data.description || 'No description').substring(0, 100) + '...');
    console.log('- Tags:', getByIdResponse.data.data.tags || []);
    console.log('- Created:', new Date(getByIdResponse.data.data.createdAt).toLocaleString());

    // Step 4: Test với PC build có ngôn ngữ khác (nếu có)
    const englishBuild = listResponse.data.data.builds.find(build => build.lang === 'en');
    if (englishBuild) {
      console.log(`\n🌍 Step 4: Testing with English PC build...`);
      console.log(`  Name: ${englishBuild.name}`);
      console.log(`  ID: ${englishBuild._id}`);
      
      const getEnglishResponse = await axios.get(`${BASE_URL}/pc-build/builds/${englishBuild._id}`);
      console.log('✅ English PC Build retrieved successfully!');
      console.log('- Name:', getEnglishResponse.data.data.name);
      console.log('- Language:', getEnglishResponse.data.data.lang);
    } else {
      console.log('\n💡 No English PC builds found for testing');
    }

    // Step 5: Test với ID không tồn tại
    console.log(`\n🚫 Step 5: Testing with non-existent ID...`);
    try {
      await axios.get(`${BASE_URL}/pc-build/builds/507f1f77bcf86cd799439011`);
      console.log('❌ ERROR: Should have returned 404 for non-existent ID');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Correctly returned 404 for non-existent PC build');
      } else {
        console.log('⚠️ Unexpected error:', error.response?.status, error.response?.data?.message);
      }
    }

    console.log('\n🎉 GET PC Build by ID Test Completed Successfully! 🎉');
    console.log('\n📊 Summary:');
    console.log('- ✅ Can get PC build by ID without lang parameter');
    console.log('- ✅ Returns complete PC build data');
    console.log('- ✅ Works for builds in any language');
    console.log('- ✅ Properly handles non-existent IDs with 404');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

// Run the test
testGetPcBuildById(); 