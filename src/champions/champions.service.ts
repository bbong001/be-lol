import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Champion, ChampionDocument } from './schemas/champion.schema';
import { RiotApiService } from '../common/services/riot-api.service';
import { ChampionBuildCrawlerService } from './services/champion-build-crawler.service';
import axios from 'axios';

@Injectable()
export class ChampionsService {
  private readonly champions = {};
  private readonly version = '15.9.1';

  constructor(
    @InjectModel(Champion.name) private championModel: Model<ChampionDocument>,
    private riotApiService: RiotApiService,
    private championBuildCrawlerService: ChampionBuildCrawlerService,
  ) {
    // Load champions data on service initialization
    this.loadChampionsData();
  }

  // Load all champion names to enable search
  private async loadChampionsData() {
    try {
      const response = await axios.get(
        `https://ddragon.leagueoflegends.com/cdn/${this.version}/data/vi_VN/champion.json`,
      );
      if (response.data && response.data.data) {
        this.champions['data'] = response.data.data;
      }
    } catch (error) {
      console.error('Error loading champions data:', error.message);
    }
  }

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
    return this.championModel
      .findOne({
        $or: [{ name: nameRegex }, { id: nameRegex }],
      })
      .lean();
  }

  // Find champions by name pattern and get detailed data from Data Dragon
  async findDetailsByName(name: string): Promise<any> {
    if (!this.champions['data']) {
      await this.loadChampionsData();
    }

    if (!this.champions['data']) {
      throw new NotFoundException('Champions data not loaded');
    }

    const namePattern = new RegExp(name, 'i');
    const matchedChampions = Object.values(this.champions['data']).filter(
      (champ: any) => namePattern.test(champ.name),
    );

    if (!matchedChampions.length) {
      throw new NotFoundException(`No champions found matching '${name}'`);
    }

    // Get detailed data for each matched champion
    const championsDetails = await Promise.all(
      matchedChampions.map(async (champ: any) => {
        try {
          // Get champion data from Data Dragon
          const response = await axios.get(
            `https://ddragon.leagueoflegends.com/cdn/${this.version}/data/vi_VN/champion/${champ.id}.json`,
          );

          // Check if we have build data in the database
          const championFromDB = await this.championModel
            .findOne({ id: champ.id })
            .lean();

          // Combine data from Data Dragon with build data
          const championData = response.data;
          if (championFromDB) {
            // Add build data from database if available
            if (
              championFromDB.recommendedRunes &&
              championFromDB.recommendedRunes.length > 0
            ) {
              championData.buildData = {
                runes: championFromDB.recommendedRunes,
                items: championFromDB.recommendedItems,
                counters: championFromDB.counters || [],
                strongAgainst: championFromDB.strongAgainst || [],
              };
            }
          }

          return championData;
        } catch (error) {
          console.error(`Error fetching data for ${champ.id}:`, error.message);
          return { error: `Could not fetch data for ${champ.name}` };
        }
      }),
    );

    return {
      results: matchedChampions.length,
      champions: championsDetails,
    };
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

    // Reload champions data
    await this.loadChampionsData();
  }

  /**
   * Get champion build items from op.gg
   * @param championName Name of the champion
   * @returns Champion build data
   */
  async getChampionBuild(championName: string): Promise<any> {
    try {
      // Validate if champion exists
      if (!this.champions['data']) {
        await this.loadChampionsData();
      }

      // Find champion by name
      const namePattern = new RegExp(championName, 'i');
      const matchedChampions = Object.values(this.champions['data']).filter(
        (champ: any) => namePattern.test(champ.name),
      );

      if (!matchedChampions.length) {
        throw new NotFoundException(
          `No champions found matching '${championName}'`,
        );
      }

      // Type casting to avoid TypeScript errors
      const champion = matchedChampions[0] as { id: string; name: string };

      // Fetch build data from op.gg
      const buildData =
        await this.championBuildCrawlerService.crawlChampionBuild(champion.id);

      // Update champion in the database with build information
      await this.championModel.updateOne(
        { id: champion.id },
        {
          $set: {
            recommendedRunes: buildData.runes,
            recommendedItems: buildData.items,
          },
        },
      );

      return {
        champion: {
          id: champion.id,
          name: champion.name,
        },
        buildData,
      };
    } catch (error) {
      throw new Error(`Error fetching champion build: ${error.message}`);
    }
  }

  /**
   * Update recommended builds for all champions
   */
  async updateAllChampionBuilds(): Promise<any> {
    try {
      // Get all champions
      const champions = await this.championModel.find().lean();

      const results = [];

      // Update builds one by one to avoid rate limiting
      for (const champion of champions) {
        try {
          const buildData = await this.getChampionBuild(champion.name);
          results.push({
            champion: buildData.name,
            status: 'success',
          });
        } catch (error) {
          results.push({
            champion: champion.name,
            status: 'error',
            message: error.message,
          });
        }

        // Wait a bit between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return {
        total: champions.length,
        updated: results.filter((r) => r.status === 'success').length,
        failed: results.filter((r) => r.status === 'error').length,
        results,
      };
    } catch (error) {
      throw new Error(`Error updating champion builds: ${error.message}`);
    }
  }

  /**
   * Get champion build items from op.gg using a custom name for URL
   * @param championId Internal champion ID
   * @param customUrlName Custom name to use in the op.gg URL
   * @returns Champion build data
   */
  async getChampionBuildWithCustomName(
    championId: string,
    customUrlName: string,
  ): Promise<any> {
    try {
      // Validate if champion exists
      if (!this.champions['data']) {
        await this.loadChampionsData();
      }

      // Find champion by ID
      const champion = this.champions['data'][championId];

      if (!champion) {
        throw new NotFoundException(
          `No champion found with ID '${championId}'`,
        );
      }

      // Fetch build data from op.gg using the custom URL name
      const buildData =
        await this.championBuildCrawlerService.crawlChampionBuild(
          customUrlName,
        );

      // Extract just the champion names from matchups objects before saving to database
      const counters = buildData.matchups?.counters || [];
      const strongAgainst = buildData.matchups?.favorable || [];

      // Update champion in the database with build information
      await this.championModel.updateOne(
        { id: championId },
        {
          $set: {
            recommendedRunes: buildData.runes,
            recommendedItems: buildData.items,
            counters: counters,
            strongAgainst: strongAgainst,
          },
        },
      );

      return {
        champion: {
          id: championId,
          name: champion.name,
        },
        buildData,
      };
    } catch (error) {
      throw new Error(`Error fetching champion build: ${error.message}`);
    }
  }
}
