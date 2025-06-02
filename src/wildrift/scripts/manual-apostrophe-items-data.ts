import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';

async function addManualApostropheItemsData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const itemModel = app.get(getModelToken('WrItem'));

  try {
    console.log('📝 Adding manual data for apostrophe items...');

    // Manual data for items with apostrophes
    const itemsData = {
      "Archangel's Staff": {
        stats: {
          'Ability Power': '80',
          Mana: '650',
          'Ability Haste': '25',
        },
        description:
          'AWE: Gain Ability Power equal to 1% of maximum Mana. MANAFLOW: Damaging an enemy champion with an ability grants 3 maximum Mana, up to 360 bonus Mana. When you reach 360 bonus Mana from this effect, gain 40 Ability Power.',
      },
      "Athene's Unholy Grail": {
        stats: {
          'Ability Power': '40',
          'Magic Resist': '30',
          'Ability Haste': '20',
          'Base Mana Regen': '100%',
        },
        description:
          'DISSONANCE: Gain 5 Ability Power for every 25% Base Mana Regeneration. HARMONY: Healing or shielding another ally champion grants them 15-35 Ability Power for 2 seconds.',
      },
      "Bami's Cinder": {
        stats: {
          Health: '300',
        },
        description:
          'IMMOLATE: Deal 12 (+ 1 per champion level) magic damage per second to nearby enemies. Deal 50% bonus damage to minions and monsters.',
      },
      "Banshee's Veil": {
        stats: {
          'Ability Power': '80',
          'Magic Resist': '45',
          'Ability Haste': '10',
        },
        description:
          'ANNUL: Grants a spell shield that blocks the next enemy ability. This shield refreshes after no damage is taken from enemy champions for 40 seconds.',
      },
      "Berserker's Greaves": {
        stats: {
          'Attack Speed': '35%',
          'Movement Speed': '45',
        },
        description: 'Boots that enhance Attack Speed and Movement Speed.',
      },
      "Brawler's Gloves": {
        stats: {
          'Critical Strike Chance': '10%',
        },
        description:
          'Basic component item that provides Critical Strike Chance.',
      },
      "Dead Man's Plate": {
        stats: {
          Health: '300',
          Armor: '45',
        },
        description:
          'SHIPWRECKER: While moving, build up to 100 Momentum, granting up to 60 Movement Speed. At 100 stacks, your next basic attack discharges all Momentum to deal 40-90 bonus magic damage and slow by 50% for 1 second.',
      },
      "Death's Dance": {
        stats: {
          'Attack Damage': '55',
          Armor: '45',
          'Ability Haste': '15',
        },
        description:
          "IGNORE PAIN: Stores 35% of all post-mitigation physical and magic damage received, and is taken as true damage over 3 seconds instead. DEFY: Champion takedowns cleanse Ignore Pain's remaining damage pool and restore 15% of maximum Health over 2 seconds.",
      },
      "Giant's Belt": {
        stats: {
          Health: '380',
        },
        description: 'Basic component item that provides Health.',
      },
      "Jaurim's Fist": {
        stats: {
          Health: '200',
          'Attack Damage': '25',
        },
        description:
          'SQUEEZE: Gain 2 Health per enemy unit kill, up to 60 bonus Health. At maximum Health bonus, gain 15 Attack Damage.',
      },
      "Liandry's Torment": {
        stats: {
          'Ability Power': '90',
          Health: '300',
          'Ability Haste': '20',
        },
        description:
          "TORMENT: Dealing ability damage burns enemies for 60 (+ 6% AP) (+ 4% of target's current Health) magic damage over 3 seconds. Against champions, deal 12 (+ 1.2% AP) (+ 0.8% of target's current Health) magic damage per second instead.",
      },
      "Light - Youmuu's Ghostblade": {
        stats: {
          'Attack Damage': '60',
          Lethality: '15',
          'Ability Haste': '15',
        },
        description:
          'WRAITH STEP: Gain 20% Movement Speed for 6 seconds. Light enchantment provides additional benefits.',
      },
      "Lord Dominik's Regards": {
        stats: {
          'Attack Damage': '35',
          'Critical Strike Chance': '20%',
          'Armor Penetration': '35%',
        },
        description:
          'GIANT SLAYER: Deal 0% - 15% bonus physical damage to champions based on how much more Health they have than you.',
      },
      "Luden's Echo": {
        stats: {
          'Ability Power': '80',
          Mana: '600',
          'Ability Haste': '20',
        },
        description:
          'ECHO: Damaging an enemy with an ability hurls an orb at them that deals 100 (+ 10% AP) magic damage. This effect has an 8 second cooldown per target.',
      },
      "Mejai's Soulstealer": {
        stats: {
          'Ability Power': '20',
          'Movement Speed': '5%',
        },
        description:
          'GLORY: Gain 4 stacks for each champion takedown, up to 25 stacks total. Lose 10 stacks on death. Gain 5 Ability Power per stack (max 125). At 10+ stacks, gain 10% Movement Speed.',
      },
      "Mercury's Treads": {
        stats: {
          'Magic Resist': '25',
          'Movement Speed': '45',
          Tenacity: '30%',
        },
        description:
          'Boots that provide Magic Resistance, Movement Speed, and Tenacity.',
      },
      "Nashor's Talon": {
        stats: {
          'Attack Damage': '40',
          'Attack Speed': '50%',
          'Critical Strike Chance': '20%',
        },
        description:
          "Enhanced version of Nashor's Tooth with additional critical strike capabilities.",
      },
      "Nashor's Tooth": {
        stats: {
          'Ability Power': '80',
          'Attack Speed': '50%',
          'Ability Haste': '15',
        },
        description:
          'ICATHIAN BITE: Basic attacks deal 15 (+ 20% AP) bonus magic damage on-hit.',
      },
      "Oceanid's Trident": {
        stats: {
          'Ability Power': '80',
          Health: '300',
          'Ability Haste': '20',
        },
        description:
          'RIPTIDE: Abilities that slow or immobilize enemy champions deal bonus magic damage and reduce healing by 40% for 3 seconds.',
      },
      "Prophet's Pendant": {
        stats: {
          'Ability Power': '30',
          Mana: '300',
        },
        description:
          'Basic component item that provides Ability Power and Mana.',
      },
      "Protector's Vow": {
        stats: {
          Health: '400',
          Armor: '40',
          'Ability Haste': '20',
        },
        description:
          'PLEDGE: Bind to an ally champion. While near your Pledge target, redirect 20% of damage they take to you and gain 20% Movement Speed while moving toward them.',
      },
      "Randuin's Omen": {
        stats: {
          Health: '400',
          Armor: '60',
        },
        description:
          "HUMILITY: When struck by a critical strike, reduce the attacker's Attack Speed by 15% for 1.5 seconds. ACTIVE: Slow nearby enemies by 55% for 2 seconds (60 second cooldown).",
      },
      "Ruin - Rabadon's Deathcap": {
        stats: {
          'Ability Power': '120',
        },
        description:
          'MAGICAL OPUS: Increases Ability Power by 40%. Ruin enchantment provides additional dark magic benefits.',
      },
      "Ruin - Sterak's Gage": {
        stats: {
          Health: '400',
          'Attack Damage': '50',
        },
        description:
          'LIFELINE: Upon taking damage that would reduce Health below 30%, gain a shield equal to 75% of bonus Health for 3.5 seconds (90 second cooldown). Ruin enchantment enhances the effect.',
      },
      "Ruin - Warmog's Armor": {
        stats: {
          Health: '800',
          'Ability Haste': '10',
          'Health Regen': '200%',
        },
        description:
          "WARMOG'S HEART: If you have at least 1100 bonus Health, restore 3% of maximum Health every second if damage hasn't been taken in the last 6 seconds. Ruin enchantment provides additional benefits.",
      },
      "Runaan's Hurricane": {
        stats: {
          'Attack Damage': '40',
          'Attack Speed': '45%',
          'Critical Strike Chance': '20%',
        },
        description:
          "WIND'S FURY: When basic attacking, bolts are fired at up to 2 enemies near the target, each dealing 40% AD physical damage. Bolts can critically strike and apply on-hit effects.",
      },
      "Rylai's Crystal Scepter": {
        stats: {
          'Ability Power': '90',
          Health: '300',
        },
        description:
          'ICY: Damaging abilities slow enemies by 30% for 1 second.',
      },
      "Seeker's Armguard": {
        stats: {
          Armor: '15',
          'Ability Power': '20',
        },
        description:
          'HUNT: Gain 0.5 Armor and 0.3 Ability Power per enemy champion takedown, up to 15 Armor and 9 Ability Power.',
      },
      "Serpent's Fang": {
        stats: {
          'Attack Damage': '55',
          Lethality: '18',
          'Ability Haste': '10',
        },
        description:
          'SHIELD REAVER: Dealing damage to an enemy champion reduces any shields they gain by 50% for 3 seconds. When you damage an enemy who is not shielded, inflict 50% Grievous Wounds for 3 seconds instead.',
      },
      "Serylda's Grudge": {
        stats: {
          'Attack Damage': '45',
          'Ability Haste': '20',
          'Armor Penetration': '30%',
        },
        description:
          'BITTER COLD: Damaging abilities slow enemies by 30% for 1 second.',
      },
      "Spectre's Cowl": {
        stats: {
          Health: '250',
          'Magic Resist': '25',
        },
        description:
          'INCORPOREAL: After taking magic damage from an enemy champion, gain 15 Movement Speed and regenerate 150% Base Health Regeneration for 10 seconds.',
      },
      "Targon's Buckler": {
        stats: {
          Health: '50',
          'Health Regen': '25%',
        },
        description:
          'SPOILS OF WAR: Melee basic attacks execute minions below 50% Health. Killing a minion by any means heals the nearest allied champion for 15 Health and grants them kill gold. These effects require a nearby ally and have a 20 second cooldown per charge, up to 3 charges.',
      },
      "Warden's Mail": {
        stats: {
          Armor: '40',
        },
        description:
          'ROCK SOLID: Reduce incoming damage from basic attacks by 5 (+ 3.5 per 1000 maximum Health).',
      },
      "Winter's Approach": {
        stats: {
          Health: '400',
          Mana: '500',
          'Ability Haste': '15',
        },
        description:
          'AWE: Gain bonus Health equal to 8% of current Mana. MANAFLOW: Damaging an enemy champion with an ability grants 6 maximum Mana, up to 360 bonus Mana.',
      },
      "Wit's End": {
        stats: {
          'Attack Damage': '40',
          'Attack Speed': '40%',
          'Magic Resist': '40',
        },
        description:
          'FRAY: Basic attacks deal 15-80 magic damage on-hit and steal 5 Magic Resistance from the target for 5 seconds, up to 25 Magic Resistance.',
      },
      "Zeke's Convergence": {
        stats: {
          Health: '250',
          Armor: '30',
          'Magic Resist': '30',
          'Ability Haste': '20',
        },
        description:
          'CONDUIT: Bind to an ally champion at the start of combat. When you cast your ultimate near your Conduit, you and your Conduit gain 20% Attack Speed and your basic attacks burn enemies for magic damage for 10 seconds.',
      },
    };

    let updatedCount = 0;

    for (const [itemName, itemData] of Object.entries(itemsData)) {
      try {
        const item = await itemModel.findOne({
          name: {
            $regex: new RegExp(
              `^${itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
              'i',
            ),
          },
        });

        if (item) {
          const updateData = {
            stats: itemData.stats,
            description: itemData.description,
          };

          await itemModel.findByIdAndUpdate(item._id, updateData);
          console.log(
            `✅ Updated ${item.name} with ${Object.keys(itemData.stats).length} stats and description`,
          );
          updatedCount++;
        } else {
          console.log(`⚠️ Item not found: ${itemName}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${itemName}:`, error.message);
      }
    }

    console.log('\n📊 MANUAL UPDATE SUMMARY:');
    console.log(
      `✅ Items updated: ${updatedCount}/${Object.keys(itemsData).length}`,
    );
    console.log(
      `📈 Success rate: ${((updatedCount / Object.keys(itemsData).length) * 100).toFixed(1)}%`,
    );

    // Check final status
    const finalCheck = await itemModel
      .find({
        name: { $regex: /'/ },
      })
      .select('name stats description')
      .lean();

    const completeItems = finalCheck.filter(
      (item) =>
        item.stats &&
        Object.keys(item.stats).length > 0 &&
        item.description &&
        item.description !== 'Physical item' &&
        item.description.length > 10,
    );

    console.log('\n🎉 FINAL STATUS:');
    console.log(`Total apostrophe items: ${finalCheck.length}`);
    console.log(
      `Items with complete details: ${completeItems.length} (${((completeItems.length / finalCheck.length) * 100).toFixed(1)}%)`,
    );

    if (completeItems.length > 0) {
      console.log('\n✅ Items now with complete details:');
      completeItems.slice(0, 10).forEach((item) => {
        console.log(
          `   ${item.name} - ${Object.keys(item.stats).length} stats`,
        );
      });

      if (completeItems.length > 10) {
        console.log(`   ... and ${completeItems.length - 10} more items`);
      }
    }
  } catch (error) {
    console.error('❌ Error adding manual data:', error);
  } finally {
    await app.close();
  }
}

addManualApostropheItemsData();
