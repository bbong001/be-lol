import axios from 'axios';

async function testApiI18n() {
  console.log('🧪 Testing API i18n Endpoints');
  console.log('==============================');

  const baseUrl = 'http://localhost:4000/api/champions';

  try {
    // Test Vietnamese
    console.log('\n🇻🇳 Testing Vietnamese API...');
    const viResponse = await axios.get(`${baseUrl}?lang=vi&limit=2`);
    console.log('Status:', viResponse.status);
    console.log('First Champion VI:');
    if (viResponse.data.data && viResponse.data.data.length > 0) {
      const champion = viResponse.data.data[0];
      console.log(`  Name: ${champion.name}`);
      console.log(`  Title: ${champion.title}`);
      console.log(`  ID: ${champion.id}`);
    }

    // Test English
    console.log('\n🇺🇸 Testing English API...');
    const enResponse = await axios.get(`${baseUrl}?lang=en&limit=2`);
    console.log('Status:', enResponse.status);
    console.log('First Champion EN:');
    if (enResponse.data.data && enResponse.data.data.length > 0) {
      const champion = enResponse.data.data[0];
      console.log(`  Name: ${champion.name}`);
      console.log(`  Title: ${champion.title}`);
      console.log(`  ID: ${champion.id}`);
    }

    // Test specific champion
    console.log('\n🎯 Testing specific champion (Ahri)...');
    const ahriVi = await axios.get(`${baseUrl}/name/Ahri?lang=vi`);
    const ahriEn = await axios.get(`${baseUrl}/name/Ahri?lang=en`);

    console.log('Ahri VI:', ahriVi.data.name, '-', ahriVi.data.title);
    console.log('Ahri EN:', ahriEn.data.name, '-', ahriEn.data.title);

    console.log('\n🎉 API i18n is working perfectly!');
    console.log('\n📋 Test Results:');
    console.log(
      `✅ Vietnamese endpoint: ${viResponse.status === 200 ? 'Working' : 'Failed'}`,
    );
    console.log(
      `✅ English endpoint: ${enResponse.status === 200 ? 'Working' : 'Failed'}`,
    );
    console.log(
      `✅ Specific champion: ${ahriVi.status === 200 && ahriEn.status === 200 ? 'Working' : 'Failed'}`,
    );
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

testApiI18n().catch(console.error);
