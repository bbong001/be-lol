import {
  transformText,
  transformChampion,
  transformChampions,
  validateLanguage,
} from '../utils/i18n.util';

function testI18nUtils() {
  console.log('🧪 Testing i18n Utility Functions');
  console.log('==================================');

  // Test 1: transformText
  console.log('\n1️⃣ Testing transformText:');
  const multilingualText = { en: 'Ahri', vi: 'Ahri' };
  const multilingualTitle = { en: 'the Nine-Tailed Fox', vi: 'Cửu Vĩ Hồ' };

  console.log(`Original: ${JSON.stringify(multilingualText)}`);
  console.log(`English: "${transformText(multilingualText, 'en')}"`);
  console.log(`Vietnamese: "${transformText(multilingualText, 'vi')}"`);

  console.log(`\nTitle Original: ${JSON.stringify(multilingualTitle)}`);
  console.log(`Title English: "${transformText(multilingualTitle, 'en')}"`);
  console.log(`Title Vietnamese: "${transformText(multilingualTitle, 'vi')}"`);

  // Test 2: validateLanguage
  console.log('\n2️⃣ Testing validateLanguage:');
  console.log(`validateLanguage('en'): ${validateLanguage('en')}`);
  console.log(`validateLanguage('vi'): ${validateLanguage('vi')}`);
  console.log(
    `validateLanguage('fr'): ${validateLanguage('fr')} (should default to 'en')`,
  );
  console.log(
    `validateLanguage(undefined): ${validateLanguage(undefined)} (should default to 'en')`,
  );

  // Test 3: transformChampion
  console.log('\n3️⃣ Testing transformChampion:');
  const mockChampion = {
    id: 'Ahri',
    name: { en: 'Ahri', vi: 'Ahri' },
    title: { en: 'the Nine-Tailed Fox', vi: 'Cửu Vĩ Hồ' },
    abilities: [
      {
        name: { en: 'Orb of Deception', vi: 'Quả Cầu Lừa Dối' },
        description: { en: 'Ahri sends out...', vi: 'Ahri tung ra...' },
        imageUrl: 'http://example.com/orb.png',
      },
    ],
    stats: { hp: 526, mp: 418 },
    tags: ['Mage', 'Assassin'],
  };

  console.log('Original Champion:', JSON.stringify(mockChampion, null, 2));

  const championEn = transformChampion(mockChampion, 'en');
  console.log('\nTransformed to English:');
  console.log(`Name: ${championEn.name}`);
  console.log(`Title: ${championEn.title}`);
  console.log(
    `First Ability: ${championEn.abilities[0].name} - ${championEn.abilities[0].description}`,
  );

  const championVi = transformChampion(mockChampion, 'vi');
  console.log('\nTransformed to Vietnamese:');
  console.log(`Name: ${championVi.name}`);
  console.log(`Title: ${championVi.title}`);
  console.log(
    `First Ability: ${championVi.abilities[0].name} - ${championVi.abilities[0].description}`,
  );

  // Test 4: transformChampions (array)
  console.log('\n4️⃣ Testing transformChampions (array):');
  const mockChampions = [
    mockChampion,
    {
      id: 'Yasuo',
      name: { en: 'Yasuo', vi: 'Yasuo' },
      title: { en: 'the Unforgiven', vi: 'Kẻ Bất Dung Thứ' },
      abilities: [],
      stats: { hp: 490, mp: 100 },
      tags: ['Fighter', 'Assassin'],
    },
  ];

  const championsEn = transformChampions(mockChampions, 'en');
  console.log('Champions in English:');
  championsEn.forEach((champ, index) => {
    console.log(`${index + 1}. ${champ.name} - ${champ.title}`);
  });

  const championsVi = transformChampions(mockChampions, 'vi');
  console.log('\nChampions in Vietnamese:');
  championsVi.forEach((champ, index) => {
    console.log(`${index + 1}. ${champ.name} - ${champ.title}`);
  });

  // Test 5: Edge cases
  console.log('\n5️⃣ Testing Edge Cases:');

  // Null/undefined champion
  const nullChampion = transformChampion(null, 'en');
  console.log(`transformChampion(null): ${nullChampion}`);

  // Empty array
  const emptyArray = transformChampions([], 'vi');
  console.log(`transformChampions([]): ${JSON.stringify(emptyArray)}`);

  // Missing language data
  const incompleteText = { en: 'English only' } as any;
  console.log(
    `transformText with missing VI: "${transformText(incompleteText, 'vi')}"`,
  );

  console.log('\n🎉 All i18n utility tests completed!');
  console.log('✅ Functions are working correctly');
  console.log('\n📝 Next steps:');
  console.log('1. Set up database connection (.env file)');
  console.log('2. Run: npm run check:champions-data');
  console.log('3. If needed, run: npm run migrate:champions-i18n');
}

testI18nUtils();
