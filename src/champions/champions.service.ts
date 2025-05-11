import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Champion, ChampionDocument } from './schemas/champion.schema';
import { RiotApiService } from '../common/services/riot-api.service';

@Injectable()
export class ChampionsService {
  constructor(
    @InjectModel(Champion.name) private championModel: Model<ChampionDocument>,
    private riotApiService: RiotApiService,
  ) {}

  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{
    data: Champion[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.championModel.find().skip(skip).limit(limit).lean(),
      this.championModel.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findById(id: string): Promise<Champion> {
    return this.championModel.findOne({ _id: id }).lean();
  }

  async findByName(name: string): Promise<Champion> {
    const nameRegex = new RegExp(name, 'i');
    return this.championModel.findOne({ name: nameRegex }).lean();
  }

  async syncFromRiotApi(): Promise<void> {
    // Get champion data from Riot API
    const lolApi = this.riotApiService.getLolApi();
    const championsData = await lolApi.DataDragon.getChampion();

    // Clear existing champions
    await this.championModel.deleteMany({});

    // Process and save champions data
    const champions = Object.values(championsData.data).map(
      (champData: any) => {
        const abilities = [];

        // Process abilities if available
        if (champData.spells && champData.spells.length) {
          champData.spells.forEach((spell) => {
            abilities.push({
              name: spell.name,
              description: spell.description,
              imageUrl: `http://ddragon.leagueoflegends.com/cdn/${championsData.version}/img/spell/${spell.image.full}`,
            });
          });
        }

        return {
          id: champData.id,
          name: champData.name,
          title: champData.title,
          imageUrl: `http://ddragon.leagueoflegends.com/cdn/${championsData.version}/img/champion/${champData.image.full}`,
          splashUrl: `http://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champData.id}_0.jpg`,
          stats: champData.stats,
          abilities: abilities,
          tags: champData.tags || [],
          counters: [],
          strongAgainst: [],
          recommendedRunes: [],
          recommendedItems: [],
        };
      },
    );

    // Save all champions to database
    await this.championModel.insertMany(champions);

    console.log(`Synced ${champions.length} champions to database`);
  }
}
