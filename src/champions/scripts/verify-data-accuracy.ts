import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CounterService } from '../services/counter.service';

async function verifyDataAccuracy() {
  console.log('🔍 Verifying Data Accuracy Against Website');
  console.log('============================================================');

  try {
    const app = await NestFactory.createApplicationContext(AppModule);
    const counterService = app.get(CounterService);

    console.log('✅ NestJS application context created');

    // Test với Zeri
    console.log('\n🎯 Checking Zeri data...');
    const zeriData = await counterService.findByChampionAndRole('zeri', 'adc');

    console.log('\n📊 ZERI - Database vs Website Comparison:');
    console.log('------------------------------------------------------------');

    console.log('🔴 WeakAgainst (Tướng khắc chế Zeri):');
    console.log(
      '   Database:',
      zeriData.weakAgainst.map((c) => c.championName).join(', '),
    );
    console.log('   Website: Caitlyn, Veigar, Varus, Ashe, Draven, Twitch');

    console.log('\n🟢 StrongAgainst (Tướng yếu hơn Zeri):');
    console.log(
      '   Database:',
      zeriData.strongAgainst.map((c) => c.championName).join(', '),
    );
    console.log('   Website: Kaisa, Varus, Kalista, Yasuo, Aphelios, Samira');

    console.log('\n⭐ BestLaneCounters (Tỷ lệ thắng cao khi đối đầu Zeri):');
    console.log(
      '   Database:',
      zeriData.bestLaneCounters.map((c) => c.championName).join(', '),
    );
    console.log('   Website: Gragas, Lulu, Zyra, Soraka, Nami, Janna');

    // Kiểm tra Varus đặc biệt
    console.log('\n🚨 VARUS ANALYSIS:');
    const varusInWeak = zeriData.weakAgainst.find(
      (c) => c.championName.toLowerCase() === 'varus',
    );
    const varusInStrong = zeriData.strongAgainst.find(
      (c) => c.championName.toLowerCase() === 'varus',
    );

    console.log(
      `   - Varus in WeakAgainst: ${varusInWeak ? '✅ YES' : '❌ NO'}`,
    );
    console.log(
      `   - Varus in StrongAgainst: ${varusInStrong ? '✅ YES' : '❌ NO'}`,
    );
    console.log('   - Website shows: Varus in BOTH categories!');

    // Kiểm tra tổng số champions
    const totalInDb =
      zeriData.weakAgainst.length +
      zeriData.strongAgainst.length +
      zeriData.bestLaneCounters.length;
    console.log(
      `\n📈 Total Champions: ${totalInDb} (Database) vs 18 (Website)`,
    );

    // Test với Caitlyn và Jinx
    console.log('\n🎯 Checking Caitlyn data...');
    const caitlynData = await counterService.findByChampionAndRole(
      'caitlyn',
      'adc',
    );

    console.log('\n📊 CAITLYN - Database vs Website:');
    console.log('------------------------------------------------------------');
    console.log('🔴 WeakAgainst:', caitlynData.weakAgainst.length, 'champions');
    console.log(
      '🟢 StrongAgainst:',
      caitlynData.strongAgainst.length,
      'champions',
    );
    console.log(
      '⭐ BestLaneCounters:',
      caitlynData.bestLaneCounters.length,
      'champions',
    );

    console.log('\n🎯 Checking Jinx data...');
    const jinxData = await counterService.findByChampionAndRole('jinx', 'adc');

    console.log('\n📊 JINX - Database vs Website:');
    console.log('------------------------------------------------------------');
    console.log('🔴 WeakAgainst:', jinxData.weakAgainst.length, 'champions');
    console.log(
      '🟢 StrongAgainst:',
      jinxData.strongAgainst.length,
      'champions',
    );
    console.log(
      '⭐ BestLaneCounters:',
      jinxData.bestLaneCounters.length,
      'champions',
    );

    console.log('\n🔍 PROBLEM ANALYSIS:');
    console.log('------------------------------------------------------------');
    console.log('❌ Current logic prevents duplicates between categories');
    console.log(
      '❌ But website actually ALLOWS same champion in multiple categories',
    );
    console.log('❌ This causes data loss and inaccuracy');

    console.log('\n💡 RECOMMENDED FIX:');
    console.log('------------------------------------------------------------');
    console.log('1. Allow champions to exist in multiple categories');
    console.log('2. Only prevent duplicates WITHIN the same category');
    console.log('3. Re-crawl data with corrected logic');

    await app.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyDataAccuracy().catch(console.error);
