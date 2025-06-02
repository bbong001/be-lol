import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WrChampion } from '../schemas/wr-champion.schema';

async function checkMissingData() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('🔍 Đang kiểm tra dữ liệu WrChampion...\n');

    // Lấy model trực tiếp từ dependency injection
    const wrChampionModel = app.get<Model<WrChampion>>(
      getModelToken(WrChampion.name),
    );

    // Lấy tất cả champions
    const champions = await wrChampionModel.find({}).lean();
    console.log(`📊 Tổng số champions: ${champions.length}\n`);

    const missingData = {
      title: [],
      abilities: [],
      stats: [],
      multiple: [],
    };

    champions.forEach((champion) => {
      const missing = [];

      // Kiểm tra title
      if (!champion.title || champion.title.trim() === '') {
        missing.push('title');
        missingData.title.push(champion.name);
      }

      // Kiểm tra abilities
      if (
        !champion.abilities ||
        !champion.abilities.passive ||
        !champion.abilities.q ||
        !champion.abilities.w ||
        !champion.abilities.e ||
        !champion.abilities.ultimate
      ) {
        missing.push('abilities');
        missingData.abilities.push(champion.name);
      }

      // Kiểm tra stats
      if (
        !champion.stats ||
        typeof champion.stats.health === 'undefined' ||
        typeof champion.stats.mana === 'undefined' ||
        typeof champion.stats.armor === 'undefined' ||
        typeof champion.stats.attackDamage === 'undefined' ||
        champion.stats.health === 0 ||
        champion.stats.armor === 0 ||
        champion.stats.attackDamage === 0
      ) {
        missing.push('stats');
        missingData.stats.push(champion.name);
      }

      // Nếu thiếu nhiều thứ
      if (missing.length > 1) {
        missingData.multiple.push({
          name: champion.name,
          missing: missing,
        });
      }
    });

    // In báo cáo
    console.log('📋 BÁO CÁO DỮ LIỆU THIẾU:\n');

    console.log(`❌ Thiếu Title (${missingData.title.length}):`);
    missingData.title.forEach((name) => console.log(`  - ${name}`));
    console.log('');

    console.log(`❌ Thiếu Abilities (${missingData.abilities.length}):`);
    missingData.abilities.forEach((name) => console.log(`  - ${name}`));
    console.log('');

    console.log(`❌ Thiếu Stats (${missingData.stats.length}):`);
    missingData.stats.forEach((name) => console.log(`  - ${name}`));
    console.log('');

    console.log(`⚠️ Thiếu nhiều dữ liệu (${missingData.multiple.length}):`);
    missingData.multiple.forEach((item) => {
      console.log(`  - ${item.name}: ${item.missing.join(', ')}`);
    });
    console.log('');

    // Thống kê tổng quan
    const totalMissing = new Set([
      ...missingData.title,
      ...missingData.abilities,
      ...missingData.stats,
    ]).size;

    console.log('📈 THỐNG KÊ TỔNG QUAN:');
    console.log(
      `✅ Champions đầy đủ dữ liệu: ${champions.length - totalMissing}`,
    );
    console.log(`❌ Champions thiếu dữ liệu: ${totalMissing}`);
    console.log(
      `📊 Tỷ lệ hoàn thiện: ${(((champions.length - totalMissing) / champions.length) * 100).toFixed(1)}%`,
    );

    // In danh sách champions cần crawl
    console.log('\n🎯 DANH SÁCH CẦN CRAWL:');
    const allMissingChampions = [
      ...new Set([
        ...missingData.title,
        ...missingData.abilities,
        ...missingData.stats,
      ]),
    ];

    allMissingChampions.forEach((name) => console.log(`  - ${name}`));
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra dữ liệu:', error);
  } finally {
    await app.close();
  }
}

checkMissingData();
