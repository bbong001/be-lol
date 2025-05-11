import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Match, MatchDocument } from './schemas/match.schema';
import { Summoner, SummonerDocument } from './schemas/summoner.schema';
import { RiotApiService } from '../common/services/riot-api.service';

@Injectable()
export class MatchesService {
  constructor(
    @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    @InjectModel(Summoner.name) private summonerModel: Model<SummonerDocument>,
    private riotApiService: RiotApiService,
  ) {}

  // async getSummonerByName(summonerName: string, region: string): Promise<Summoner> {
  //   // First try to find in our database
  //   let summoner = await this.summonerModel.findOne({ name: new RegExp(`^${summonerName}$`, 'i'), region }).exec();

  //   if (!summoner) {
  //     // If not found, fetch from Riot API
  //     const lolApi = new LolApi({ key: process.env.RIOT_API_KEY });

  //     try {
  //       // Sử dụng phương thức getByName từ Summoner API
  //       const apiSummoner = await lolApi.Summoner.getBySummonerName(summonerName, Constants.Regions[region]);

  //       // Create new summoner in database
  //       summoner = new this.summonerModel({
  //         id: apiSummoner.response.id,
  //         accountId: apiSummoner.response.accountId,
  //         puuid: apiSummoner.response.puuid,
  //         name: apiSummoner.response.name,
  //         profileIconId: apiSummoner.response.profileIconId,
  //         summonerLevel: apiSummoner.response.summonerLevel,
  //         region,
  //         lastUpdated: new Date(),
  //       });

  //       await summoner.save();
  //     } catch (error) {
  //       throw new NotFoundException(`Summoner ${summonerName} not found in region ${region}`);
  //     }
  //   }

  //   return summoner;
  // }

  async getSummonerByRiotId(
    gameName: string,
    tagLine: string,
    region = 'europe',
  ): Promise<any> {
    // Tìm kiếm trong database trước
    const existingSummoner = await this.summonerModel
      .findOne({
        gameName: new RegExp(`^${gameName}$`, 'i'),
        tagLine: new RegExp(`^${tagLine}$`, 'i'),
      })
      .exec();

    if (existingSummoner) {
      return existingSummoner;
    }

    // Nếu không tìm thấy, gọi Riot API
    try {
      const apiKey = process.env.RIOT_API_KEY;

      // Gọi API riot để lấy thông tin account
      // Sử dụng fetch để gọi API trực tiếp
      const encodedGameName = encodeURIComponent(gameName);
      console.log(encodedGameName);
      const encodedTagLine = encodeURIComponent(tagLine);
      const accountResponse = await fetch(
        `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/H%E1%BB%95n%20%C4%91%E1%BB%99n%20ma%20th%E1%BA%A7n/vn2?api_key=RGAPI-f7a69b0b-748f-45ee-9d82-a9be2e937c12`,
      );

      console.log(accountResponse);
      if (!accountResponse.ok) {
        throw new NotFoundException(`Player ${gameName}#${tagLine} not found`);
      }

      const accountData = await accountResponse.json();

      if (!accountData || !accountData.puuid) {
        throw new NotFoundException(`Player ${gameName}#${tagLine} not found`);
      }

      // Chuyển đổi region toàn cầu sang region LoL cụ thể
      const regionalEndpoint = this.getRegionalEndpoint(region);

      // Lấy thông tin summoner từ puuid bằng API trực tiếp
      const summonerResponse = await fetch(
        `https://${regionalEndpoint}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${accountData.puuid}?api_key=${apiKey}`,
      );

      if (!summonerResponse.ok) {
        throw new NotFoundException(
          `Summoner information not found for ${gameName}#${tagLine}`,
        );
      }

      const summonerData = await summonerResponse.json();

      if (!summonerData) {
        throw new NotFoundException(
          `Summoner information not found for ${gameName}#${tagLine}`,
        );
      }

      // Lưu thông tin vào database
      const summoner = new this.summonerModel({
        id: summonerData.id,
        accountId: summonerData.accountId,
        puuid: accountData.puuid,
        name: summonerData.name || gameName,
        gameName: gameName,
        tagLine: tagLine,
        profileIconId: summonerData.profileIconId,
        summonerLevel: summonerData.summonerLevel,
        region: region,
        lastUpdated: new Date(),
      });

      await summoner.save();
      return summoner;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(
        `Error fetching data for ${gameName}#${tagLine}: ${error.message}`,
      );
    }
  }

  async getMatchHistoryByRiotId(
    gameName: string,
    tagLine: string,
    count = 10,
    region = 'europe',
  ): Promise<any[]> {
    // Lấy thông tin summoner
    const summoner = await this.getSummonerByRiotId(gameName, tagLine, region);

    if (!summoner || !summoner.puuid) {
      throw new NotFoundException(`Summoner ${gameName}#${tagLine} not found`);
    }

    try {
      // Kiểm tra xem đã có match trong database chưa
      let matches = await this.matchModel
        .find({ 'metadata.participants': { $in: [summoner.puuid] } })
        .sort({ 'info.gameCreation': -1 })
        .limit(count)
        .lean();

      // Nếu không đủ số match yêu cầu, lấy thêm từ Riot API
      if (matches.length < count) {
        const apiKey = process.env.RIOT_API_KEY;

        // Gọi API để lấy danh sách match IDs
        const matchIdsResponse = await fetch(
          `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${summoner.puuid}/ids?start=0&count=${count}&api_key=${apiKey}`,
        );

        if (!matchIdsResponse.ok) {
          throw new Error(
            `Failed to fetch match IDs: ${matchIdsResponse.statusText}`,
          );
        }

        const matchIds = await matchIdsResponse.json();

        // Lọc ra những match ID chưa có trong database
        const existingMatchIds = matches.map(
          (match) => match.metadata?.matchId,
        );
        const newMatchIds = matchIds.filter(
          (id) => !existingMatchIds.includes(id),
        );

        // Lấy chi tiết các trận đấu mới
        const newMatchPromises = newMatchIds.map(async (matchId) => {
          try {
            const matchResponse = await fetch(
              `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${apiKey}`,
            );

            if (!matchResponse.ok) {
              console.error(
                `Error fetching match ${matchId}: ${matchResponse.statusText}`,
              );
              return null;
            }

            const matchData = await matchResponse.json();

            // Lưu match vào database
            const match = new this.matchModel(matchData);
            await match.save();
            return matchData;
          } catch (err) {
            console.error(`Error fetching match ${matchId}:`, err);
            return null;
          }
        });

        const newMatches = (await Promise.all(newMatchPromises)).filter(
          (match) => match !== null,
        );

        // Cập nhật danh sách trận đấu
        matches = [...newMatches, ...matches].slice(0, count);
      }

      return matches;
    } catch (error) {
      throw new NotFoundException(
        `Error fetching match history: ${error.message}`,
      );
    }
  }

  async getMatchesBySummonerId(
    summonerId: string,
    count = 10,
  ): Promise<Match[]> {
    const summoner = await this.summonerModel
      .findOne({ id: summonerId })
      .exec();
    if (!summoner) {
      throw new NotFoundException(`Summoner with ID ${summonerId} not found`);
    }

    // Get matches from our database
    const matches = await this.matchModel
      .find({ 'participants.summonerId': summonerId })
      .sort({ gameCreation: -1 })
      .limit(count)
      .lean();

    return matches;
  }

  // Hàm helper để chuyển đổi từ region toàn cầu sang region LoL cụ thể
  private getRegionalEndpoint(region: string): string {
    const regionMap = {
      europe: 'euw1',
      americas: 'na1',
      asia: 'kr',
      sea: 'oc1',
    };

    return regionMap[region.toLowerCase()] || 'euw1';
  }
}
