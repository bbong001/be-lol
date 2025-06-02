const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testListAndDeletePcBuild() {
  console.log('🚀 Testing List & Delete PC Build...\n');

  try {
    // Step 1: Login Admin
    console.log('🔐 Step 1: Logging in admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@admin.com',
      password: 'Admin@123'
    });
    console.log('✅ Admin login successful');
    const accessToken = loginResponse.data.access_token || loginResponse.data.accessToken;

    const authHeaders = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Lấy danh sách PC builds
    console.log('\n📋 Step 2: Getting list of PC builds...');
    const listResponse = await axios.get(`${BASE_URL}/pc-build/admin?limit=10&page=1`, { headers: authHeaders });
    console.log('✅ PC Builds retrieved');
    console.log('Total PC builds:', listResponse.data.data.total);
    
    if (listResponse.data.data.builds.length === 0) {
      console.log('❌ No PC builds found to delete');
      return;
    }

    console.log('\n📝 Available PC builds:');
    listResponse.data.data.builds.forEach((build, index) => {
      console.log(`  ${index + 1}. ${build.name}`);
      console.log(`     ID: ${build._id}`);
      console.log(`     Author: ${build.author?.name || 'Unknown'}`);
      console.log(`     Created: ${new Date(build.createdAt).toLocaleString()}`);
      console.log(`     Public: ${build.isPublic}`);
      console.log('');
    });

    // Step 3: Chọn PC build đầu tiên để xóa (có thể là test build)
    const targetBuild = listResponse.data.data.builds.find(build => 
      build.name.includes('Admin Test') || build.name.includes('Test') || build.tags?.includes('admin-test')
    ) || listResponse.data.data.builds[0];

    if (!targetBuild) {
      console.log('❌ No suitable PC build found for deletion');
      return;
    }

    console.log(`🎯 Selected PC build for deletion:`);
    console.log(`  Name: ${targetBuild.name}`);
    console.log(`  ID: ${targetBuild._id}`);
    console.log(`  Description: ${targetBuild.description || 'No description'}`);

    // Step 4: Xóa PC build
    console.log(`\n🗑️ Step 4: Deleting PC build ${targetBuild._id}...`);
    const deleteResponse = await axios.delete(`${BASE_URL}/pc-build/builds/${targetBuild._id}`, { headers: authHeaders });
    console.log('✅ PC Build deleted successfully!');
    console.log('Delete response:', deleteResponse.data);

    // Step 5: Xác nhận đã xóa
    console.log('\n🔍 Step 5: Verifying deletion...');
    try {
      await axios.get(`${BASE_URL}/pc-build/builds/${targetBuild._id}`, { headers: authHeaders });
      console.log('❌ ERROR: PC Build still exists after deletion!');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Confirmed: PC Build has been successfully deleted');
      } else {
        console.log('⚠️ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    // Step 6: Kiểm tra danh sách sau khi xóa
    console.log('\n📊 Step 6: Checking updated PC builds list...');
    const updatedListResponse = await axios.get(`${BASE_URL}/pc-build/admin?limit=5&page=1`, { headers: authHeaders });
    console.log('Updated total PC builds:', updatedListResponse.data.data.total);

    console.log('\n🎉 Delete PC Build Test Completed Successfully! 🎉');
    console.log(`✅ Successfully deleted PC build: "${targetBuild.name}"`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

// Run the test
testListAndDeletePcBuild(); 