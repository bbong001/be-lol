import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Version, VersionDocument } from './schemas/version.schema';
import { CreateVersionDto, GameType } from './dto/version.dto';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, map } from 'rxjs';
import { AxiosError } from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class VersionsService {
  private readonly logger = new Logger(VersionsService.name);

  constructor(
    @InjectModel(Version.name) private versionModel: Model<VersionDocument>,
    private readonly httpService: HttpService,
  ) {}

  async getLatestVersions() {
    try {
      const [lolVersion, tftVersion, wildriftVersion] = await Promise.all([
        this.getLatestVersionByGame(GameType.LOL),
        this.getLatestVersionByGame(GameType.TFT),
        this.getLatestVersionByGame(GameType.WILDRIFT),
      ]);

      return {
        status: 'success',
        data: {
          lol: lolVersion,
          tft: tftVersion,
          wildrift: wildriftVersion,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to fetch latest versions: ${error.message}`);
      throw error;
    }
  }

  async getLatestVersionByGame(game: GameType): Promise<string> {
    // First try to get from database
    const cachedVersion = await this.versionModel
      .findOne({ game, isLatest: true })
      .sort({ createdAt: -1 })
      .exec();

    if (cachedVersion && this.isVersionFresh(cachedVersion.createdAt)) {
      return cachedVersion.version;
    }

    // If not in DB or not fresh, fetch from appropriate source
    try {
      let version: string;

      switch (game) {
        case GameType.LOL:
          version = await this.fetchLatestLolVersion();
          break;
        case GameType.TFT:
          version = await this.fetchLatestTftVersion();
          break;
        case GameType.WILDRIFT:
          version = await this.fetchLatestWildRiftVersion();
          break;
      }

      // Save to database
      if (version) {
        // Set all other versions of this game type to not latest
        await this.versionModel.updateMany(
          { game, isLatest: true },
          { isLatest: false },
        );

        // Create new version record
        await this.versionModel.create({
          game,
          version,
          releasedAt: new Date(),
          isLatest: true,
        });
      }

      return version;
    } catch (error) {
      this.logger.error(`Error fetching ${game} version: ${error.message}`);

      // If we can't fetch new version, return the cached one even if it's stale
      if (cachedVersion) {
        return cachedVersion.version;
      }

      // Default fallback versions if all else fails
      const fallbacks = {
        [GameType.LOL]: '15.10.1',
        [GameType.TFT]: '14.4',
        [GameType.WILDRIFT]: '6.1b',
      };

      return fallbacks[game];
    }
  }

  private isVersionFresh(date: Date): boolean {
    const now = new Date();
    const hours = Math.abs(now.getTime() - date.getTime()) / 36e5; // Convert ms to hours
    return hours < 24; // Consider cached version fresh if less than 24 hours old
  }

  private async fetchLatestLolVersion(): Promise<string> {
    const url = 'https://ddragon.leagueoflegends.com/api/versions.json';
    const { data } = await firstValueFrom(
      this.httpService.get<string[]>(url).pipe(
        map((response) => response),
        catchError((error: AxiosError) => {
          this.logger.error(`Error fetching LoL versions: ${error.message}`);
          throw new Error(`Failed to fetch LoL version: ${error.message}`);
        }),
      ),
    );

    return data[0]; // First version in the array is the latest
  }

  private async fetchLatestTftVersion(): Promise<string> {
    // Try multiple sources to get the TFT version
    try {
      // Method 1: Try to get from the official TFT website
      const tftWebUrl = 'https://teamfighttactics.leagueoflegends.com/en-us/';
      const { data: tftWebData } = await firstValueFrom(
        this.httpService.get<string>(tftWebUrl).pipe(
          catchError((error) => {
            this.logger.warn(`Couldn't fetch TFT website: ${error.message}`);
            throw error;
          }),
        ),
      );

      // Extract meta tags or relevant content that might contain version info
      const $ = cheerio.load(tftWebData);

      // Look for version in page content (this may vary based on site structure)
      const pageText = $('body').text();
      const versionRegex = /Set\s+\d+\.5|Patch\s+(\d+\.\d+)/gi;
      const matches = [...pageText.matchAll(versionRegex)];

      if (matches.length > 0) {
        for (const match of matches) {
          if (match[1]) {
            return match[1];
          }

          // If it matched "Set X.5" format, extract
          const setMatch = match[0].match(/Set\s+(\d+\.\d+)/i);
          if (setMatch && setMatch[1]) {
            return setMatch[1];
          }
        }
      }
    } catch (error) {
      this.logger.warn(`Error scraping TFT website: ${error.message}`);
    }

    try {
      // Method 2: Try to get from Riot Developer API (requires API key)
      // This is commented out since it requires a Riot API key
      /* 
      const apiKey = process.env.RIOT_API_KEY;
      if (apiKey) {
        const riotApiUrl = `https://na1.api.riotgames.com/tft/status/v1/platform-data?api_key=${apiKey}`;
        const { data: apiData } = await firstValueFrom(
          this.httpService.get(riotApiUrl).pipe(
            catchError((error) => {
              this.logger.warn(`Couldn't fetch TFT API data: ${error.message}`);
              throw error;
            }),
          ),
        );
        
        // Extract version from API response
        if (apiData && apiData.version) {
          return apiData.version;
        }
      }
      */
    } catch (error) {
      this.logger.warn(`Error fetching from Riot API: ${error.message}`);
    }

    try {
      // Method 3: Get from TFT Community resources
      const communityUrl =
        'https://www.leagueoflegends.com/en-us/news/tags/teamfight-tactics/';
      const { data: communityData } = await firstValueFrom(
        this.httpService.get<string>(communityUrl).pipe(
          catchError((error) => {
            this.logger.warn(
              `Couldn't fetch TFT community page: ${error.message}`,
            );
            throw error;
          }),
        ),
      );

      const $community = cheerio.load(communityData);

      // Try to find patch note articles
      const articles = $community('article');
      for (let i = 0; i < articles.length; i++) {
        const articleTitle = $community(articles[i]).find('h2, .title').text();
        const patchMatch =
          articleTitle.match(/TFT\s+(\d+\.\d+)\s+Patch/i) ||
          articleTitle.match(/Patch\s+(\d+\.\d+)/i);

        if (patchMatch && patchMatch[1]) {
          return patchMatch[1];
        }
      }
    } catch (error) {
      this.logger.warn(`Error scraping TFT community page: ${error.message}`);
    }

    try {
      // Method 4: Check the TFT subreddit for patch information
      const redditUrl = 'https://www.reddit.com/r/TeamfightTactics/hot.json';
      const { data: redditData } = await firstValueFrom(
        this.httpService
          .get(redditUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
          })
          .pipe(
            catchError((error) => {
              this.logger.warn(`Couldn't fetch Reddit data: ${error.message}`);
              throw error;
            }),
          ),
      );

      // Process reddit posts to find patch information
      if (redditData && redditData.data && redditData.data.children) {
        for (const post of redditData.data.children) {
          const title = post.data.title;
          const patchMatch =
            title.match(/Patch\s+(\d+\.\d+)/i) ||
            title.match(/TFT\s+(\d+\.\d+)/i) ||
            title.match(/Set\s+\d+\.\d+\s+Patch\s+(\d+\.\d+)/i);

          if (patchMatch && patchMatch[1]) {
            return patchMatch[1];
          }
        }
      }
    } catch (error) {
      this.logger.warn(`Error fetching Reddit data: ${error.message}`);
    }

    // If all else fails, return current known version
    return '14.4'; // Known TFT version (Set 10.5)
  }

  private async fetchLatestWildRiftVersion(): Promise<string> {
    try {
      // Wild Rift's latest version can be found on their patch notes page
      const url =
        'https://wildrift.leagueoflegends.com/en-us/news/game-updates/';
      const { data } = await firstValueFrom(
        this.httpService.get<string>(url).pipe(
          catchError((error: AxiosError) => {
            throw new Error(
              `Failed to fetch Wild Rift version: ${error.message}`,
            );
          }),
        ),
      );

      // Use cheerio to parse the HTML and extract the version from the latest patch notes title
      const $ = cheerio.load(data);
      const patchTitles = $('h1:contains("Wild Rift Patch Notes")').text();

      // Find the first occurrence of "Wild Rift Patch Notes X.X.X" or "Wild Rift Patch Notes X.Xa"
      const versionRegex = /Wild Rift Patch Notes (\d+\.\d+[a-z]?)/i;
      const match = patchTitles.match(versionRegex);

      if (match && match[1]) {
        return match[1];
      }

      // Fallback: try to find any version numbers in the page
      const fallbackRegex = /Patch (\d+\.\d+[a-z]?)/i;
      const fallbackMatch = data.match(fallbackRegex);

      if (fallbackMatch && fallbackMatch[1]) {
        return fallbackMatch[1];
      }

      throw new Error('Could not parse Wild Rift version from page');
    } catch (error) {
      this.logger.error(`Error scraping Wild Rift version: ${error.message}`);

      // If web scraping fails, try from APK Mirror as a backup source
      try {
        const apkMirrorUrl =
          'https://www.apkmirror.com/apk/riot-games-inc/league-of-legends-wild-rift/variant-%7B%22minapi_slug%22%3A%22minapi-21%22%7D/';
        const { data } = await firstValueFrom(
          this.httpService.get<string>(apkMirrorUrl).pipe(
            catchError((error: AxiosError) => {
              throw new Error(
                `Failed to fetch Wild Rift version from APK Mirror: ${error.message}`,
              );
            }),
          ),
        );

        // Extract version from the latest APK listing
        const $ = cheerio.load(data);
        const versionText = $(
          'div.appRow:first-child .infoSlide div:contains("Version:")',
        ).text();
        const versionRegex = /Version:([\d\.]+)\(/i;
        const match = versionText.match(versionRegex);

        if (match && match[1]) {
          return match[1];
        }
      } catch (backupError) {
        this.logger.error(
          `Backup source failed for Wild Rift version: ${backupError.message}`,
        );
      }

      throw error;
    }
  }

  async createVersion(createVersionDto: CreateVersionDto): Promise<Version> {
    const { game } = createVersionDto;

    // Set all other versions of this game type to not latest
    await this.versionModel.updateMany(
      { game, isLatest: true },
      { isLatest: false },
    );

    const newVersion = new this.versionModel(createVersionDto);
    return newVersion.save();
  }
}
