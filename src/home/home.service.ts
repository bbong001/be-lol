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

  async getHomePageData(lang: string = 'vi') {
    // TODO: Consider implementing cache here for better performance
    // const cacheKey = `home-page-data-${lang}`;
    // const cachedData = await this.cacheService.get(cacheKey);
    // if (cachedData) return cachedData;

    // Get latest news (limit to 5) with language support
    const latestNews = await this.newsService.findAll(5, 1, lang);

    // Get latest PC builds (limit to 3) with language support
    const latestPcBuilds = await this.pcBuildService.findAllBuilds(3, 1, lang);

    // Get 5 random champions from each game with language support
    const randomChampions = await this.getRandomLolChampions(5, lang);
    const randomTftChampions = await this.getRandomTftChampions(5, lang);
    const randomWrChampions = await this.getRandomWildriftChampions(5, lang);

    const result = {
      status: 'success',
      data: {
        latestNews,
        latestPcBuilds,
        randomChampions,
        randomTftChampions,
        randomWrChampions,
      },
    };

    // TODO: Cache the result with expiration
    // await this.cacheService.set(cacheKey, result, 300); // 5 minutes

    return result;
  }

  // Helper method to get random League of Legends champions
  private async getRandomLolChampions(count: number, lang: string) {
    try {
      // Champions service has findAll method that returns paginated response
      const championsResponse = await this.championsService.findAll(
        1,
        100,
        lang as any,
      );
      return this.getRandomItems(championsResponse.data, count);
    } catch (error) {
      // Fallback to empty array if method fails
      console.error('Error fetching LOL champions:', error);
      return [];
    }
  }

  // Helper method to get random TFT champions
  private async getRandomTftChampions(count: number, lang: string) {
    try {
      // TFT service has findAllChampions method that returns an array of champions
      const champions = await this.tftService.findAllChampions(lang);
      return this.getRandomItems(champions, count);
    } catch (error) {
      // Fallback to empty array if method fails
      console.error('Error fetching TFT champions:', error);
      return [];
    }
  }

  // Helper method to get random Wild Rift champions
  private async getRandomWildriftChampions(count: number, _lang: string) {
    try {
      // WildRift service findAllChampions returns a paginated response with items array
      // Note: WildRift service doesn't support language parameter yet
      const response = await this.wildriftService.findAllChampions({
        limit: 100,
        page: 1,
      });
      return this.getRandomItems(response.items, count);
    } catch (error) {
      // Fallback to empty array if method fails
      console.error('Error fetching Wild Rift champions:', error);
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
