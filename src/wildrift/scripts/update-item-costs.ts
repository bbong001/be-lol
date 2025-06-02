import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';

async function updateItemCosts() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    console.log('🔧 Updating Wild Rift item costs with correct values...');

    // Known item costs from the website
    const itemCosts = [
      { name: 'Chempunk Chainsword', cost: 2800 },
      { name: 'Blade of the Ruined King', cost: 3000 },
      { name: 'Ruin - Blade of the Ruined King', cost: 3000 },
      { name: 'Infinity Edge', cost: 3200 },
      { name: 'Ruin - Infinity Edge', cost: 3200 },
      { name: 'Guardian Angel', cost: 3400 },
      { name: 'Mortal Reminder', cost: 3300 },
      { name: 'Phantom Dancer', cost: 3000 },
      { name: "Nashor's Tooth", cost: 3000 },
      { name: "Rabadon's Deathcap", cost: 3600 },
      { name: 'Void Staff', cost: 2800 },
      { name: 'Mercurial', cost: 3400 },
      { name: 'Trinity Force', cost: 3333 },
      { name: 'Black Cleaver', cost: 3100 },
      { name: 'Bloodthirster', cost: 3500 },
      { name: "Runaan's Hurricane", cost: 2800 },
      { name: 'Statikk Shiv', cost: 2600 },
      { name: 'Rapid Firecannon', cost: 2600 },
      { name: "Liandry's Torment", cost: 3200 },
      { name: "Luden's Echo", cost: 3200 },
      { name: "Archangel's Staff", cost: 3000 },
      { name: 'Rod of Ages', cost: 2800 },
      { name: 'Lich Bane', cost: 3200 },
      { name: 'Hextech Gunblade', cost: 3400 },
    ];

    let updatedCount = 0;
    let notFoundCount = 0;

    for (const { name, cost } of itemCosts) {
      try {
        // Try exact match first
        let item = await itemModel.findOne({
          name: { $regex: new RegExp(`^${name}$`, 'i') },
        });

        // If not found, try fuzzy search
        if (!item) {
          item = await itemModel.findOne({
            name: {
              $regex: new RegExp(name.replace(/[^a-zA-Z0-9\s]/g, ''), 'i'),
            },
          });
        }

        if (item) {
          // Only update if current price is 0 or way off
          if (!item.price || item.price === 0 || item.price > 10000) {
            await itemModel.findByIdAndUpdate(item._id, { price: cost });
            console.log(`✅ Updated ${item.name}: ${cost} gold`);
            updatedCount++;
          } else {
            console.log(
              `ℹ️ ${item.name}: already has reasonable price (${item.price})`,
            );
          }
        } else {
          console.log(`⚠️ Item not found: ${name}`);
          notFoundCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating ${name}:`, error.message);
      }
    }

    console.log('\n🎉 Cost update completed!');
    console.log(
      `📈 Results: ${updatedCount} items updated, ${notFoundCount} not found`,
    );

    // Show some updated items
    console.log('\n📋 Checking some updated items:');
    const sampleItems = await itemModel
      .find({
        name: {
          $in: [
            'Chempunk Chainsword',
            'Blade of the Ruined King',
            'Infinity Edge',
          ],
        },
      })
      .select('name price stats description');

    sampleItems.forEach((item) => {
      console.log(`   ${item.name}: ${item.price} gold`);
    });
  } catch (error) {
    console.error('❌ Error updating item costs:', error);
  } finally {
    await app.close();
  }
}

updateItemCosts();
