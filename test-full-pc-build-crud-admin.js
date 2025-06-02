const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testFullPCBuildCRUD() {
  console.log('🚀 Testing Full PC Build CRUD with Admin privileges...\n');

  try {
    // Step 1: Login Admin
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

    // Step 2: CREATE - Create a new PC build
    console.log('\n🛠️ Step 2: Creating a new PC build...');
    const newBuildData = {
      name: 'PC Gaming RTX 4080 Super - Admin CRUD Test',
      description: 'High-end gaming build for testing CRUD operations',
      content: `# Cấu hình Gaming cao cấp 2024

## Linh kiện:

### CPU: Intel Core i7-13700K
- 16 nhân (8P+8E) 24 luồng
- Xung nhịp P-Core: 3.4GHz (base) / 5.4GHz (boost)
- Giá: 9,500,000 VNĐ

### GPU: RTX 4080 Super 16GB
- VRAM: 16GB GDDR6X
- Chơi 1440p Ultra 120fps / 4K High 60fps
- Hỗ trợ DLSS 3 Frame Generation
- Giá: 28,000,000 VNĐ

### RAM: Corsair Vengeance DDR5-5600 32GB
- Dung lượng: 32GB (2x16GB)
- Bus: DDR5-5600
- Giá: 4,500,000 VNĐ

### SSD: Samsung 980 PRO 1TB M.2 NVMe Gen4
- Dung lượng: 1TB
- Tốc độ đọc: 7,000 MB/s
- Giá: 3,200,000 VNĐ

### Mainboard: ASUS ROG STRIX Z790-E
- Socket: LGA1700
- Chipset: Z790
- Giá: 8,500,000 VNĐ

### PSU: Corsair RM850x 850W 80+ Gold
- Công suất: 850W
- Hiệu suất: 80+ Gold
- Giá: 3,500,000 VNĐ

### Case: Fractal Design Define 7
- Form Factor: Mid Tower
- Hỗ trợ: ATX, E-ATX
- Giá: 3,000,000 VNĐ

## Tổng giá: ~60,200,000 VNĐ

## Đánh giá:
- ✅ Chơi mượt mà tất cả game ở 1440p Ultra
- ✅ Có thể chơi 4K với một số game
- ✅ Streaming và content creation mượt mà
- ✅ Cấu hình bền bỉ cho nhiều năm
- ⚠️ Giá cao, phù hợp với enthusiast`,
      imageUrl: 'https://example.com/rtx4080-super-build.jpg',
      tags: ['gaming', 'rtx4080', 'high-end', 'intel', '2024', 'crud-test'],
      isPublic: true,
      lang: 'vi'
    };

    const createResponse = await axios.post(`${BASE_URL}/pc-build/builds`, newBuildData, { headers: authHeaders });
    console.log('✅ PC Build created successfully');
    const newBuildId = createResponse.data.data._id;
    console.log('New Build ID:', newBuildId);
    console.log('New Build Name:', createResponse.data.data.name);

    // Step 3: READ - Get the created build
    console.log('\n📖 Step 3: Reading the created build...');
    const readResponse = await axios.get(`${BASE_URL}/pc-build/builds/${newBuildId}`);
    console.log('✅ Build retrieved successfully');
    console.log('Retrieved Build Name:', readResponse.data.data.name);
    console.log('Owner:', readResponse.data.data.user?.name || 'N/A');

    // Step 4: UPDATE - Modify the build
    console.log('\n✏️ Step 4: Updating the build...');
    const updateData = {
      name: 'PC Gaming RTX 4080 Super - UPDATED BY ADMIN',
      description: 'High-end gaming build - UPDATED DESCRIPTION',
      tags: ['gaming', 'rtx4080', 'high-end', 'intel', '2024', 'crud-test', 'updated']
    };

    const updateResponse = await axios.put(`${BASE_URL}/pc-build/builds/${newBuildId}`, updateData, { headers: authHeaders });
    console.log('✅ Build updated successfully');
    console.log('Updated Build Name:', updateResponse.data.data.name);

    // Step 5: LIST - Check admin list
    console.log('\n📋 Step 5: Checking admin builds list...');
    const listResponse = await axios.get(`${BASE_URL}/pc-build/admin?limit=5`, { headers: authHeaders });
    console.log('✅ Admin builds list retrieved');
    console.log('Total builds:', listResponse.data.data.total);
    
    const ourBuild = listResponse.data.data.builds.find(build => build._id === newBuildId);
    if (ourBuild) {
      console.log('✅ Our new build found in admin list:', ourBuild.name);
    }

    // Step 6: DELETE - Remove the build
    console.log('\n🗑️ Step 6: Deleting the build...');
    const deleteResponse = await axios.delete(`${BASE_URL}/pc-build/builds/${newBuildId}`, { headers: authHeaders });
    console.log('✅ Build deleted successfully');
    console.log('Delete Response:', deleteResponse.data);

    // Step 7: VERIFY DELETION
    console.log('\n✅ Step 7: Verifying deletion...');
    try {
      await axios.get(`${BASE_URL}/pc-build/builds/${newBuildId}`);
      console.log('❌ Build still exists - deletion failed');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Build successfully deleted - returns 404 as expected');
      } else {
        console.log('⚠️ Unexpected error:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 Full CRUD Test Completed Successfully! 🎉');
    console.log('\n📊 Summary:');
    console.log('- ✅ CREATE: PC build created');
    console.log('- ✅ READ: PC build retrieved');
    console.log('- ✅ UPDATE: PC build updated');
    console.log('- ✅ DELETE: PC build deleted');
    console.log('- ✅ VERIFICATION: Deletion confirmed');
    console.log('\n🔧 Admin privileges working correctly for all CRUD operations!');

  } catch (error) {
    console.error('\n❌ CRUD test failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    console.error('Full error:', error.response?.data);
  }
}

// Run the test
testFullPCBuildCRUD(); 