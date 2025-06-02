import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WrChampion } from '../schemas/wr-champion.schema';

async function fixAmbessaData() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    console.log('🛠️ Đang cập nhật dữ liệu cho Ambessa...\n');

    const wrChampionModel = app.get<Model<WrChampion>>(
      getModelToken(WrChampion.name),
    );

    // Tìm Ambessa trong database
    const ambessa = await wrChampionModel.findOne({ name: 'Ambessa' });

    if (!ambessa) {
      console.log('❌ Không tìm thấy Ambessa trong database');
      return;
    }

    // Dữ liệu manual cho Ambessa (champion mới của Wild Rift)
    const ambessaData = {
      title: 'The Warlord',
      abilities: {
        passive: {
          name: "The Warlord's Instinct",
          description:
            "After casting an ability, Ambessa's next basic attack deals bonus physical damage.",
          imageUrl:
            'https://static.wikia.nocookie.net/leagueoflegends/images/f/f9/Ambessa_The_Warlord%27s_Instinct.png',
        },
        q: {
          name: 'Sweeping Blade',
          description:
            'Ambessa slashes with her sword in a line, dealing physical damage to enemies hit.',
          imageUrl:
            'https://static.wikia.nocookie.net/leagueoflegends/images/a/a1/Ambessa_Sweeping_Blade.png',
          cooldown: [8, 7.5, 7, 6.5, 6],
          cost: [30, 35, 40, 45, 50],
        },
        w: {
          name: "Vanguard's Edge",
          description:
            'Ambessa creates a shield and gains movement speed. If recast, she dashes forward.',
          imageUrl:
            'https://static.wikia.nocookie.net/leagueoflegends/images/b/b8/Ambessa_Vanguard%27s_Edge.png',
          cooldown: [14, 13, 12, 11, 10],
          cost: [60, 65, 70, 75, 80],
        },
        e: {
          name: 'Repudiation',
          description:
            'Ambessa knocks back nearby enemies and deals magic damage.',
          imageUrl:
            'https://static.wikia.nocookie.net/leagueoflegends/images/c/c7/Ambessa_Repudiation.png',
          cooldown: [12, 11, 10, 9, 8],
          cost: [70, 75, 80, 85, 90],
        },
        ultimate: {
          name: 'Public Execution',
          description:
            'Ambessa marks an enemy champion and gains increased damage against them.',
          imageUrl:
            'https://static.wikia.nocookie.net/leagueoflegends/images/d/d4/Ambessa_Public_Execution.png',
          cooldown: [100, 85, 70],
          cost: [100, 100, 100],
        },
      },
      stats: {
        health: 610,
        healthPerLevel: 95,
        mana: 320,
        manaPerLevel: 42,
        armor: 38,
        armorPerLevel: 4.2,
        magicResist: 32,
        magicResistPerLevel: 1.3,
        attackDamage: 64,
        attackDamagePerLevel: 3.5,
        attackSpeed: 0.625,
        attackSpeedPerLevel: 2.9,
        moveSpeed: 345,
      },
    };

    // Cập nhật dữ liệu
    await wrChampionModel.findByIdAndUpdate(ambessa._id, ambessaData);

    console.log('✅ Đã cập nhật thành công dữ liệu cho Ambessa');
    console.log('📊 Cập nhật: title, abilities, stats');
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật Ambessa:', error);
  } finally {
    await app.close();
  }
}

fixAmbessaData();
