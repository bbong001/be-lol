const axios = require('axios');

async function testSimpleGet() {
  console.log('🚀 Testing GET PC Build by ID...\n');

  try {
    // Test với ID có trong danh sách
    const pcBuildId = '683b398e0e0b618dae0146fe';
    
    console.log(`📖 Testing GET /api/pc-build/builds/${pcBuildId}`);
    
    const response = await axios.get(`http://localhost:4000/api/pc-build/builds/${pcBuildId}`);
    
    console.log('✅ Success! Response:');
    console.log('Status:', response.status);
    console.log('Response structure:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Network error or no response');
    }
  }
}

testSimpleGet(); 