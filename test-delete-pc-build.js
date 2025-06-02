const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';
const PC_BUILD_ID = '683bd610e12d858bb6c11cb9';

async function testDeletePcBuild() {
  console.log('🚀 Testing DELETE PC Build...\n');

  try {
    // Step 1: Login Admin để lấy token
    console.log('🔐 Step 1: Logging in admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@admin.com',
      password: 'Admin@123'
    });
    console.log('✅ Admin login successful');
    const accessToken = loginResponse.data.access_token || loginResponse.data.accessToken;
    console.log('Token:', accessToken.substring(0, 50) + '...');

    // Setup headers with auth token
    const authHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Kiểm tra PC build trước khi xóa
    console.log(`\n📋 Step 2: Checking PC build ${PC_BUILD_ID} before deletion...`);
    try {
      const checkResponse = await axios.get(`${BASE_URL}/pc-build/builds/${PC_BUILD_ID}`, { headers: authHeaders });
      console.log('✅ PC Build found:');
      console.log('- Name:', checkResponse.data.data.name);
      console.log('- Description:', checkResponse.data.data.description);
      console.log('- Author:', checkResponse.data.data.author?.name || 'Unknown');
      console.log('- Created:', new Date(checkResponse.data.data.createdAt).toLocaleString());
      console.log('- Public:', checkResponse.data.data.isPublic);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ PC Build not found - It may have already been deleted');
        return;
      } else {
        console.log('⚠️ Error checking PC build:', error.response?.data?.message || error.message);
      }
    }

    // Step 3: Xóa PC build
    console.log(`\n🗑️ Step 3: Deleting PC build ${PC_BUILD_ID}...`);
    const deleteResponse = await axios.delete(`${BASE_URL}/pc-build/builds/${PC_BUILD_ID}`, { headers: authHeaders });
    console.log('✅ PC Build deleted successfully!');
    console.log('Response:', deleteResponse.data);

    // Step 4: Xác nhận đã xóa
    console.log('\n🔍 Step 4: Verifying deletion...');
    try {
      await axios.get(`${BASE_URL}/pc-build/builds/${PC_BUILD_ID}`, { headers: authHeaders });
      console.log('❌ ERROR: PC Build still exists after deletion!');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Confirmed: PC Build has been successfully deleted');
      } else {
        console.log('⚠️ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    // Step 5: Kiểm tra danh sách admin để xem tổng số PC builds
    console.log('\n📊 Step 5: Checking admin PC builds list...');
    const adminListResponse = await axios.get(`${BASE_URL}/pc-build/admin?limit=5&page=1`, { headers: authHeaders });
    console.log('Current total PC builds:', adminListResponse.data.data.total);
    console.log('Recent PC builds:');
    adminListResponse.data.data.builds.forEach((build, index) => {
      console.log(`  ${index + 1}. ${build.name} (ID: ${build._id})`);
    });

    console.log('\n🎉 Delete PC Build Test Completed Successfully! 🎉');

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Note: PC Build might not exist or already been deleted');
    } else if (error.response?.status === 403) {
      console.log('\n💡 Note: Access denied - Admin permissions required');
    } else if (error.response?.status === 401) {
      console.log('\n💡 Note: Authentication failed - Check admin credentials');
    }
  }
}

// Run the test
testDeletePcBuild(); 