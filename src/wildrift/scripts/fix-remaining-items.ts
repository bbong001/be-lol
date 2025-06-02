import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';

async function fixRemainingItems() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    console.log('🔧 Fixing remaining items with apostrophes and prefixes...');

    // Additional prices for remaining items
    const additionalPrices = {
      // Items with apostrophes that were missed
      "Oceanid's Trident": 3000,
      "Lord Dominik's Regards": 3000,
      "Serpent's Fang": 2600,
      "Wit's End": 2800,
      "Serylda's Grudge": 3200,
      "Death's Dance": 3300,
      "Sterak's Gage": 3200,
      "Rabadon's Deathcap": 3600,
      "Youmuu's Ghostblade": 2900,
      "Warmog's Armor": 2850,

      // Items with prefixes
      "Light - Youmuu's Ghostblade": 2900,
      "Ruin - Sterak's Gage": 3200,
      "Ruin - Rabadon's Deathcap": 3600,
      "Ruin - Warmog's Armor": 2850,
      "Nashor's Talon": 3000,

      // Support items
      'Talisman of Ascension': 2200,
      'Black Mist Scythe': 2300,
      'Harrowing Crescent': 1800,
      'Bulwark of the Mountain': 2200,

      // Other missing items
      'Umbral Glaive': 2400,
      'Duskblade of Draktharr': 3100,
      'Hextech Megadrive': 2700,
    };

    let updatedCount = 0;

    // Update items with fuzzy matching for apostrophes and prefixes
    for (const [itemName, correctPrice] of Object.entries(additionalPrices)) {
      try {
        // Try exact match first
        let item = await itemModel.findOne({
          name: {
            $regex: new RegExp(
              `^${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
              'i',
            ),
          },
        });

        // If not found, try without prefix
        if (
          !item &&
          (itemName.includes('Light -') || itemName.includes('Ruin -'))
        ) {
          const nameWithoutPrefix = itemName.replace(/^(Light|Ruin) - /, '');
          item = await itemModel.findOne({
            name: {
              $regex: new RegExp(
                nameWithoutPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
                'i',
              ),
            },
          });
        }

        // If still not found, try fuzzy search
        if (!item) {
          const searchName = itemName
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          item = await itemModel.findOne({
            name: { $regex: new RegExp(searchName.split(' ').join('.*'), 'i') },
          });
        }

        if (item) {
          const needsUpdate =
            !item.price || item.price === 0 || item.price > 10000;

          if (needsUpdate) {
            await itemModel.findByIdAndUpdate(item._id, {
              price: correctPrice,
            });
            console.log(`✅ Updated: ${item.name} → ${correctPrice} gold`);
            updatedCount++;
          } else {
            console.log(`ℹ️ ${item.name}: already has price (${item.price})`);
          }
        } else {
          console.log(`⚠️ Item not found: ${itemName}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${itemName}:`, error.message);
      }
    }

    // Check for any remaining items with wrong prices
    const stillWrongPrices = await itemModel
      .find({
        price: { $gt: 10000 },
      })
      .select('name price')
      .lean();

    if (stillWrongPrices.length > 0) {
      console.log('\n🚨 Items still with wrong prices:');
      for (const item of stillWrongPrices) {
        console.log(`   ${item.name}: ${item.price} gold`);

        // Try to extract the correct price from the wrong price
        const priceStr = item.price.toString();
        let correctPrice = 0;

        // The pattern seems to be: 32322020103000 where the last 4 digits are the real price
        if (priceStr.length > 10) {
          const lastFourDigits = priceStr.slice(-4);
          correctPrice = parseInt(lastFourDigits);

          if (correctPrice >= 1000 && correctPrice <= 5000) {
            await itemModel.findByIdAndUpdate(item._id, {
              price: correctPrice,
            });
            console.log(
              `   🔧 Auto-fixed: ${item.name}: ${item.price} → ${correctPrice}`,
            );
            updatedCount++;
          }
        }
      }
    }

    // Final summary
    const finalNoPriceItems = await itemModel
      .find({
        $or: [{ price: { $exists: false } }, { price: 0 }, { price: null }],
      })
      .select('name category')
      .lean();

    const finalWrongPriceItems = await itemModel
      .find({
        price: { $gt: 10000 },
      })
      .select('name price')
      .lean();

    console.log('\n📊 Final Summary:');
    console.log(`✅ Additional items updated: ${updatedCount}`);
    console.log(`❌ Items still without price: ${finalNoPriceItems.length}`);
    console.log(
      `⚠️ Items still with wrong price: ${finalWrongPriceItems.length}`,
    );

    if (finalNoPriceItems.length > 0) {
      console.log('\n📋 Remaining items without price:');
      finalNoPriceItems.forEach((item) => {
        console.log(`   ${item.name} (${item.category || 'Unknown'})`);
      });
    }
  } catch (error) {
    console.error('❌ Error fixing remaining items:', error);
  } finally {
    await app.close();
  }
}

fixRemainingItems();
