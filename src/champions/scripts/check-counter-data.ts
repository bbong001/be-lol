import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { CounterService } from '../services/counter.service';

/**
 * Script kiểm tra counter data đã crawl
 * Tuân thủ quy tắc từ prompt.txt: sử dụng NestJS, dependency injection, async/await
 */

async function checkCounterData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const counterService = app.get(CounterService);

  try {
    console.log('🔍 Kiểm tra counter data đã crawl...\n');

    // Lấy tất cả counter data
    const allCountersResult = await counterService.findAll({
      limit: 10000,
      skip: 0,
    });
    const allCounters = allCountersResult.data;
    console.log(`📊 Tổng số counter records: ${allCounters.length}`);

    if (allCounters.length === 0) {
      console.log('⚠️ Chưa có counter data nào. Vui lòng chạy crawl trước.');
      return;
    }

    // Thống kê theo role
    const roleStats = allCounters.reduce(
      (acc, counter) => {
        acc[counter.role] = (acc[counter.role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log('\n📈 Thống kê theo role:');
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} champions`);
    });

    // Thống kê theo patch
    const patchStats = allCounters.reduce(
      (acc, counter) => {
        acc[counter.patch] = (acc[counter.patch] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log('\n🎯 Thống kê theo patch:');
    Object.entries(patchStats).forEach(([patch, count]) => {
      console.log(`  ${patch}: ${count} records`);
    });

    // Top 10 champions có counter data nhiều nhất
    const championStats = allCounters.reduce(
      (acc, counter) => {
        acc[counter.championName] = (acc[counter.championName] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topChampions = Object.entries(championStats)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10);

    console.log('\n🏆 Top 10 champions có nhiều counter data nhất:');
    topChampions.forEach(([champion, count], index) => {
      console.log(`  ${index + 1}. ${champion}: ${count} roles`);
    });

    // Kiểm tra data quality
    console.log('\n🔬 Kiểm tra chất lượng data:');

    const withContent = allCounters.filter(
      (c) =>
        c.weaknessesContent ||
        c.counterItemsContent ||
        c.strategiesContent ||
        c.additionalTipsContent,
    );
    console.log(
      `  Có nội dung chi tiết: ${withContent.length}/${allCounters.length} (${((withContent.length / allCounters.length) * 100).toFixed(1)}%)`,
    );

    const withCounters = allCounters.filter(
      (c) =>
        (c.strongAgainst && c.strongAgainst.length > 0) ||
        (c.weakAgainst && c.weakAgainst.length > 0),
    );
    console.log(
      `  Có counter champions: ${withCounters.length}/${allCounters.length} (${((withCounters.length / allCounters.length) * 100).toFixed(1)}%)`,
    );

    const withStats = allCounters.filter(
      (c) => c.overallWinRate > 0 || c.pickRate > 0 || c.banRate > 0,
    );
    console.log(
      `  Có thống kê game: ${withStats.length}/${allCounters.length} (${((withStats.length / allCounters.length) * 100).toFixed(1)}%)`,
    );

    // Sample data từng loại
    console.log('\n📋 Sample data:');

    const sampleWithContent = withContent[0];
    if (sampleWithContent) {
      console.log(
        `\n🔸 Sample: ${sampleWithContent.championName} (${sampleWithContent.role})`,
      );
      console.log(`  Win Rate: ${sampleWithContent.overallWinRate}%`);
      console.log(`  Pick Rate: ${sampleWithContent.pickRate}%`);
      console.log(`  Ban Rate: ${sampleWithContent.banRate}%`);
      console.log(
        `  Strong Against: ${sampleWithContent.strongAgainst?.length || 0} champions`,
      );
      console.log(
        `  Weak Against: ${sampleWithContent.weakAgainst?.length || 0} champions`,
      );
      console.log(
        `  Has Weaknesses Content: ${!!sampleWithContent.weaknessesContent}`,
      );
      console.log(
        `  Has Counter Items Content: ${!!sampleWithContent.counterItemsContent}`,
      );
      console.log(
        `  Has Strategies Content: ${!!sampleWithContent.strategiesContent}`,
      );
      console.log(`  Last Updated: ${sampleWithContent.lastUpdated}`);
    }

    // Champions còn thiếu counter data
    console.log('\n⚠️ Các champions có thể cần crawl thêm:');
    const missingRoles = ['jungle', 'top', 'mid', 'adc', 'support'];
    const existingCombos = new Set(
      allCounters.map((c) => `${c.championId}-${c.role}`),
    );

    const allChampionNames = [
      ...new Set(allCounters.map((c) => c.championName)),
    ];
    const missingCombos: string[] = [];

    allChampionNames.forEach((champion) => {
      missingRoles.forEach((role) => {
        const combo = `${champion}-${role}`;
        if (!existingCombos.has(combo)) {
          missingCombos.push(`${champion} (${role})`);
        }
      });
    });

    if (missingCombos.length > 0) {
      console.log(`  Thiếu ${missingCombos.length} combinations. Ví dụ:`);
      missingCombos.slice(0, 5).forEach((combo) => {
        console.log(`    - ${combo}`);
      });
      if (missingCombos.length > 5) {
        console.log(`    ... và ${missingCombos.length - 5} combinations khác`);
      }
    } else {
      console.log('  ✅ Tất cả champions đã có đủ counter data cho các roles');
    }

    console.log('\n✨ Kiểm tra hoàn tất!');
  } catch (error) {
    console.error('💥 Lỗi khi kiểm tra counter data:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

/**
 * Kiểm tra champion cụ thể
 */
async function checkSpecificChampion(championId: string, role?: string) {
  const app = await NestFactory.createApplicationContext(AppModule);
  const counterService = app.get(CounterService);

  try {
    console.log(
      `🔍 Kiểm tra counter data cho ${championId}${role ? ` (${role})` : ''}...\n`,
    );

    let counters;
    if (role) {
      counters = await counterService.findByChampionAndRole(championId, role);
      counters = counters ? [counters] : [];
    } else {
      counters = await counterService.findByChampionName(championId);
    }

    if (counters.length === 0) {
      console.log(
        `⚠️ Không tìm thấy counter data cho ${championId}${role ? ` (${role})` : ''}`,
      );
      return;
    }

    console.log(`📊 Tìm thấy ${counters.length} counter record(s):`);

    counters.forEach((counter, index) => {
      console.log(
        `\n📋 Record ${index + 1}: ${counter.championName} (${counter.role})`,
      );
      console.log(
        `  🎯 Patch: ${counter.patch} | Rank: ${counter.rank} | Region: ${counter.region}`,
      );
      console.log(
        `  📈 Win Rate: ${counter.overallWinRate}% | Pick Rate: ${counter.pickRate}% | Ban Rate: ${counter.banRate}%`,
      );

      console.log(
        `\n  💪 Strong Against (${counter.strongAgainst?.length || 0}):`,
      );
      counter.strongAgainst?.slice(0, 3).forEach((enemy) => {
        console.log(
          `    - ${enemy.championName}: ${enemy.winRate}% WR, ${enemy.gameCount} games`,
        );
      });

      console.log(`\n  😰 Weak Against (${counter.weakAgainst?.length || 0}):`);
      counter.weakAgainst?.slice(0, 3).forEach((enemy) => {
        console.log(
          `    - ${enemy.championName}: ${enemy.winRate}% WR, ${enemy.gameCount} games`,
        );
      });

      console.log(`\n  📝 Content Sections:`);
      console.log(
        `    Weaknesses: ${counter.weaknessesContent ? 'Có' : 'Không'}`,
      );
      console.log(
        `    Counter Items: ${counter.counterItemsContent ? 'Có' : 'Không'}`,
      );
      console.log(
        `    Strategies: ${counter.strategiesContent ? 'Có' : 'Không'}`,
      );
      console.log(
        `    Additional Tips: ${counter.additionalTipsContent ? 'Có' : 'Không'}`,
      );

      console.log(`\n  ⏰ Last Updated: ${counter.lastUpdated}`);
      console.log(`  🆔 ID: ${counter._id}`);
    });
  } catch (error) {
    console.error('💥 Lỗi khi kiểm tra champion:', error.message);
  } finally {
    await app.close();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.length >= 1 && !args[0].startsWith('--')) {
    const championId = args[0];
    const role = args[1];
    await checkSpecificChampion(championId, role);
  } else {
    await checkCounterData();
  }
}

// Chạy script
if (require.main === module) {
  main().catch(console.error);
}

export { checkCounterData, checkSpecificChampion };
