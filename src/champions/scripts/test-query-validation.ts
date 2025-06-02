import axios from 'axios';

async function testQueryValidation() {
  console.log('🧪 Testing Query Validation...\n');

  const baseURL = 'http://localhost:4000/api/counters';

  try {
    // Test 1: Valid query parameters
    console.log('✅ Test 1: Valid query parameters');
    const validResponse = await axios.get(baseURL, {
      params: {
        patch: '15.10',
        rank: 'Emerald+',
        region: 'World',
        limit: 20,
        skip: 0,
      },
    });
    console.log('✅ Valid query success:', {
      status: validResponse.status,
      total: validResponse.data.total,
      limit: validResponse.data.limit,
      page: validResponse.data.page,
    });

    // Test 2: String numbers (should be transformed)
    console.log('\n✅ Test 2: String numbers (should be transformed)');
    const stringResponse = await axios.get(baseURL, {
      params: {
        limit: '10',
        skip: '5',
      },
    });
    console.log('✅ String numbers success:', {
      status: stringResponse.status,
      limit: stringResponse.data.limit,
      page: stringResponse.data.page,
    });

    // Test 3: Invalid limit (too high)
    console.log('\n❌ Test 3: Invalid limit (too high)');
    try {
      await axios.get(baseURL, {
        params: { limit: 150 },
      });
      console.log('❌ Should have failed');
    } catch (error: any) {
      console.log(
        '✅ Validation works:',
        error.response?.status,
        error.response?.data?.message,
      );
    }

    // Test 4: Invalid limit (too low)
    console.log('\n❌ Test 4: Invalid limit (too low)');
    try {
      await axios.get(baseURL, {
        params: { limit: 0 },
      });
      console.log('❌ Should have failed');
    } catch (error: any) {
      console.log(
        '✅ Validation works:',
        error.response?.status,
        error.response?.data?.message,
      );
    }

    // Test 5: Invalid skip (negative)
    console.log('\n❌ Test 5: Invalid skip (negative)');
    try {
      await axios.get(baseURL, {
        params: { skip: -1 },
      });
      console.log('❌ Should have failed');
    } catch (error: any) {
      console.log(
        '✅ Validation works:',
        error.response?.status,
        error.response?.data?.message,
      );
    }

    // Test 6: Non-numeric values
    console.log('\n❌ Test 6: Non-numeric values');
    try {
      await axios.get(baseURL, {
        params: { limit: 'abc', skip: 'xyz' },
      });
      console.log('❌ Should have failed');
    } catch (error: any) {
      console.log(
        '✅ Validation works:',
        error.response?.status,
        error.response?.data?.message,
      );
    }

    console.log('\n🎉 All query validation tests completed!');
  } catch (error: any) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
}

// Run the test
testQueryValidation().catch(console.error);
