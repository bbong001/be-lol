import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Champion, ChampionDocument } from './schemas/champion.schema';
import { RiotApiService } from '../common/services/riot-api.service';
import { ChampionBuildCrawlerService } from './services/champion-build-crawler.service';
import { CreateChampionDto } from './dto/create-champion.dto';
import { UpdateChampionDto } from './dto/update-champion.dto';
import {
  SupportedLanguage,
  transformChampion,
  transformChampions,
} from './utils/i18n.util';
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
    lang: SupportedLanguage = 'en',
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

    // Transform data according to language
    const transformedData = transformChampions(data, lang);

    return {
      data: transformedData,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findById(
    id: string,
    lang: SupportedLanguage = 'en',
  ): Promise<Champion> {
    const champion = await this.championModel.findOne({ _id: id }).lean();
    return transformChampion(champion, lang);
  }

  async findByName(
    name: string,
    lang: SupportedLanguage = 'en',
  ): Promise<Champion> {
    const nameRegex = new RegExp(name, 'i');
    const champion = await this.championModel
      .findOne({
        $or: [
          { 'name.en': nameRegex },
          { 'name.vi': nameRegex },
          { id: nameRegex },
        ],
      })
      .lean();

    return transformChampion(champion, lang);
  }

  // Find champions by name pattern and get detailed data from Data Dragon
  async findDetailsByName(
    name: string,
    lang: SupportedLanguage = 'en',
  ): Promise<any> {
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
          // Get champion data from Data Dragon with correct language
          const langCode = lang === 'vi' ? 'vi_VN' : 'en_US';
          const response = await axios.get(
            `https://ddragon.leagueoflegends.com/cdn/${this.version}/data/${langCode}/champion/${champ.id}.json`,
          );

          // Check if we have build data in the database
          const championFromDB = await this.championModel
            .findOne({ id: champ.id })
            .lean();

          // Combine data from Data Dragon with build data
          const championData = response.data;

          // Transform DB data if available
          if (championFromDB) {
            const transformedChampion = transformChampion(championFromDB, lang);

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

            // Override Data Dragon name and title with transformed DB data
            if (transformedChampion) {
              championData.data[champ.id].name = transformedChampion.name;
              championData.data[champ.id].title = transformedChampion.title;
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
    // Get champion data from both languages
    const [enData, viData] = await Promise.all([
      axios.get(
        `https://ddragon.leagueoflegends.com/cdn/${this.version}/data/en_US/champion.json`,
      ),
      axios.get(
        `https://ddragon.leagueoflegends.com/cdn/${this.version}/data/vi_VN/champion.json`,
      ),
    ]);

    // Clear existing champions
    await this.championModel.deleteMany({});

    // Process and combine champion data from both languages
    const enChampions = Object.values(enData.data.data);
    const viChampions = Object.values(viData.data.data);

    // Create a map for Vietnamese data
    const viChampionMap = viChampions.reduce((map: any, champ: any) => {
      map[champ.id] = champ;
      return map;
    }, {});

    const champions = enChampions.map((enChamp: any) => {
      const viChamp = viChampionMap[enChamp.id];

      return {
        id: enChamp.id,
        name: {
          en: enChamp.name,
          vi: viChamp?.name || enChamp.name,
        },
        title: {
          en: enChamp.title,
          vi: viChamp?.title || enChamp.title,
        },
        imageUrl: `http://ddragon.leagueoflegends.com/cdn/${this.version}/img/champion/${enChamp.image.full}`,
        splashUrl: `http://ddragon.leagueoflegends.com/cdn/img/champion/splash/${enChamp.id}_0.jpg`,
        stats: enChamp.stats,
        abilities: [], // Will be populated later when needed
        tags: enChamp.tags || [],
        counters: [],
        strongAgainst: [],
        recommendedRunes: [],
        recommendedItems: [],
      };
    });

    // Save all champions to database
    await this.championModel.insertMany(champions);

    console.log(
      `Synced ${champions.length} champions to database with multilingual support`,
    );

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
        (champ: any) => namePattern.test(champ.id),
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
          // Use champion.id instead of champion.name since name is now multilingual
          const buildData = await this.getChampionBuild(champion.id);
          results.push({
            champion: champion.id,
            status: 'success',
          });
        } catch (error) {
          results.push({
            champion: champion.id,
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

  /**
   * Create a new champion
   * @param createChampionDto Champion data to create
   * @returns Created champion
   */
  async create(createChampionDto: CreateChampionDto): Promise<Champion> {
    // Check if champion with same ID or name already exists
    const existingChampion = await this.championModel.findOne({
      $or: [{ id: createChampionDto.id }, { name: createChampionDto.name }],
    });

    if (existingChampion) {
      throw new Error(
        `Champion with ID '${createChampionDto.id}' or name '${createChampionDto.name}' already exists`,
      );
    }

    const champion = new this.championModel(createChampionDto);
    const savedChampion = await champion.save();

    // Reload champions data to include the new champion
    await this.loadChampionsData();

    return savedChampion.toObject();
  }

  /**
   * Update an existing champion
   * @param id Champion ID to update
   * @param updateChampionDto Champion data to update
   * @returns Updated champion
   */
  async update(
    id: string,
    updateChampionDto: UpdateChampionDto,
  ): Promise<Champion> {
    const champion = await this.championModel.findById(id);

    if (!champion) {
      throw new NotFoundException(`Champion with ID '${id}' not found`);
    }

    // If updating ID or name, check for conflicts
    if (updateChampionDto.id || updateChampionDto.name) {
      const conflictQuery: any = { _id: { $ne: id } };
      const orConditions = [];

      if (updateChampionDto.id) {
        orConditions.push({ id: updateChampionDto.id });
      }
      if (updateChampionDto.name) {
        orConditions.push({ name: updateChampionDto.name });
      }

      if (orConditions.length > 0) {
        conflictQuery.$or = orConditions;
        const existingChampion =
          await this.championModel.findOne(conflictQuery);

        if (existingChampion) {
          throw new Error(
            `Champion with ID '${updateChampionDto.id}' or name '${updateChampionDto.name}' already exists`,
          );
        }
      }
    }

    const updatedChampion = await this.championModel.findByIdAndUpdate(
      id,
      { $set: updateChampionDto },
      { new: true, runValidators: true },
    );

    // Reload champions data to reflect the changes
    await this.loadChampionsData();

    return updatedChampion.toObject();
  }

  /**
   * Delete a champion
   * @param id Champion ID to delete
   * @returns Deletion result
   */
  async remove(id: string): Promise<{ message: string }> {
    const champion = await this.championModel.findById(id);

    if (!champion) {
      throw new NotFoundException(`Champion with ID '${id}' not found`);
    }

    await this.championModel.findByIdAndDelete(id);

    // Reload champions data to reflect the changes
    await this.loadChampionsData();

    return {
      message: `Champion '${champion.id}' has been deleted successfully`,
    };
  }
}
