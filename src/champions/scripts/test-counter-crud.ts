import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CreateCounterDto, UpdateCounterDto } from '../dto/counter.dto';
import axios from 'axios';

async function testCounterCRUD() {
  console.log('🚀 Starting Counter CRUD Test...\n');

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);

  const baseURL = 'http://localhost:3000/counters';
  let createdCounterId: string;

  try {
    // Test 1: CREATE - Tạo counter mới
    console.log('📝 Test 1: CREATE Counter');
    const createCounterDto: CreateCounterDto = {
      championId: 'aatrox-test-crud',
      championName: 'Aatrox Test CRUD',
      role: 'top',
      overallWinRate: 52.5,
      pickRate: 8.2,
      banRate: 12.1,
      strongAgainst: [
        {
          championId: 'yasuo',
          championName: 'Yasuo',
          winRate: 58.3,
          counterRating: 7.5,
          gameCount: 1250,
          goldDifferentialAt15: 350,
          difficulty: 'Medium',
          tips: 'Focus on early game trades and avoid his windwall',
        },
        {
          championId: 'riven',
          championName: 'Riven',
          winRate: 55.8,
          counterRating: 6.8,
          gameCount: 890,
          goldDifferentialAt15: 220,
          difficulty: 'Easy',
          tips: 'Use Q to interrupt her combos',
        },
      ],
      weakAgainst: [
        {
          championId: 'fiora',
          championName: 'Fiora',
          winRate: 45.2,
          counterRating: 8.2,
          gameCount: 980,
          goldDifferentialAt15: -280,
          difficulty: 'Hard',
          tips: 'Avoid extended trades, she scales better',
        },
        {
          championId: 'jax',
          championName: 'Jax',
          winRate: 47.1,
          counterRating: 7.3,
          gameCount: 1120,
          goldDifferentialAt15: -150,
          difficulty: 'Medium',
          tips: 'Respect his late game power',
        },
      ],
      patch: '15.10',
      rank: 'Emerald+',
      region: 'World',
      formattedContent:
        '<h3>Aatrox Counter Guide</h3><p>Detailed guide content here...</p>',
      weaknessesContent:
        '<ul><li>Vulnerable to crowd control</li><li>Weak early game</li></ul>',
      counterItemsContent:
        "<ul><li>Executioner's Calling</li><li>Bramble Vest</li></ul>",
      strategiesContent:
        '<ul><li>Focus on early game pressure</li><li>Deny farm</li></ul>',
      additionalTipsContent:
        '<ul><li>Ward river bushes</li><li>Coordinate with jungler</li></ul>',
    };

    const createResponse = await axios.post(baseURL, createCounterDto);
    console.log('✅ CREATE Success:', {
      id: createResponse.data._id,
      championName: createResponse.data.championName,
      role: createResponse.data.role,
      strongAgainst: createResponse.data.strongAgainst?.length || 0,
      weakAgainst: createResponse.data.weakAgainst?.length || 0,
    });
    createdCounterId = createResponse.data._id;

    // Test 2: READ ALL - Lấy tất cả counters với pagination
    console.log('\n📖 Test 2: READ ALL Counters');
    const getAllResponse = await axios.get(baseURL, {
      params: { limit: 5, skip: 0, role: 'top' },
    });
    console.log('✅ GET ALL Success:', {
      total: getAllResponse.data.total,
      page: getAllResponse.data.page,
      limit: getAllResponse.data.limit,
      totalPages: getAllResponse.data.totalPages,
      dataCount: getAllResponse.data.data.length,
    });

    // Test 3: READ BY CHAMPION AND ROLE - Lấy counter theo champion và role
    console.log('\n🔍 Test 3: READ by Champion and Role');
    const getByChampionResponse = await axios.get(
      `${baseURL}/aatrox-test-crud/top`,
      {
        params: { patch: '15.10', rank: 'Emerald+', region: 'World' },
      },
    );
    console.log('✅ GET by Champion Success:', {
      championId: getByChampionResponse.data.championId,
      role: getByChampionResponse.data.role,
      patch: getByChampionResponse.data.patch,
      strongAgainst: getByChampionResponse.data.strongAgainst?.length || 0,
      weakAgainst: getByChampionResponse.data.weakAgainst?.length || 0,
    });

    // Test 4: UPDATE - Cập nhật counter
    console.log('\n✏️ Test 4: UPDATE Counter');
    const updateCounterDto: UpdateCounterDto = {
      overallWinRate: 54.2,
      pickRate: 9.1,
      banRate: 15.3,
      strongAgainst: [
        ...createCounterDto.strongAgainst!,
        {
          championId: 'garen',
          championName: 'Garen',
          winRate: 62.1,
          counterRating: 8.5,
          gameCount: 750,
          goldDifferentialAt15: 420,
          difficulty: 'Easy',
          tips: 'Kite him with Q and avoid his silence',
        },
      ],
    };

    const updateResponse = await axios.put(
      `${baseURL}/${createdCounterId}`,
      updateCounterDto,
    );
    console.log('✅ UPDATE Success:', {
      id: updateResponse.data._id,
      newWinRate: updateResponse.data.overallWinRate,
      newPickRate: updateResponse.data.pickRate,
      newBanRate: updateResponse.data.banRate,
      strongAgainstCount: updateResponse.data.strongAgainst?.length || 0,
    });

    // Test 5: READ UPDATED DATA - Kiểm tra dữ liệu đã được cập nhật
    console.log('\n🔄 Test 5: Verify UPDATE');
    const verifyResponse = await axios.get(`${baseURL}/aatrox-test-crud/top`);
    console.log('✅ Verify Success:', {
      winRate: verifyResponse.data.overallWinRate,
      pickRate: verifyResponse.data.pickRate,
      banRate: verifyResponse.data.banRate,
      strongAgainstCount: verifyResponse.data.strongAgainst?.length || 0,
      lastUpdated: verifyResponse.data.lastUpdated,
    });

    // Test 6: SEARCH AND FILTER - Test các filter khác nhau
    console.log('\n🔎 Test 6: Search and Filter');

    // Filter by champion name
    const searchByName = await axios.get(baseURL, {
      params: { championName: 'Aatrox', limit: 3 },
    });
    console.log('✅ Search by name:', {
      found: searchByName.data.total,
      results: searchByName.data.data.map((c: any) => c.championName),
    });

    // Filter by patch
    const searchByPatch = await axios.get(baseURL, {
      params: { patch: '15.10', limit: 3 },
    });
    console.log('✅ Search by patch:', {
      found: searchByPatch.data.total,
      patch: '15.10',
    });

    // Test 7: ERROR HANDLING - Test các trường hợp lỗi
    console.log('\n❌ Test 7: Error Handling');

    try {
      // Test duplicate creation
      await axios.post(baseURL, createCounterDto);
      console.log('❌ Should have failed for duplicate');
    } catch (error: any) {
      console.log('✅ Duplicate prevention works:', error.response?.status);
    }

    try {
      // Test invalid champion
      await axios.get(`${baseURL}/nonexistent/top`);
      console.log('❌ Should have failed for non-existent champion');
    } catch (error: any) {
      console.log('✅ 404 for non-existent champion:', error.response?.status);
    }

    try {
      // Test invalid update
      await axios.put(`${baseURL}/507f1f77bcf86cd799439999`, {
        overallWinRate: 50,
      });
      console.log('❌ Should have failed for non-existent ID');
    } catch (error: any) {
      console.log('✅ 404 for non-existent ID:', error.response?.status);
    }

    // Test 8: DELETE - Xóa counter
    console.log('\n🗑️ Test 8: DELETE Counter');
    await axios.delete(`${baseURL}/${createdCounterId}`);
    console.log('✅ DELETE Success: Counter removed');

    // Verify deletion
    try {
      await axios.get(`${baseURL}/aatrox-test-crud/top`);
      console.log('❌ Should have failed after deletion');
    } catch (error: any) {
      console.log('✅ Verify deletion:', error.response?.status);
    }

    console.log('\n🎉 All Counter CRUD tests completed successfully!');
  } catch (error: any) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
  } finally {
    // Cleanup: Delete test data if it still exists
    if (createdCounterId) {
      try {
        await axios.delete(`${baseURL}/${createdCounterId}`);
        console.log('🧹 Cleanup: Test data removed');
      } catch (error) {
        console.log('🧹 Cleanup: Test data already removed or not found');
      }
    }

    await app.close();
    console.log('🔚 Application closed');
  }
}

// Run the test
testCounterCRUD().catch(console.error);
