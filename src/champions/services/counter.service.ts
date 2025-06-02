import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from '../schemas/counter.schema';
import {
  CreateCounterDto,
  UpdateCounterDto,
  CounterQueryDto,
} from '../dto/counter.dto';

@Injectable()
export class CounterService {
  constructor(
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
  ) {}

  /**
   * Create new counter data for a champion
   */
  async create(createCounterDto: CreateCounterDto): Promise<Counter> {
    // Check if counter data already exists for this champion and role
    const existingCounter = await this.counterModel.findOne({
      championId: createCounterDto.championId,
      role: createCounterDto.role,
      patch: createCounterDto.patch || 'latest',
      rank: createCounterDto.rank || 'All',
      region: createCounterDto.region || 'World',
    });

    if (existingCounter) {
      throw new BadRequestException(
        `Counter data already exists for ${createCounterDto.championName} in ${createCounterDto.role} role`,
      );
    }

    const counter = new this.counterModel({
      ...createCounterDto,
      createdAt: new Date(),
      lastUpdated: new Date(),
    });

    return counter.save();
  }

  /**
   * Find all counters with pagination and filtering
   */
  async findAll(query: CounterQueryDto): Promise<{
    data: Counter[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { limit = 20, skip = 0, ...filters } = query;

    // Build filter object
    const filterObj: any = {};

    if (filters.championId) filterObj.championId = filters.championId;
    if (filters.championName) {
      filterObj.championName = new RegExp(filters.championName, 'i');
    }
    if (filters.role) filterObj.role = filters.role;
    if (filters.patch) filterObj.patch = filters.patch;
    if (filters.rank) filterObj.rank = filters.rank;
    if (filters.region) filterObj.region = filters.region;

    const [data, total] = await Promise.all([
      this.counterModel
        .find(filterObj)
        .sort({ lastUpdated: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.counterModel.countDocuments(filterObj),
    ]);

    const page = Math.floor(skip / limit) + 1;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Find counter data by champion ID and role
   */
  async findByChampionAndRole(
    championId: string,
    role: string,
    patch?: string,
    rank?: string,
    region?: string,
  ): Promise<Counter> {
    const filter: any = { championId, role };

    if (patch) filter.patch = patch;
    if (rank) filter.rank = rank;
    if (region) filter.region = region;

    const counter = await this.counterModel.findOne(filter).lean();

    if (!counter) {
      throw new NotFoundException(
        `Counter data not found for champion ${championId} in ${role} role`,
      );
    }

    return counter;
  }

  /**
   * Find counter data by champion name
   */
  async findByChampionName(
    championName: string,
    role?: string,
    patch?: string,
    rank?: string,
    region?: string,
  ): Promise<Counter[]> {
    const filter: any = {
      championName: new RegExp(championName, 'i'),
    };

    if (role) filter.role = role;
    if (patch) filter.patch = patch;
    if (rank) filter.rank = rank;
    if (region) filter.region = region;

    return this.counterModel.find(filter).lean();
  }

  /**
   * Get best counters against a specific champion
   */
  async getBestCountersAgainst(
    championId: string,
    role: string,
    patch?: string,
    rank?: string,
    region?: string,
  ): Promise<any> {
    const counter = await this.findByChampionAndRole(
      championId,
      role,
      patch,
      rank,
      region,
    );

    // Sort by counter rating (highest first) and win rate
    const bestCounters = counter.weakAgainst
      .sort((a, b) => {
        if (b.counterRating !== a.counterRating) {
          return b.counterRating - a.counterRating;
        }
        return b.winRate - a.winRate;
      })
      .slice(0, 10);

    return {
      championId: counter.championId,
      championName: counter.championName,
      role: counter.role,
      patch: counter.patch,
      rank: counter.rank,
      region: counter.region,
      bestCounters,
      lastUpdated: counter.lastUpdated,
    };
  }

  /**
   * Get worst matchups for a champion (champions this champion is weak against)
   */
  async getWorstMatchups(
    championId: string,
    role: string,
    patch?: string,
    rank?: string,
    region?: string,
  ): Promise<any> {
    const counter = await this.findByChampionAndRole(
      championId,
      role,
      patch,
      rank,
      region,
    );

    // Sort by lowest win rate and counter rating
    const worstMatchups = counter.weakAgainst
      .sort((a, b) => {
        if (a.winRate !== b.winRate) {
          return a.winRate - b.winRate;
        }
        return a.counterRating - b.counterRating;
      })
      .slice(0, 10);

    return {
      championId: counter.championId,
      championName: counter.championName,
      role: counter.role,
      patch: counter.patch,
      rank: counter.rank,
      region: counter.region,
      worstMatchups,
      lastUpdated: counter.lastUpdated,
    };
  }

  /**
   * Get best early game matchups (based on GD@15)
   */
  async getBestEarlyGameMatchups(
    championId: string,
    role: string,
    patch?: string,
    rank?: string,
    region?: string,
  ): Promise<any> {
    const counter = await this.findByChampionAndRole(
      championId,
      role,
      patch,
      rank,
      region,
    );

    // Sort by highest gold differential at 15 minutes
    const bestEarlyGame = counter.bestLaneCounters
      .sort(
        (a, b) => (b.goldDifferentialAt15 || 0) - (a.goldDifferentialAt15 || 0),
      )
      .slice(0, 10);

    return {
      championId: counter.championId,
      championName: counter.championName,
      role: counter.role,
      patch: counter.patch,
      rank: counter.rank,
      region: counter.region,
      bestEarlyGameMatchups: bestEarlyGame,
      lastUpdated: counter.lastUpdated,
    };
  }

  /**
   * Update existing counter data
   */
  async update(
    id: string,
    updateCounterDto: UpdateCounterDto,
  ): Promise<Counter> {
    const counter = await this.counterModel.findByIdAndUpdate(
      id,
      {
        ...updateCounterDto,
        lastUpdated: new Date(),
      },
      { new: true },
    );

    if (!counter) {
      throw new NotFoundException(`Counter data with ID ${id} not found`);
    }

    return counter;
  }

  /**
   * Update counter data by champion and role
   */
  async updateByChampionAndRole(
    championId: string,
    role: string,
    updateCounterDto: UpdateCounterDto,
    patch?: string,
    rank?: string,
    region?: string,
  ): Promise<Counter> {
    const filter: any = { championId, role };

    if (patch) filter.patch = patch;
    if (rank) filter.rank = rank;
    if (region) filter.region = region;

    const counter = await this.counterModel.findOneAndUpdate(
      filter,
      {
        ...updateCounterDto,
        lastUpdated: new Date(),
      },
      { new: true },
    );

    if (!counter) {
      throw new NotFoundException(
        `Counter data not found for champion ${championId} in ${role} role`,
      );
    }

    return counter;
  }

  /**
   * Delete counter data
   */
  async remove(id: string): Promise<void> {
    const result = await this.counterModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException(`Counter data with ID ${id} not found`);
    }
  }

  /**
   * Delete counter data by champion and role
   */
  async removeByChampionAndRole(
    championId: string,
    role: string,
    patch?: string,
    rank?: string,
    region?: string,
  ): Promise<void> {
    const filter: any = { championId, role };

    if (patch) filter.patch = patch;
    if (rank) filter.rank = rank;
    if (region) filter.region = region;

    const result = await this.counterModel.findOneAndDelete(filter);

    if (!result) {
      throw new NotFoundException(
        `Counter data not found for champion ${championId} in ${role} role`,
      );
    }
  }

  /**
   * Get champion statistics (win rate, pick rate, ban rate)
   */
  async getChampionStats(
    championId: string,
    role: string,
    patch?: string,
    rank?: string,
    region?: string,
  ): Promise<any> {
    const query: any = { championId, role };

    if (patch) query.patch = patch;
    if (rank) query.rank = rank;
    if (region) query.region = region;

    const counter = await this.counterModel.findOne(query).lean();

    if (!counter) {
      throw new NotFoundException(
        `Champion ${championId} stats not found for role ${role}`,
      );
    }

    return {
      championId: counter.championId,
      championName: counter.championName,
      role: counter.role,
      overallWinRate: counter.overallWinRate || 0,
      pickRate: counter.pickRate || 0,
      banRate: counter.banRate || 0,
      patch: counter.patch,
      rank: counter.rank,
      region: counter.region,
      lastUpdated: counter.lastUpdated,
    };
  }

  /**
   * Get formatted content for champion counter page
   */
  async getFormattedContent(
    championId: string,
    role: string,
    patch?: string,
    rank?: string,
    region?: string,
  ): Promise<any> {
    const query: any = { championId, role };

    if (patch) query.patch = patch;
    if (rank) query.rank = rank;
    if (region) query.region = region;

    const counter = await this.counterModel.findOne(query).lean();

    if (!counter) {
      throw new NotFoundException(
        `Champion ${championId} formatted content not found for role ${role}`,
      );
    }

    return {
      championId: counter.championId,
      championName: counter.championName,
      role: counter.role,
      formattedContent: counter.formattedContent || '',
      patch: counter.patch,
      rank: counter.rank,
      region: counter.region,
      lastUpdated: counter.lastUpdated,
    };
  }

  /**
   * Get specific content section for champion counter page
   */
  async getContentSection(
    championId: string,
    role: string,
    sectionType:
      | 'weaknessesContent'
      | 'counterItemsContent'
      | 'strategiesContent'
      | 'additionalTipsContent',
    patch?: string,
    rank?: string,
    region?: string,
  ): Promise<any> {
    const query: any = { championId, role };

    if (patch) query.patch = patch;
    if (rank) query.rank = rank;
    if (region) query.region = region;

    const counter = await this.counterModel.findOne(query).lean();

    if (!counter) {
      throw new NotFoundException(
        `Champion ${championId} content not found for role ${role}`,
      );
    }

    const sectionNames = {
      weaknessesContent: 'Điểm yếu chí mạng',
      counterItemsContent: 'Trang bị khắc chế',
      strategiesContent: 'Chiến thuật đối đầu',
      additionalTipsContent: 'Lời khuyên bổ sung',
    };

    return {
      championId: counter.championId,
      championName: counter.championName,
      role: counter.role,
      sectionType: sectionType,
      sectionName: sectionNames[sectionType],
      content: counter[sectionType] || '',
      patch: counter.patch,
      rank: counter.rank,
      region: counter.region,
      lastUpdated: counter.lastUpdated,
    };
  }

  /**
   * Search champions by name for counter analysis
   */
  async searchChampionsForCounter(name: string): Promise<any[]> {
    const nameRegex = new RegExp(name, 'i');

    const counters = await this.counterModel
      .find({ championName: nameRegex })
      .select('championId championName role patch rank region overallWinRate')
      .lean();

    // Group by champion
    const championMap = new Map();

    counters.forEach((counter) => {
      const key = `${counter.championId}_${counter.championName}`;

      if (!championMap.has(key)) {
        championMap.set(key, {
          championId: counter.championId,
          championName: counter.championName,
          roles: [],
        });
      }

      championMap.get(key).roles.push({
        role: counter.role,
        patch: counter.patch,
        rank: counter.rank,
        region: counter.region,
        overallWinRate: counter.overallWinRate,
      });
    });

    return Array.from(championMap.values());
  }

  /**
   * Get latest patch data available
   */
  async getLatestPatch(): Promise<string> {
    const latestCounter = await this.counterModel
      .findOne()
      .sort({ patch: -1, lastUpdated: -1 })
      .select('patch')
      .lean();

    return latestCounter?.patch || 'latest';
  }

  /**
   * Get available patches for filtering
   */
  async getAvailablePatches(): Promise<string[]> {
    return this.counterModel.distinct('patch');
  }

  /**
   * Get available ranks for filtering
   */
  async getAvailableRanks(): Promise<string[]> {
    return this.counterModel.distinct('rank');
  }

  /**
   * Get available regions for filtering
   */
  async getAvailableRegions(): Promise<string[]> {
    return this.counterModel.distinct('region');
  }
}
