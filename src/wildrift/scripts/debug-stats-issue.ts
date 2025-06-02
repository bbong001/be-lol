import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WrChampion } from '../schemas/wr-champion.schema';

async function debugStatsIssue() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('🔍 Debug: Kiểm tra cấu trúc dữ liệu champions...\n');

    const wrChampionModel = app.get<Model<WrChampion>>(
      getModelToken(WrChampion.name),
    );

    // Lấy 3 champions đầu tiên để debug
    const champions = await wrChampionModel.find({}).limit(3).lean();

    champions.forEach((champion, index) => {
      console.log(`\n=== CHAMPION ${index + 1}: ${champion.name} ===`);
      console.log('Title:', champion.title);
      console.log('Has abilities:', !!champion.abilities);
      console.log('Has stats:', !!champion.stats);

      if (champion.stats) {
        console.log('Stats object:', JSON.stringify(champion.stats, null, 2));
        console.log('Stats keys:', Object.keys(champion.stats));
        console.log(
          'Health value:',
          champion.stats.health,
          'Type:',
          typeof champion.stats.health,
        );
        console.log(
          'Armor value:',
          champion.stats.armor,
          'Type:',
          typeof champion.stats.armor,
        );
        console.log(
          'AttackDamage value:',
          champion.stats.attackDamage,
          'Type:',
          typeof champion.stats.attackDamage,
        );
      }

      // Kiểm tra điều kiện trong crawl script
      const crawlCondition =
        !champion.stats ||
        Object.keys(champion.stats).length === 0 ||
        champion.stats.health === 0 ||
        champion.stats.armor === 0 ||
        champion.stats.attackDamage === 0;
      console.log('Crawl script would update this champion:', crawlCondition);

      // Kiểm tra điều kiện trong check script
      const checkCondition =
        !champion.stats ||
        typeof champion.stats.health === 'undefined' ||
        typeof champion.stats.mana === 'undefined' ||
        typeof champion.stats.armor === 'undefined' ||
        typeof champion.stats.attackDamage === 'undefined' ||
        champion.stats.health === 0 ||
        champion.stats.armor === 0 ||
        champion.stats.attackDamage === 0;
      console.log('Check script considers this missing stats:', checkCondition);
    });
  } catch (error) {
    console.error('❌ Lỗi khi debug:', error);
  } finally {
    await app.close();
  }
}

debugStatsIssue();
