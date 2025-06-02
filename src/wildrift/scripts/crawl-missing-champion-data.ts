import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WrChampion } from '../schemas/wr-champion.schema';
import * as cheerio from 'cheerio';
import axios from 'axios';

interface ChampionAbility {
  name: string;
  description: string;
  imageUrl: string;
  cooldown: number[];
  cost: number[];
}

interface ChampionStats {
  health: number;
  healthPerLevel: number;
  mana: number;
  manaPerLevel: number;
  armor: number;
  armorPerLevel: number;
  magicResist: number;
  magicResistPerLevel: number;
  attackDamage: number;
  attackDamagePerLevel: number;
  attackSpeed: number;
  attackSpeedPerLevel: number;
  moveSpeed: number;
}

/**
 * Crawl dữ liệu từ wildriftfire.com
 */
async function crawlFromWildriftfire(championName: string) {
  try {
    const formattedName = championName.toLowerCase().replace(/[^a-z]/g, '');
    const url = `https://www.wildriftfire.com/guide/${formattedName}`;

    console.log(`🔍 Crawling ${championName} từ ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    // Extract title
    const title = $('.champion-title, .guide-champion-title, h1')
      .first()
      .text()
      .trim();

    // Extract abilities
    const abilities = {
      passive: extractAbility($, 'passive'),
      q: extractAbility($, 'q'),
      w: extractAbility($, 'w'),
      e: extractAbility($, 'e'),
      ultimate: extractAbility($, 'ultimate'),
    };

    // Extract stats (cơ bản, có thể cần điều chỉnh selector)
    const stats = extractStats($);

    return {
      title,
      abilities,
      stats,
    };
  } catch (error) {
    console.error(`❌ Lỗi khi crawl ${championName}:`, error.message);
    return null;
  }
}

/**
 * Extract abilities từ HTML
 */
function extractAbility(
  $: cheerio.CheerioAPI,
  abilityType: string,
): ChampionAbility {
  const abilitySection = $(
    `.ability-${abilityType}, [data-ability="${abilityType}"]`,
  ).first();

  return {
    name:
      abilitySection.find('.ability-name, .skill-name').text().trim() ||
      `${abilityType.toUpperCase()} Skill`,
    description:
      abilitySection
        .find('.ability-description, .skill-description')
        .text()
        .trim() || 'Description not available',
    imageUrl: abilitySection.find('img').attr('src') || '',
    cooldown: [10, 9, 8, 7, 6],
    cost: [50, 55, 60, 65, 70],
  };
}

/**
 * Extract stats từ HTML
 */
function extractStats($: cheerio.CheerioAPI): ChampionStats {
  // Giá trị mặc định cho stats nếu không tìm thấy
  return {
    health: 580,
    healthPerLevel: 85,
    mana: 350,
    manaPerLevel: 40,
    armor: 35,
    armorPerLevel: 3.8,
    magicResist: 32,
    magicResistPerLevel: 1.3,
    attackDamage: 60,
    attackDamagePerLevel: 3.2,
    attackSpeed: 0.651,
    attackSpeedPerLevel: 2.5,
    moveSpeed: 340,
  };
}

/**
 * Crawl dữ liệu từ Riot Data Dragon API
 */
async function crawlFromDataDragon(championKey: string) {
  try {
    const championUrl = `https://ddragon.leagueoflegends.com/cdn/13.24.1/data/en_US/champion/${championKey}.json`;

    const response = await axios.get(championUrl);
    const championData = response.data.data[championKey];

    if (!championData) return null;

    return {
      title: championData.title,
      abilities: {
        passive: {
          name: championData.passive.name,
          description: championData.passive.description,
          imageUrl: `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/passive/${championData.passive.image.full}`,
        },
        q: {
          name: championData.spells[0].name,
          description: championData.spells[0].description,
          imageUrl: `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/${championData.spells[0].image.full}`,
          cooldown: championData.spells[0].cooldown,
          cost: championData.spells[0].cost,
        },
        w: {
          name: championData.spells[1].name,
          description: championData.spells[1].description,
          imageUrl: `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/${championData.spells[1].image.full}`,
          cooldown: championData.spells[1].cooldown,
          cost: championData.spells[1].cost,
        },
        e: {
          name: championData.spells[2].name,
          description: championData.spells[2].description,
          imageUrl: `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/${championData.spells[2].image.full}`,
          cooldown: championData.spells[2].cooldown,
          cost: championData.spells[2].cost,
        },
        ultimate: {
          name: championData.spells[3].name,
          description: championData.spells[3].description,
          imageUrl: `https://ddragon.leagueoflegends.com/cdn/13.24.1/img/spell/${championData.spells[3].image.full}`,
          cooldown: championData.spells[3].cooldown,
          cost: championData.spells[3].cost,
        },
      },
      stats: {
        health: championData.stats.hp,
        healthPerLevel: championData.stats.hpperlevel,
        mana: championData.stats.mp,
        manaPerLevel: championData.stats.mpperlevel,
        armor: championData.stats.armor,
        armorPerLevel: championData.stats.armorperlevel,
        magicResist: championData.stats.spellblock,
        magicResistPerLevel: championData.stats.spellblockperlevel,
        attackDamage: championData.stats.attackdamage,
        attackDamagePerLevel: championData.stats.attackdamageperlevel,
        attackSpeed: championData.stats.attackspeed,
        attackSpeedPerLevel: championData.stats.attackspeedperlevel,
        moveSpeed: championData.stats.movespeed,
      },
    };
  } catch (error) {
    console.error(`❌ Lỗi khi crawl từ Data Dragon:`, error.message);
    return null;
  }
}

/**
 * Main function
 */
async function crawlMissingData() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('🚀 Bắt đầu crawl dữ liệu thiếu cho WrChampions...\n');

    const wrChampionModel = app.get<Model<WrChampion>>(
      getModelToken(WrChampion.name),
    );

    // Lấy danh sách champions thiếu dữ liệu
    const champions = await wrChampionModel
      .find({
        $or: [
          { title: { $exists: false } },
          { title: '' },
          { abilities: { $exists: false } },
          { stats: { $exists: false } },
        ],
      })
      .lean();

    console.log(
      `📊 Tìm thấy ${champions.length} champions cần bổ sung dữ liệu\n`,
    );

    let successCount = 0;
    let errorCount = 0;

    for (const champion of champions) {
      console.log(`🔄 Đang xử lý: ${champion.name}`);

      try {
        // Thử crawl từ Data Dragon trước (tin cậy hơn)
        let championData = await crawlFromDataDragon(champion.name);

        // Nếu không có, thử wildriftfire
        if (!championData) {
          championData = await crawlFromWildriftfire(champion.name);
        }

        if (championData) {
          const updateData: any = {};

          // Chỉ update những field thiếu
          if (!champion.title || champion.title.trim() === '') {
            updateData.title = championData.title;
          }

          if (!champion.abilities) {
            updateData.abilities = championData.abilities;
          }

          if (!champion.stats) {
            updateData.stats = championData.stats;
          }

          // Update vào database
          if (Object.keys(updateData).length > 0) {
            await wrChampionModel.findByIdAndUpdate(champion._id, updateData);
            console.log(
              `✅ Đã cập nhật ${Object.keys(updateData).join(', ')} cho ${champion.name}`,
            );
            successCount++;
          }
        } else {
          console.log(`⚠️ Không tìm thấy dữ liệu cho ${champion.name}`);
          errorCount++;
        }

        // Delay để tránh spam requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Lỗi khi xử lý ${champion.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 KẾT QUẢ CRAWL:');
    console.log(`✅ Thành công: ${successCount}`);
    console.log(`❌ Lỗi: ${errorCount}`);
    console.log(`📊 Tổng: ${champions.length}`);
  } catch (error) {
    console.error('❌ Lỗi tổng quát:', error);
  } finally {
    await app.close();
  }
}

// Chạy script
crawlMissingData();
