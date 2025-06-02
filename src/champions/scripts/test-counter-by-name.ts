import axios from 'axios';

async function testCounterByName() {
  console.log('🧪 Testing Counter by Champion Name...\n');

  const baseURL = 'http://localhost:4000/api/counters';

  try {
    // Test 1: Get counter by champion name only
    console.log('✅ Test 1: Get counter by champion name only');
    const response1 = await axios.get(`${baseURL}/name/Yasuo`);
    console.log('✅ Success:', {
      status: response1.status,
      dataLength: response1.data.length,
      firstChampion: response1.data[0]?.championName,
      roles: response1.data.map((c: any) => c.role),
    });

    // Test 2: Get counter with role filter
    console.log('\n✅ Test 2: Get counter with role filter');
    const response2 = await axios.get(`${baseURL}/name/Yasuo`, {
      params: {
        role: 'mid',
        patch: '15.10',
        rank: 'Emerald+',
        region: 'World',
      },
    });
    console.log('✅ Success with filters:', {
      status: response2.status,
      dataLength: response2.data.length,
      role: response2.data[0]?.role,
      patch: response2.data[0]?.patch,
      rank: response2.data[0]?.rank,
    });

    // Test 3: Case insensitive search
    console.log('\n✅ Test 3: Case insensitive search');
    const response3 = await axios.get(`${baseURL}/name/yasuo`);
    console.log('✅ Case insensitive success:', {
      status: response3.status,
      dataLength: response3.data.length,
      championName: response3.data[0]?.championName,
    });

    // Test 4: Partial name search
    console.log('\n✅ Test 4: Partial name search');
    const response4 = await axios.get(`${baseURL}/name/Yas`);
    console.log('✅ Partial search success:', {
      status: response4.status,
      dataLength: response4.data.length,
      champions: response4.data.map((c: any) => c.championName),
    });

    // Test 5: Search for non-existent champion
    console.log('\n❌ Test 5: Search for non-existent champion');
    const response5 = await axios.get(`${baseURL}/name/NonExistentChampion`);
    console.log('✅ Non-existent champion:', {
      status: response5.status,
      dataLength: response5.data.length,
      message: response5.data.length === 0 ? 'No data found' : 'Data found',
    });

    // Test 6: Filter by different roles
    console.log('\n✅ Test 6: Filter by different roles');
    const roles = ['top', 'jungle', 'mid', 'adc', 'support'];
    for (const role of roles) {
      try {
        const response = await axios.get(`${baseURL}/name/Yasuo`, {
          params: { role },
        });
        console.log(`✅ ${role}: ${response.data.length} results`);
      } catch {
        console.log(`❌ ${role}: No data or error`);
      }
    }

    // Test 7: Get all roles for a champion
    console.log('\n✅ Test 7: Get all roles for a champion');
    const response7 = await axios.get(`${baseURL}/name/Yasuo`);
    const allRoles = response7.data.map((c: any) => c.role);
    console.log('✅ All roles for Yasuo:', {
      status: response7.status,
      totalResults: response7.data.length,
      roles: [...new Set(allRoles)], // unique roles
    });

    console.log('\n🎉 All counter by name tests completed!');
  } catch (error: any) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

// Run the test
testCounterByName().catch(console.error);
