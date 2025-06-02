import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WrChampion } from '../schemas/wr-champion.schema';
import axios from 'axios';

async function crawlMissingDataFromDataDragon() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('🚀 Bắt đầu crawl dữ liệu từ Riot Data Dragon API...\n');

    const wrChampionModel = app.get<Model<WrChampion>>(
      getModelToken(WrChampion.name),
    );

    // Lấy danh sách tất cả champions từ Riot API
    const championsListUrl =
      'https://ddragon.leagueoflegends.com/cdn/13.24.1/data/en_US/champion.json';
    const championsListResponse = await axios.get(championsListUrl);
    const allRiotChampions = championsListResponse.data.data;

    console.log(
      `📊 Tìm thấy ${Object.keys(allRiotChampions).length} champions từ Riot API\n`,
    );

    // Lấy champions thiếu dữ liệu từ database
    const championsInDb = await wrChampionModel
      .find({
        $or: [
          { title: { $exists: false } },
          { title: '' },
          { abilities: { $exists: false } },
          { stats: { $exists: false } },
          { 'stats.health': 0 },
          { 'stats.armor': 0 },
          { 'stats.attackDamage': 0 },
        ],
      })
      .lean();

    console.log(
      `🔍 Tìm thấy ${championsInDb.length} champions cần bổ sung dữ liệu\n`,
    );

    let successCount = 0;
    let errorCount = 0;

    for (const champion of championsInDb) {
      console.log(`🔄 Đang xử lý: ${champion.name}`);

      try {
        // Tìm champion tương ứng trong Riot API data
        const riotChampion = Object.values(allRiotChampions).find(
          (rChamp: any) =>
            rChamp.name.toLowerCase() === champion.name.toLowerCase() ||
            rChamp.id.toLowerCase() ===
              champion.name
                .toLowerCase()
                .replace(/\s+/g, '')
                .replace(/[^a-z]/g, ''),
        ) as any;

        if (!riotChampion) {
          console.log(`⚠️ Không tìm thấy ${champion.name} trong Riot API`);
          errorCount++;
          continue;
        }

        // Lấy chi tiết champion
        const championDetailUrl = `https://ddragon.leagueoflegends.com/cdn/13.24.1/data/en_US/champion/${riotChampion.id}.json`;
        const detailResponse = await axios.get(championDetailUrl);
        const championData = detailResponse.data.data[riotChampion.id];

        const updateData: any = {};

        // Bổ sung title nếu thiếu
        if (!champion.title || champion.title.trim() === '') {
          updateData.title = championData.title;
        }

        // Bổ sung abilities nếu thiếu
        if (!champion.abilities) {
          updateData.abilities = {
            passive: {
              name: championData.passive.name,
              description: championData.passive.description,
              imageUrl: `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/passive/${championData.passive.image.full}`,
            },
            q: {
              name: championData.spells[0]?.name || 'Q Skill',
              description:
                championData.spells[0]?.description ||
                'Description not available',
              imageUrl: championData.spells[0]
                ? `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/${championData.spells[0].image.full}`
                : '',
              cooldown: championData.spells[0]?.cooldown || [10, 9, 8, 7, 6],
              cost: championData.spells[0]?.cost || [50, 55, 60, 65, 70],
            },
            w: {
              name: championData.spells[1]?.name || 'W Skill',
              description:
                championData.spells[1]?.description ||
                'Description not available',
              imageUrl: championData.spells[1]
                ? `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/${championData.spells[1].image.full}`
                : '',
              cooldown: championData.spells[1]?.cooldown || [10, 9, 8, 7, 6],
              cost: championData.spells[1]?.cost || [50, 55, 60, 65, 70],
            },
            e: {
              name: championData.spells[2]?.name || 'E Skill',
              description:
                championData.spells[2]?.description ||
                'Description not available',
              imageUrl: championData.spells[2]
                ? `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/${championData.spells[2].image.full}`
                : '',
              cooldown: championData.spells[2]?.cooldown || [10, 9, 8, 7, 6],
              cost: championData.spells[2]?.cost || [50, 55, 60, 65, 70],
            },
            ultimate: {
              name: championData.spells[3]?.name || 'Ultimate',
              description:
                championData.spells[3]?.description ||
                'Description not available',
              imageUrl: championData.spells[3]
                ? `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/${championData.spells[3].image.full}`
                : '',
              cooldown: championData.spells[3]?.cooldown || [100, 80, 60],
              cost: championData.spells[3]?.cost || [100, 100, 100],
            },
          };
        }

        // Bổ sung stats nếu thiếu hoặc rỗng hoặc có giá trị 0
        if (
          !champion.stats ||
          Object.keys(champion.stats).length === 0 ||
          champion.stats.health === 0 ||
          champion.stats.armor === 0 ||
          champion.stats.attackDamage === 0
        ) {
          updateData.stats = {
            health: championData.stats.hp || 580,
            healthPerLevel: championData.stats.hpperlevel || 85,
            mana: championData.stats.mp || 350,
            manaPerLevel: championData.stats.mpperlevel || 40,
            armor: championData.stats.armor || 35,
            armorPerLevel: championData.stats.armorperlevel || 3.8,
            magicResist: championData.stats.spellblock || 32,
            magicResistPerLevel: championData.stats.spellblockperlevel || 1.3,
            attackDamage: championData.stats.attackdamage || 60,
            attackDamagePerLevel:
              championData.stats.attackdamageperlevel || 3.2,
            attackSpeed: championData.stats.attackspeed || 0.651,
            attackSpeedPerLevel: championData.stats.attackspeedperlevel || 2.5,
            moveSpeed: championData.stats.movespeed || 340,
          };
        }

        // Update vào database
        if (Object.keys(updateData).length > 0) {
          await wrChampionModel.findByIdAndUpdate(champion._id, updateData);
          console.log(
            `✅ Đã cập nhật ${Object.keys(updateData).join(', ')} cho ${champion.name}`,
          );
          successCount++;
        }

        // Delay để tránh spam requests
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Lỗi khi xử lý ${champion.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 KẾT QUẢ CRAWL:');
    console.log(`✅ Thành công: ${successCount}`);
    console.log(`❌ Lỗi: ${errorCount}`);
    console.log(`📊 Tổng: ${championsInDb.length}`);
  } catch (error) {
    console.error('❌ Lỗi tổng quát:', error);
  } finally {
    await app.close();
  }
}

crawlMissingDataFromDataDragon();
