import axios from 'axios';

async function demoCounterByName() {
  console.log('🎯 Demo: Counter by Champion Name\n');

  const baseURL = 'http://localhost:4000/api/counters';

  try {
    console.log('📋 Available endpoints:');
    console.log('1. GET /counters/name/:championName');
    console.log('2. Optional query parameters: role, patch, rank, region\n');

    // Demo 1: Get all counter data for a champion
    console.log('🔍 Demo 1: Get all counter data for Yasuo');
    console.log('Request: GET /counters/name/Yasuo');
    const response1 = await axios.get(`${baseURL}/name/Yasuo`);
    console.log('Response:', {
      totalResults: response1.data.length,
      roles: response1.data.map((c: any) => c.role),
      championName: response1.data[0]?.championName,
    });
    console.log('');

    // Demo 2: Filter by role
    console.log('🎯 Demo 2: Get Yasuo counter data for mid role only');
    console.log('Request: GET /counters/name/Yasuo?role=mid');
    const response2 = await axios.get(`${baseURL}/name/Yasuo`, {
      params: { role: 'mid' },
    });
    console.log('Response:', {
      totalResults: response2.data.length,
      role: response2.data[0]?.role,
      overallWinRate: response2.data[0]?.overallWinRate,
      strongAgainstCount: response2.data[0]?.strongAgainst?.length || 0,
      weakAgainstCount: response2.data[0]?.weakAgainst?.length || 0,
    });
    console.log('');

    // Demo 3: Case insensitive search
    console.log('🔤 Demo 3: Case insensitive search');
    console.log('Request: GET /counters/name/yasuo (lowercase)');
    const response3 = await axios.get(`${baseURL}/name/yasuo`);
    console.log('Response:', {
      found: response3.data.length > 0,
      championName: response3.data[0]?.championName,
    });
    console.log('');

    // Demo 4: Partial name search
    console.log('🔍 Demo 4: Partial name search');
    console.log('Request: GET /counters/name/Yas');
    const response4 = await axios.get(`${baseURL}/name/Yas`);
    console.log('Response:', {
      totalResults: response4.data.length,
      matchingChampions: [
        ...new Set(response4.data.map((c: any) => c.championName)),
      ],
    });
    console.log('');

    // Demo 5: Multiple filters
    console.log('⚙️ Demo 5: Multiple filters');
    console.log(
      'Request: GET /counters/name/Yasuo?role=mid&patch=15.10&rank=Emerald+',
    );
    const response5 = await axios.get(`${baseURL}/name/Yasuo`, {
      params: {
        role: 'mid',
        patch: '15.10',
        rank: 'Emerald+',
        region: 'World',
      },
    });
    console.log('Response:', {
      totalResults: response5.data.length,
      filters: {
        role: response5.data[0]?.role,
        patch: response5.data[0]?.patch,
        rank: response5.data[0]?.rank,
        region: response5.data[0]?.region,
      },
    });
    console.log('');

    // Demo 6: Non-existent champion
    console.log('❌ Demo 6: Non-existent champion');
    console.log('Request: GET /counters/name/NonExistentChampion');
    const response6 = await axios.get(`${baseURL}/name/NonExistentChampion`);
    console.log('Response:', {
      totalResults: response6.data.length,
      message: response6.data.length === 0 ? 'No data found' : 'Data found',
    });
    console.log('');

    console.log('✅ Demo completed successfully!');
    console.log('\n📝 Usage Summary:');
    console.log(
      '• Use /counters/name/:championName to get all counter data for a champion',
    );
    console.log('• Add ?role=mid to filter by specific role');
    console.log('• Search is case-insensitive and supports partial matching');
    console.log('• Returns array of counter objects (can be multiple roles)');
    console.log('• Empty array if no matches found');
  } catch (error: any) {
    console.error('❌ Demo failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

// Run the demo
demoCounterByName().catch(console.error);
