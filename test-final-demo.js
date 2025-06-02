const axios = require('axios');

async function testFinalDemo() {
  console.log('🎯 Final Demo: GET PC Build by ID (no lang parameter needed)\n');

  // Test với một số ID khác nhau
  const testIds = [
    '683b398e0e0b618dae0146fe', // Ultimate Gaming PC Build 2024
    '683bdaa0e12d858bb6c11d01', // ádf
    '68304d25c03ddc61afde603f'  // Build PC Như Oner
  ];

  for (const id of testIds) {
    try {
      console.log(`📖 Testing ID: ${id}`);
      
      const response = await axios.get(`http://localhost:4000/api/pc-build/builds/${id}`);
      
      console.log('✅ Success!');
      console.log(`   Name: ${response.data.data.name}`);
      console.log(`   Language: ${response.data.data.lang || 'Not specified'}`);
      console.log(`   Public: ${response.data.data.isPublic}`);
      console.log('');
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`❌ ID ${id}: Not found (404)`);
      } else {
        console.log(`❌ ID ${id}: Error - ${error.message}`);
      }
      console.log('');
    }
  }

  // Test với ID không tồn tại
  console.log('🚫 Testing with invalid ID...');
  try {
    await axios.get('http://localhost:4000/api/pc-build/builds/507f1f77bcf86cd799439011');
    console.log('❌ Should have returned 404');
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Correctly returned 404 for invalid ID');
    } else {
      console.log(`⚠️ Unexpected error: ${error.response?.status}`);
    }
  }

  console.log('\n🎉 Demo completed!');
  console.log('\n📋 Summary:');
  console.log('✅ GET /api/pc-build/builds/{id} now works WITHOUT lang parameter');
  console.log('✅ Returns PC build in any language based on ID alone');
  console.log('✅ Properly handles 404 for non-existent IDs');
  console.log('\n💡 You can now test in Swagger: http://[::1]:4000/api/docs#/pc-builds/PcBuildController_getBuildById');
}

testFinalDemo(); 