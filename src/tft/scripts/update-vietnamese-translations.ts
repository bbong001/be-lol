import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TftItem } from '../schemas/tft-item.schema';

// Vietnamese translations mapping
const VIETNAMESE_TRANSLATIONS = {
  // Basic items
  'B.F. Sword': 'Kiếm B.F.',
  'Chain Vest': 'Áo Giáp Xích',
  "Giant's Belt": 'Đai Khổng Lồ',
  'Needlessly Large Rod': 'Gậy Ma Thuật Lớn',
  'Recurve Bow': 'Cung Cong',
  'Sparring Gloves': 'Găng Tay Đấu',
  Spatula: 'Thìa Múc',
  'Tear of the Goddess': 'Nước Mắt Nữ Thần',

  // Completed items
  "Archangel's Staff": 'Gậy Tổng Lãnh Thiên Thần',
  Bloodthirster: 'Kiếm Hút Máu',
  'Blue Buff': 'Buff Xanh',
  Deathblade: 'Lưỡi Tử Thần',
  'Edge of Night': 'Bóng Đêm',
  'Gargoyle Stoneplate': 'Giáp Đá Gargoyle',
  Guardbreaker: 'Phá Giáp',
  "Guinsoo's Rageblade": 'Lưỡi Phẫn Nộ Guinsoo',
  'Hand of Justice': 'Bàn Tay Công Lý',
  'Hextech Gunblade': 'Kiếm Súng Hextech',
  'Hyper Fangs': 'Răng Nanh Siêu Cấp',
  'Infinity Edge': 'Lưỡi Vô Cực',
  'Jeweled Gauntlet': 'Găng Tay Ngọc',
  'Last Whisper': 'Lời Thì Thầm Cuối',
  Morellonomicon: 'Morellonomicon',
  "Nashor's Tooth": 'Răng Nashor',
  'Pulse Stabilizer': 'Bộ Ổn Định Xung',
  Quicksilver: 'Thủy Ngân',
  "Rabadon's Deathcap": 'Mũ Tử Thần Rabadon',
  'Red Buff': 'Buff Đỏ',
  "Runaan's Hurricane": 'Cơn Bão Runaan',
  'Spear of Shojin': 'Giáo Shojin',
  'Statikk Shiv': 'Kiếm Sét Statikk',
  "Sterak's Gage": 'Găng Tay Sterak',
  'Sunfire Cape': 'Áo Choàng Lửa Mặt Trời',
  "Titan's Resolve": 'Ý Chí Titan',
  "Warmog's Armor": 'Giáp Warmog',
  'Flux Capacitor': 'Tụ Điện Từ Thông',

  // Set 14 specific items
  'Set 14': 'Phiên Bản 14',
};

async function updateVietnameseTranslations() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const tftItemModel = app.get<Model<TftItem>>(getModelToken(TftItem.name));

    console.log('🇻🇳 Starting Vietnamese Translations Update');
    console.log('='.repeat(60));

    let updated = 0;
    let notFound = 0;
    let alreadyTranslated = 0;

    // Get all items
    const allItems = await tftItemModel.find({}).lean();
    console.log(`📊 Total items to check: ${allItems.length}`);

    for (const item of allItems) {
      try {
        const englishName = item.name?.en;
        const vietnameseName = item.name?.vi;

        if (!englishName) {
          console.log(`⚠️  Item ${item._id} has no English name`);
          continue;
        }

        // Check if already has different Vietnamese translation
        if (vietnameseName && vietnameseName !== englishName) {
          console.log(
            `⏭️  Item "${englishName}" already has Vietnamese translation: "${vietnameseName}"`,
          );
          alreadyTranslated++;
          continue;
        }

        // Check if we have translation for this item
        const vietnameseTranslation = VIETNAMESE_TRANSLATIONS[englishName];

        if (vietnameseTranslation) {
          // Update the item
          await tftItemModel.updateOne(
            { _id: item._id },
            {
              $set: {
                'name.vi': vietnameseTranslation,
              },
            },
          );

          console.log(
            `✅ Updated: "${englishName}" → "${vietnameseTranslation}"`,
          );
          updated++;
        } else {
          console.log(`❓ No translation found for: "${englishName}"`);
          notFound++;
        }
      } catch (error) {
        console.error(`❌ Error updating item ${item._id}:`, error.message);
      }
    }

    // Summary
    console.log('\n🎉 TRANSLATION UPDATE SUMMARY');
    console.log('='.repeat(40));
    console.log(`✅ Successfully updated: ${updated} items`);
    console.log(`⏭️  Already translated: ${alreadyTranslated} items`);
    console.log(`❓ No translation found: ${notFound} items`);
    console.log(`📊 Total processed: ${allItems.length} items`);

    // Show sample updated items
    if (updated > 0) {
      console.log('\n📝 SAMPLE UPDATED ITEMS');
      console.log('='.repeat(30));

      const updatedItems = await tftItemModel
        .find({
          $expr: {
            $ne: ['$name.en', '$name.vi'],
          },
        })
        .limit(5)
        .lean();

      updatedItems.forEach((item, index) => {
        console.log(
          `${index + 1}. EN: "${item.name.en}" → VI: "${item.name.vi}"`,
        );
      });
    }

    // List items that still need translation
    if (notFound > 0) {
      console.log('\n📋 ITEMS STILL NEEDING TRANSLATION');
      console.log('='.repeat(35));

      const itemsNeedingTranslation = await tftItemModel
        .find({
          $expr: {
            $eq: ['$name.en', '$name.vi'],
          },
        })
        .limit(10)
        .lean();

      itemsNeedingTranslation.forEach((item, index) => {
        console.log(`${index + 1}. "${item.name.en}"`);
      });

      if (itemsNeedingTranslation.length === 10 && notFound > 10) {
        console.log(`... and ${notFound - 10} more items`);
      }
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('- Test the API with Vietnamese language parameter');
    console.log('- Add more translations to VIETNAMESE_TRANSLATIONS mapping');
    console.log('- Consider using translation API for remaining items');
  } catch (error) {
    console.error('❌ Translation update failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

// Run the translation update
updateVietnameseTranslations();
