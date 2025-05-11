import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ChampionStats,
  ChampionStatsDocument,
} from './schemas/champion-stats.schema';
import { MatchesService } from '../matches/matches.service';
import { ChampionsService } from '../champions/champions.service';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(ChampionStats.name)
    private championStatsModel: Model<ChampionStatsDocument>,
    private matchesService: MatchesService,
    private championsService: ChampionsService,
  ) {}

  async getChampionStats(championId: string): Promise<ChampionStats> {
    return this.championStatsModel.findOne({ championId }).lean();
  }

  async getAllChampionStats(): Promise<ChampionStats[]> {
    return this.championStatsModel.find().sort({ pickRate: -1 }).lean();
  }

  async getTopPickRateChampions(limit = 10): Promise<ChampionStats[]> {
    return this.championStatsModel
      .find()
      .sort({ pickRate: -1 })
      .limit(limit)
      .lean();
  }

  async getTopWinRateChampions(limit = 10): Promise<ChampionStats[]> {
    return this.championStatsModel
      .find({ gamesPlayed: { $gte: 100 } }) // Minimum games threshold for relevance
      .sort({ winRate: -1 })
      .limit(limit)
      .lean();
  }

  async getTopBanRateChampions(limit = 10): Promise<ChampionStats[]> {
    return this.championStatsModel
      .find()
      .sort({ banRate: -1 })
      .limit(limit)
      .lean();
  }

  async generateDemoStats(): Promise<void> {
    // Get all champions first
    const champions = await this.championsService.findAll(1, 999);
    const championsList = champions.data;

    // Clear existing stats
    await this.championStatsModel.deleteMany({});

    // Generate random stats for each champion
    const statsPromises = championsList.map((champion) => {
      const gamesPlayed = Math.floor(Math.random() * 10000) + 500; // 500-10500 games
      const gamesWon = Math.floor(Math.random() * gamesPlayed);
      const gamesBanned = Math.floor(Math.random() * 5000) + 100; // 100-5100 bans

      const winRate = +((gamesWon / gamesPlayed) * 100).toFixed(2);
      const pickRate = +((gamesPlayed / 50000) * 100).toFixed(2); // Assuming total of ~50k games
      const banRate = +((gamesBanned / 50000) * 100).toFixed(2);

      // Generate role stats
      const roleStats = {
        top: {
          gamesPlayed: Math.floor(Math.random() * gamesPlayed * 0.5),
          winRate: Math.random() * 60 + 40,
        },
        jungle: {
          gamesPlayed: Math.floor(Math.random() * gamesPlayed * 0.5),
          winRate: Math.random() * 60 + 40,
        },
        mid: {
          gamesPlayed: Math.floor(Math.random() * gamesPlayed * 0.5),
          winRate: Math.random() * 60 + 40,
        },
        adc: {
          gamesPlayed: Math.floor(Math.random() * gamesPlayed * 0.5),
          winRate: Math.random() * 60 + 40,
        },
        support: {
          gamesPlayed: Math.floor(Math.random() * gamesPlayed * 0.5),
          winRate: Math.random() * 60 + 40,
        },
      };

      // For each role stat, ensure the winRate is formatted properly
      Object.keys(roleStats).forEach((role) => {
        roleStats[role].winRate = +roleStats[role].winRate.toFixed(2);
      });

      // Generate counters (3 champions that counter this one)
      const counters = [];
      const shuffled = [...championsList]
        .filter((c) => c.id !== champion.id)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      for (const counter of shuffled) {
        counters.push({
          championId: counter.id,
          championName: counter.name,
          winRate: +(Math.random() * 10 + 55).toFixed(2), // 55-65% win rate
        });
      }

      return this.championStatsModel.create({
        championId: champion.id,
        championName: champion.name,
        gamesPlayed,
        gamesWon,
        gamesBanned,
        winRate,
        pickRate,
        banRate,
        roleStats,
        counters,
        patchVersion: '13.10',
        lastUpdated: new Date(),
      });
    });

    await Promise.all(statsPromises);
    console.log(`Generated demo stats for ${championsList.length} champions`);
  }
}
