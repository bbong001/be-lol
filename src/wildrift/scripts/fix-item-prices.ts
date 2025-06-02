import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';

async function fixItemPrices() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    console.log('🔍 Analyzing item prices and fixing issues...');

    // Get all items from database
    const allItems = await itemModel.find({}).lean();
    console.log(`📊 Total items in database: ${allItems.length}`);

    // Analyze price issues
    const noPriceItems = allItems.filter(
      (item) => !item.price || item.price === 0,
    );
    const wrongPriceItems = allItems.filter(
      (item) => item.price && item.price > 10000,
    );
    const apostropheItems = allItems.filter((item) => item.name.includes("'"));

    console.log('\n📋 Price Analysis:');
    console.log(`❌ Items with no price (0 or null): ${noPriceItems.length}`);
    console.log(
      `⚠️ Items with wrong price (>10000): ${wrongPriceItems.length}`,
    );
    console.log(`📝 Items with apostrophe in name: ${apostropheItems.length}`);

    // Show items with wrong prices
    if (wrongPriceItems.length > 0) {
      console.log('\n🚨 Items with incorrect prices:');
      wrongPriceItems.forEach((item) => {
        console.log(`   ${item.name}: ${item.price} gold`);
      });
    }

    // Show items with apostrophes that might need price updates
    console.log('\n📝 Items with apostrophes in name:');
    apostropheItems.slice(0, 10).forEach((item) => {
      console.log(`   ${item.name}: ${item.price || 0} gold`);
    });

    // Known correct prices for items (including apostrophe items)
    const correctPrices = {
      // Items with apostrophes
      "Nashor's Tooth": 3000,
      "Rabadon's Deathcap": 3600,
      "Runaan's Hurricane": 2800,
      "Liandry's Torment": 3200,
      "Luden's Echo": 3200,
      "Archangel's Staff": 3000,
      "Rylai's Crystal Scepter": 2700,
      "Mejai's Soulstealer": 1800,
      "Banshee's Veil": 3000,
      "Athene's Unholy Grail": 2500,
      'Hextech Gunblade': 3400,
      "Warmog's Armor": 2850,
      "Randuin's Omen": 2800,
      "Dead Man's Plate": 2800,
      "Winter's Approach": 2600,
      "Protector's Vow": 2700,
      "Zeke's Convergence": 2800,
      "Berserker's Greaves": 1400,
      "Mercury's Treads": 1350,
      "Brawler's Gloves": 500,
      "Seeker's Armguard": 1200,
      "Targon's Buckler": 800,
      "Prophet's Pendant": 1000,
      'Void Amethyst': 1200,
      'Hextech Revolver': 1100,
      "Jaurim's Fist": 1200,
      "Warden's Mail": 1050,
      "Giant's Belt": 1000,
      "Spectre's Cowl": 1100,
      "Bami's Cinder": 1300,

      // Items with wrong parsed prices
      'Crown of the Shattered Queen': 3000,
      'Cosmic Drive': 2800,
      'Crystalline Reflector': 3000,
      'Amaranth Twinguard': 3200,
      'Mantle of the Twelfth Hour': 2900,
      Dawnshroud: 3000,
      'Hextech Megadrive': 2700,
      'Force Of Nature': 2850,
      'Frozen Mallet': 3000,
      'Ionian Boots of Lucidity': 1400,
      'Gluttonous Greaves': 1400,
      'Magnetron Enchant': 1800,
      'Shadows Enchant': 1500,
      'Redeeming Enchant': 1500,
    };

    let updatedCount = 0;
    let fixedWrongPrices = 0;

    // Update items with correct prices
    for (const [itemName, correctPrice] of Object.entries(correctPrices)) {
      try {
        // Try exact match first
        let item = await itemModel.findOne({
          name: { $regex: new RegExp(`^${itemName}$`, 'i') },
        });

        // If not found, try fuzzy search
        if (!item) {
          const searchName = itemName.replace(/[^a-zA-Z0-9\s]/g, '');
          item = await itemModel.findOne({
            name: { $regex: new RegExp(searchName, 'i') },
          });
        }

        if (item) {
          const needsUpdate =
            !item.price || item.price === 0 || item.price > 10000;

          if (needsUpdate) {
            await itemModel.findByIdAndUpdate(item._id, {
              price: correctPrice,
            });

            if (item.price > 10000) {
              console.log(
                `🔧 Fixed wrong price: ${item.name}: ${item.price} → ${correctPrice}`,
              );
              fixedWrongPrices++;
            } else {
              console.log(
                `✅ Updated price: ${item.name}: ${correctPrice} gold`,
              );
            }
            updatedCount++;
          } else {
            console.log(
              `ℹ️ ${item.name}: already has correct price (${item.price})`,
            );
          }
        } else {
          console.log(`⚠️ Item not found: ${itemName}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${itemName}:`, error.message);
      }
    }

    // Check for remaining items with no price
    const remainingNoPriceItems = await itemModel
      .find({
        $or: [{ price: { $exists: false } }, { price: 0 }, { price: null }],
      })
      .select('name price category')
      .lean();

    console.log('\n📊 Summary:');
    console.log(`✅ Updated prices: ${updatedCount} items`);
    console.log(`🔧 Fixed wrong prices: ${fixedWrongPrices} items`);
    console.log(
      `❌ Remaining items without price: ${remainingNoPriceItems.length}`,
    );

    if (remainingNoPriceItems.length > 0) {
      console.log('\n📋 Items still without price:');
      remainingNoPriceItems.slice(0, 15).forEach((item) => {
        console.log(`   ${item.name} (${item.category || 'Unknown'})`);
      });

      if (remainingNoPriceItems.length > 15) {
        console.log(
          `   ... and ${remainingNoPriceItems.length - 15} more items`,
        );
      }
    }

    // Check items with apostrophes that still have price issues
    const apostropheItemsWithIssues = await itemModel
      .find({
        name: { $regex: /'/ },
        $or: [
          { price: { $exists: false } },
          { price: 0 },
          { price: { $gt: 10000 } },
        ],
      })
      .select('name price')
      .lean();

    if (apostropheItemsWithIssues.length > 0) {
      console.log('\n📝 Apostrophe items still with price issues:');
      apostropheItemsWithIssues.forEach((item) => {
        console.log(`   ${item.name}: ${item.price || 0} gold`);
      });
    }
  } catch (error) {
    console.error('❌ Error fixing item prices:', error);
  } finally {
    await app.close();
  }
}

fixItemPrices();
