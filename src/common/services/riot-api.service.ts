import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LolApi } from 'twisted';

@Injectable()
export class RiotApiService implements OnModuleInit {
  private lolApi: LolApi;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('RIOT_API_KEY');
    if (!apiKey) {
      throw new Error('RIOT_API_KEY is not defined in environment variables');
    }
    this.lolApi = new LolApi({ key: apiKey });
  }

  getLolApi(): LolApi {
    return this.lolApi;
  }
}
