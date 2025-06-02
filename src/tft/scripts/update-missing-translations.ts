import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TftChampion } from '../schemas/tft-champion.schema';

class TftTranslationUpdater {
  constructor(private readonly tftChampionModel: Model<TftChampion>) {}

  /**
   * Enhanced Vietnamese trait mapping
   */
  private getVietnameseTraitMapping(): Record<string, string> {
    return {
      // Set 14 TFT traits
      Rebel: 'Kẻ Nổi Loạn',
      Marksman: 'Xạ Thủ',
      Sorcerer: 'Phù Thủy',
      Brawler: 'Võ Sĩ',
      Bruiser: 'Võ Sĩ',
      Infiltrator: 'Ám Sát',
      Support: 'Hỗ Trợ',
      Mystic: 'Huyền Thuật',
      Protector: 'Bảo Vệ',
      Blademaster: 'Kiếm Sĩ',
      Vanguard: 'Tiền Phong',
      Demolitionist: 'Phá Hủy',
      Cybernetic: 'Điện Tử',
      Void: 'Hư Không',
      'Dark Star': 'Ngôi Sao Đen',
      'Mech-Pilot': 'Phi Công Robot',
      Chrono: 'Thời Gian',
      Battlecast: 'Chiến Thuật',
      Astro: 'Phi Hành Gia',
      Sniper: 'Bắn Tỉa',

      // Set 14 current traits from analysis
      'Golden Ox': 'Bò Vàng',
      'A.M.P.': 'A.M.P.',
      'Anima Squad': 'Đội Linh Hồn',
      Bastion: 'Pháo Đài',
      BoomBots: 'Robot Nổ',
      Cyberboss: 'Ông Chủ Mạng',
      Cypher: 'Mật Mã',
      Divinicorp: 'Tập Đoàn Thần Thánh',
      Dynamo: 'Máy Phát Điện',
      Executioner: 'Đao Phủ',
      Exotech: 'Công Nghệ Ngoại',
      'God of the Net': 'Thần Mạng',
      Nitro: 'Nitro',
      Overlord: 'Bá Chủ',
      Rapidfire: 'Bắn Nhanh',
      Slayer: 'Sát Thủ',
      'Soul Killer': 'Giết Linh Hồn',
      Strategist: 'Chiến Lược Gia',
      'Street Demon': 'Quỷ Đường Phố',
      Syndicate: 'Tổ Chức',
      Techie: 'Kỹ Thuật Viên',
      Virus: 'Vi-rút',

      // Additional common traits
      Sentinel: 'Lính Canh',
      Invoker: 'Triệu Hồi Sư',
      Academy: 'Học Viện',
      Challenger: 'Thách Đấu',
      Colossus: 'Khổng Lồ',
      Dominator: 'Thống Trị',
      Emissary: 'Sứ Giả',
      Family: 'Gia Đình',
      Form: 'Hình Thái',
      Frost: 'Băng Giá',
      Honeymancy: 'Thuật Mật Ong',
      Multistriker: 'Đa Đòn',
      Portal: 'Cổng Thời Gian',
      Preserver: 'Bảo Tồn',
      Pyro: 'Hỏa Thuật',
      Quickstriker: 'Đòn Nhanh',
      Scholar: 'Học Giả',
      Shapeshifter: 'Biến Hình',
      Sugarcraft: 'Thủ Công Đường',
      Visionary: 'Viễn Kiến',
      Warrior: 'Chiến Binh',
      Witchcraft: 'Phù Thủy',
    };
  }

  /**
   * Get Vietnamese translation for trait
   */
  private getVietnameseTrait(englishTrait: string): string {
    const mapping = this.getVietnameseTraitMapping();
    return mapping[englishTrait] || englishTrait;
  }

  /**
   * Update missing Vietnamese translations for traits
   */
  async updateMissingTranslations() {
    console.log('🔄 Updating missing Vietnamese translations...');

    const champions = await this.tftChampionModel.find().lean();
    let updated = 0;
    let noChangeNeeded = 0;

    for (const champion of champions) {
      try {
        const championData = champion as any;
        let needsUpdate = false;
        const updateData: any = {};

        // Check and update traits
        if (championData.traits && Array.isArray(championData.traits)) {
          const updatedTraits = championData.traits.map((trait: any) => {
            if (typeof trait === 'object' && trait.en) {
              const newViTrait = this.getVietnameseTrait(trait.en);
              if (trait.vi !== newViTrait) {
                needsUpdate = true;
                return {
                  en: trait.en,
                  vi: newViTrait,
                };
              }
              return trait;
            }
            return trait;
          });

          if (needsUpdate) {
            updateData.traits = updatedTraits;
          }
        }

        // Check and update ability name if needed
        if (championData.ability && championData.ability.name) {
          const abilityName = championData.ability.name;
          if (
            typeof abilityName === 'object' &&
            abilityName.en &&
            abilityName.vi
          ) {
            // If Vietnamese ability name looks like a placeholder, update it
            if (
              abilityName.vi.includes('Kỹ Năng') &&
              abilityName.vi.includes(' - ')
            ) {
              needsUpdate = true;
              updateData.ability = {
                ...championData.ability,
                name: {
                  en: abilityName.en,
                  vi: abilityName.en, // Use English name as Vietnamese for now
                },
              };
            }
          }
        }

        if (needsUpdate) {
          await this.tftChampionModel.updateOne(
            { _id: championData._id },
            { $set: updateData },
          );

          const champName =
            typeof championData.name === 'string'
              ? championData.name
              : championData.name?.en || 'Unknown';

          console.log(`✅ Updated ${champName}`);
          updated++;
        } else {
          noChangeNeeded++;
        }
      } catch (error) {
        const champName =
          typeof champion.name === 'string'
            ? champion.name
            : champion.name?.en || 'Unknown';

        console.error(`❌ Error updating ${champName}:`, error.message);
      }
    }

    console.log(`\n📊 Update Summary:`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  No change needed: ${noChangeNeeded}`);
    console.log(`📝 Total processed: ${champions.length}`);
  }

  /**
   * List all unique traits to check translations
   */
  async listAllTraits() {
    console.log('📋 Listing all unique traits...');

    const champions = await this.tftChampionModel.find().lean();
    const allTraits = new Set<string>();

    champions.forEach((champion: any) => {
      if (champion.traits && Array.isArray(champion.traits)) {
        champion.traits.forEach((trait: any) => {
          if (typeof trait === 'object' && trait.en) {
            allTraits.add(trait.en);
          } else if (typeof trait === 'string') {
            allTraits.add(trait);
          }
        });
      }
    });

    console.log('\n🏷️  All traits found:');
    Array.from(allTraits)
      .sort()
      .forEach((trait) => {
        const viTrait = this.getVietnameseTrait(trait);
        const hasTranslation = viTrait !== trait;
        console.log(
          `- ${trait} ${hasTranslation ? '✅' : '❌'} ${hasTranslation ? `→ ${viTrait}` : '(No translation)'}`,
        );
      });

    return allTraits;
  }
}

async function runTranslationUpdate() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const tftChampionModel = app.get<Model<TftChampion>>(
      getModelToken(TftChampion.name),
    );
    const updater = new TftTranslationUpdater(tftChampionModel);

    console.log('🚀 TFT Translation Update Tool');
    console.log('===============================');

    // 1. List all traits first
    await updater.listAllTraits();

    // 2. Update missing translations
    await updater.updateMissingTranslations();

    console.log('\n🎉 Translation update completed!');
  } catch (error) {
    console.error('❌ Translation update failed:', error.message);
    console.error(error.stack);
  } finally {
    await app.close();
  }
}

// Run the update
runTranslationUpdate();
