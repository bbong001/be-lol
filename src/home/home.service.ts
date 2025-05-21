import { Injectable } from '@nestjs/common';
import { NewsService } from '../news/news.service';
import { PcBuildService } from '../pc-build/pc-build.service';
import { ChampionsService } from '../champions/champions.service';
import { TftService } from '../tft/tft.service';
import { WildriftService } from '../wildrift/wildrift.service';

@Injectable()
export class HomeService {
  constructor(
    private readonly newsService: NewsService,
    private readonly pcBuildService: PcBuildService,
    private readonly championsService: ChampionsService,
    private readonly tftService: TftService,
    private readonly wildriftService: WildriftService,
  ) {}

  async getHomePageData() {
    // Get latest news (limit to 5)
    const latestNews = await this.newsService.findAll(5, 1);

    // Get latest PC builds (limit to 3)
    const latestPcBuilds = await this.pcBuildService.findAllBuilds(3, 1);

    // Get 5 random champions from each game
    const randomChampions = await this.getRandomLolChampions(5);
    const randomTftChampions = await this.getRandomTftChampions(5);
    const randomWrChampions = await this.getRandomWildriftChampions(5);

    return {
      status: 'success',
      data: {
        latestNews,
        latestPcBuilds,
        randomChampions,
        randomTftChampions,
        randomWrChampions,
      },
    };
  }

  // Helper method to get random League of Legends champions
  private async getRandomLolChampions(count: number) {
    try {
      // Champions service has findAll method that returns paginated response
      const championsResponse = await this.championsService.findAll(1, 100);
      return this.getRandomItems(championsResponse.data, count);
    } catch (_) {
      // Fallback to empty array if method fails
      return [];
    }
  }

  // Helper method to get random TFT champions
  private async getRandomTftChampions(count: number) {
    try {
      // TFT service has findAllChampions method that returns an array of champions
      const champions = await this.tftService.findAllChampions();
      return this.getRandomItems(champions, count);
    } catch (_) {
      // Fallback to empty array if method fails
      return [];
    }
  }

  // Helper method to get random Wild Rift champions
  private async getRandomWildriftChampions(count: number) {
    try {
      // WildRift service findAllChampions returns a paginated response with items array
      const response = await this.wildriftService.findAllChampions({
        limit: 100,
        page: 1,
      });
      return this.getRandomItems(response.items, count);
    } catch (_) {
      // Fallback to empty array if method fails
      return [];
    }
  }

  // Utility to get random items from an array
  private getRandomItems(items: any[], count: number) {
    if (!items || items.length === 0) return [];
    
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, items.length));
  }
} 