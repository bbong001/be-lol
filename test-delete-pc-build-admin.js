const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';
const BUILD_ID_TO_DELETE = '683bdaa0e12d858bb6c11d01';

async function testDeletePCBuild() {
  console.log('🚀 Testing Delete PC Build with Admin privileges...\n');

  try {
    // Step 1: Login Admin to get fresh token
    console.log('🔐 Step 1: Logging in admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@admin.com',
      password: 'Admin@123'
    });
    console.log('✅ Admin login successful');
    const accessToken = loginResponse.data.access_token || loginResponse.data.accessToken;
    console.log('Fresh Token:', accessToken.substring(0, 50) + '...');

    // Setup headers with auth token
    const authHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Try to get the specific build first
    console.log(`\n📋 Step 2: Getting PC Build info for ID: ${BUILD_ID_TO_DELETE}...`);
    try {
      const buildResponse = await axios.get(`${BASE_URL}/pc-build/builds/${BUILD_ID_TO_DELETE}`);
      console.log('✅ Build found:');
      console.log('- Build Name:', buildResponse.data.data.name);
      console.log('- Build Owner:', buildResponse.data.data.user);
      console.log('- Is Public:', buildResponse.data.data.isPublic);
      console.log('- Created At:', buildResponse.data.data.createdAt);
    } catch (error) {
      console.log('❌ Build not found or error:', error.response?.data?.message || error.message);
      console.log('Build might already be deleted. Let\'s check admin list...\n');
    }

    // Step 3: Get all builds from admin endpoint
    console.log('\n📊 Step 3: Getting all builds from admin endpoint...');
    const adminBuildsResponse = await axios.get(`${BASE_URL}/pc-build/admin?limit=50`, { headers: authHeaders });
    console.log('✅ Admin builds retrieved');
    console.log('Total builds:', adminBuildsResponse.data.data.total);
    
    const builds = adminBuildsResponse.data.data.builds;
    const targetBuild = builds.find(build => build._id === BUILD_ID_TO_DELETE);
    
    if (targetBuild) {
      console.log('🎯 Target build found in admin list:');
      console.log('- Build Name:', targetBuild.name);
      console.log('- Build Owner ID:', targetBuild.user);
      console.log('- Is Public:', targetBuild.isPublic);
    } else {
      console.log('⚠️ Target build not found in admin list. It might already be deleted.');
      console.log('Available builds:');
      builds.slice(0, 5).forEach(build => {
        console.log(`  - ${build._id}: ${build.name}`);
      });
      return;
    }

    // Step 4: Attempt to delete the build
    console.log(`\n🗑️ Step 4: Attempting to delete PC Build ${BUILD_ID_TO_DELETE}...`);
    const deleteResponse = await axios.delete(`${BASE_URL}/pc-build/builds/${BUILD_ID_TO_DELETE}`, { headers: authHeaders });
    console.log('✅ Build deleted successfully!');
    console.log('Response:', deleteResponse.data);

    // Step 5: Verify deletion
    console.log('\n✅ Step 5: Verifying deletion...');
    try {
      await axios.get(`${BASE_URL}/pc-build/builds/${BUILD_ID_TO_DELETE}`);
      console.log('❌ Build still exists - deletion failed');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Build successfully deleted - returns 404 as expected');
      } else {
        console.log('⚠️ Unexpected error:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 Delete Test Completed Successfully! 🎉');

  } catch (error) {
    console.error('\n❌ Delete test failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Full error:', error.response?.data);
  }
}

// Run the test
testDeletePCBuild(); 