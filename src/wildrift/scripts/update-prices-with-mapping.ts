import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';

// Mapping table từ tên tiếng Việt sang tên tiếng Anh
const ITEM_NAME_MAPPING: Record<string, string> = {
  // Weapons - Physical
  'CƯA XÍCH HÓA KỸ': 'Chempunk Chainsword',
  'ĐINH BA HẢI TINH': "Oceanid's Trident",
  'SÚNG TỪ TRƯỜNG': 'Magnetic Blaster',
  'SÚNG HẢI TẶC': 'The Collector',
  'NỎ TỬ THỦ': 'Immortal Shieldbow',
  'LỜI NHẮC TỬ VONG': "Lord Dominik's Regards",
  'LƯỠI HÁI SƯƠNG ĐEN': 'Black Mist Scythe',
  'KIẾM ÁC XÀ': "Serpent's Fang",
  'BÚA RÌU SÁT THẦN': 'Divine Sunderer',
  'ÁO CHOÀNG BÓNG TỐI': 'Edge of Night',
  'ĐAO TÍM': "Wit's End",
  'PHONG THẦN KIẾM': 'Stormrazor',
  'KIẾM NĂNG LƯỢNG SOLARI': 'Solari Chargeblade',
  'THƯƠNG PHỤC HẬN SERYLDA': "Serylda's Grudge",
  'ĐOẢN ĐAO NAVORI': 'Navori Quickblades',
  'LƯỠI HÁI LINH HỒN': 'Essence Reaver',
  'THẦN KIẾM MURAMANA': 'Muramana',
  'DẠ KIẾM DRAKTHARR': 'Duskblade of Draktharr',
  'KIẾM MA YOUMUU': "Youmuu's Ghostblade",
  'CUỒNG CUNG RUNAAN': "Runaan's Hurricane",
  'MÓNG VUỐT STERAK': "Sterak's Gage",
  'GIÁP THIÊN THẦN': 'Guardian Angel',
  'GƯƠM SUY VONG': 'Blade of the Ruined King',
  'NANH NASHOR': "Nashor's Tooth",
  'HUYẾT KIẾM': 'Bloodthirster',
  'KIẾM MANAMUNE': 'Manamune',
  'MA VŨ SONG KIẾM': 'Phantom Dancer',
  'VŨ ĐIỆU TỬ THẦN': "Death's Dance",
  'CHÙY GAI MALMORTIUS': 'Maw of Malmortius',
  'TAM HỢP KIẾM': 'Trinity Force',
  'RÌU ĐEN': 'Black Cleaver',
  'VÔ CỰC KIẾM': 'Infinity Edge',
  'RÌU ĐẠI MÃNG XÀ': 'Titanic Hydra',

  // Magic Items
  'VƯƠNG MIỆN SUY VONG': 'Crown of the Shattered Queen',
  'TRÁT LỆNH ĐẾ VƯƠNG': 'Imperial Mandate',
  'ĐỘNG CƠ VŨ TRỤ': 'Cosmic Drive',
  'ÁO CHOÀNG NĂNG LƯỢNG': "Banshee's Veil",
  'TRƯỢNG LƯU THỦY': 'Staff of Flowing Waters',
  'CHẤN TỬ PHA LÊ': 'Crystalline Reflector',
  'NGỌC VÔ CỰC': 'Infinity Orb',
  'SÁCH CHIÊU HỒN THỨC TỈNH': 'Awakened Soulstealer',
  'VỌNG ÂM HÒA ĐIỆU': 'Harmonic Echo',
  'LƯ HƯƠNG SÔI SỤC': 'Ardent Censer',
  'QUYỀN TRƯỢNG THIÊN THẦN': "Archangel's Staff",
  'KIẾM TAI ƯƠNG': 'Lich Bane',
  'TRƯỢNG TRƯỜNG SINH': 'Rod of Ages',
  'MẶT NẠ ĐỌA ĐẦY LIANDRY': "Liandry's Torment",
  'TRƯỢNG PHA LÊ RYLAI': "Rylai's Crystal Scepter",
  'MŨ PHÙ THỦY RABADON': "Rabadon's Deathcap",
  'QUỶ THƯ MORELLO': 'Morellonomicon',
  'VỌNG ÂM LUDEN': "Luden's Echo",
  'SÁCH CHIÊU HỒN MEJAI': "Mejai's Soulstealer",
  'SÁCH CŨ': 'Amplifying Tome',

  // Defense Items
  'CHIẾN GIÁP RỰC ĐỎ': 'Amaranth Twinguard',
  'VƯƠNG MIỆN BỎNG CHÁY': 'Searing Crown',
  'ÁO CHOÀNG HỘ MỆNH': 'Mantle of the Twelfth Hour',
  'TẤM CHẮN BÌNH MINH': 'Dawnshroud',
  'PHÁO ĐÀI SƠN THẠCH': 'Bulwark of the Mountain',
  'TIM BĂNG': 'Frozen Heart',
  'LỜI THỀ HỘ VỆ': "Protector's Vow",
  'TỤ BÃO ZEKE': "Zeke's Convergence",
  'GIÁP THIÊN NHIÊN': 'Force Of Nature',
  'GIÁP LIỆT SĨ': "Dead Man's Plate",
  'GĂNG TAY BĂNG GIÁ': 'Iceborn Gauntlet',
  'GIÁP MÁU WARMOG': "Warmog's Armor",
  'GIÁP GAI': 'Thornmail',
  'KHIÊN BĂNG RANDUIN': "Randuin's Omen",
  'GIÁP TÂM LINH': 'Spirit Visage',
  'KHIÊN THÁI DƯƠNG': 'Sunfire Aegis',
  'VÒNG SẮT CỔ TỰ': 'Kaenic Rookern',

  // Support Items
  'BÙA THĂNG HOA': 'Talisman of Ascension',
  'KHIÊN CỔ VẬT': 'Relic Shield',
  'LIỀM MA': 'Spectral Sickle',
  'ĐỒNG XU CỔ ĐẠI': 'Ancient Coin',
  'DÂY CHUYỀN CHUỘC TỘI': 'Redemption',
  'KHIÊN NĂNG LƯỢNG': 'Locket of the Iron Solari',

  // Boots
  'GIÀY CUỒNG NỘ': "Berserker's Greaves",
  'GIÀY NĂNG LƯỢNG': 'Boots of Mana',
  'GIÀY KHAI SÁNG IONIA': 'Ionian Boots of Lucidity',
  'GIÀY THÉP GAI': 'Plated Steelcaps',
  'GIÀY THỦY NGÂN': "Mercury's Treads",
  'GIÀY PHÀM ĂN': 'Gluttonous Greaves',
  'GIÀY NĂNG ĐỘNG': 'Boots of Dynamism',

  // Basic Items
  'KIẾM DÀI': 'Long Sword',
  'HỒNG NGỌC': 'Ruby Crystal',

  // Enchants
  'NGƯNG ĐỌNG NĂNG LƯỢNG': 'Stasis Enchant',
  'THIÊN THẠCH NĂNG LƯỢNG': 'Meteor Enchant',
  'KHIÊN LOCKET NĂNG LƯỢNG': 'Locket Enchant',
  'ĐAI LƯNG NĂNG LƯỢNG': 'Protobelt Enchant',
  'PHẢN LỰC NĂNG LƯỢNG': 'Repulsor Enchant',
  'LÕI TỪ NĂNG LƯỢNG': 'Magnetron Enchant',
  'DỊCH CHUYỂN NĂNG LƯỢNG': 'Teleport Enchant',
  'GIẢI THUẬT NĂNG LƯỢNG': 'Quicksilver Enchant',
  'VINH QUANG BỌC THÉP': 'Glorious Enchant',
  'THẠCH GIÁP NĂNG LƯỢNG': 'Stoneplate Enchant',
  'MÃNG XÀ NĂNG LƯỢNG': 'Shadows Enchant',
  'THÚ BÔNG BẢO MỘNG NĂNG LƯỢNG': 'Redeeming Enchant',

  // Other Items
  'BẪY YORDLE': 'Yordle Trap', // Có thể không có trong EN
  'BĂNG GIÁP': 'Fimbulwinter',
  'TRÁI TIM KHỔNG THẦN': 'Heartsteel',
  'GIÁO THIÊN LY': 'Sundered Sky',
  'NGỌN GIÁO SHOJIN': 'Spear of Shojin',
  'NGUYỆT ĐAO': 'Eclipse',
  'MÁY CHIẾU TÂM LINH': 'Psychic Projector', // Có thể không có trong EN
  'TIA CHỚP HUYỀN ẢO': 'Shimmering Spark', // Có thể không có trong EN
};

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const wrItemModel = app.get(getModelToken('WrItem'));
  const wrItemEnModel = app.get(getModelToken('WrItemsEn'));

  try {
    console.log('🚀 Starting to update prices using mapping table...');

    let updatedCount = 0;
    let notFoundCount = 0;
    let alreadyHasPriceCount = 0;
    const results: any[] = [];

    for (const [viName, enName] of Object.entries(ITEM_NAME_MAPPING)) {
      try {
        // Tìm item tiếng Việt
        const itemVi = await wrItemModel.findOne({ name: viName }).lean();
        if (!itemVi) {
          console.log(`❌ Vietnamese item not found: ${viName}`);
          continue;
        }

        // Tìm item tiếng Anh
        const itemEn = await wrItemEnModel.findOne({ name: enName }).lean();
        if (!itemEn) {
          console.log(`❌ English item not found: ${enName}`);
          notFoundCount++;
          results.push({
            nameVi: viName,
            nameEn: enName,
            status: 'en_not_found',
          });
          continue;
        }

        // Kiểm tra xem item đã có price chưa
        if (itemVi.price && itemVi.price > 0) {
          console.log(`⚠️  ${viName} already has price: ${itemVi.price}`);
          alreadyHasPriceCount++;
          results.push({
            nameVi: viName,
            nameEn: enName,
            status: 'already_has_price',
            currentPrice: itemVi.price,
            newPrice: itemEn.price,
          });
          continue;
        }

        // Cập nhật price
        await wrItemModel.updateOne(
          { _id: itemVi._id },
          { $set: { price: itemEn.price } },
        );

        console.log(
          `✅ Updated price for ${viName} (${enName}): ${itemEn.price} gold`,
        );
        updatedCount++;

        results.push({
          nameVi: viName,
          nameEn: enName,
          status: 'updated',
          price: itemEn.price,
        });
      } catch (error) {
        console.error(`💥 Error processing ${viName}:`, error.message);
      }
    }

    console.log('\n🎯 === UPDATE PRICES WITH MAPPING SUMMARY ===');
    console.log(
      `📊 Total mappings processed: ${Object.keys(ITEM_NAME_MAPPING).length}`,
    );
    console.log(`✅ Items updated: ${updatedCount}`);
    console.log(`⚠️  Items already have price: ${alreadyHasPriceCount}`);
    console.log(`❌ Items not found: ${notFoundCount}`);
    console.log(
      `📈 Success rate: ${((updatedCount / Object.keys(ITEM_NAME_MAPPING).length) * 100).toFixed(1)}%`,
    );

    // Kiểm tra kết quả cuối cùng
    const finalItemsWithPrice = await wrItemModel.countDocuments({
      price: { $exists: true, $ne: null, $gt: 0 },
    });
    console.log(`🏆 Final items with price: ${finalItemsWithPrice}`);

    // In ra một số kết quả mẫu
    console.log('\n📋 Sample updated items:');
    results
      .filter((r) => r.status === 'updated')
      .slice(0, 10)
      .forEach((result) => {
        console.log(
          `  ✅ ${result.nameVi} (${result.nameEn}): ${result.price} gold`,
        );
      });

    if (results.filter((r) => r.status === 'en_not_found').length > 0) {
      console.log('\n❌ English items not found:');
      results
        .filter((r) => r.status === 'en_not_found')
        .slice(0, 10)
        .forEach((result) => {
          console.log(`  - ${result.nameVi} -> ${result.nameEn}`);
        });
    }

    if (results.filter((r) => r.status === 'already_has_price').length > 0) {
      console.log('\n⚠️  Items already have price:');
      results
        .filter((r) => r.status === 'already_has_price')
        .slice(0, 10)
        .forEach((result) => {
          console.log(
            `  - ${result.nameVi}: current=${result.currentPrice}, new=${result.newPrice}`,
          );
        });
    }
  } catch (error) {
    console.error('💥 Error during updating prices with mapping:', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch(console.error);
