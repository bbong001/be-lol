import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SummonerDocument = Summoner & Document;

@Schema({ timestamps: true })
export class Summoner {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true })
  accountId: string;

  @Prop({ required: true })
  puuid: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  gameName: string;

  @Prop()
  tagLine: string;

  @Prop()
  profileIconId: number;

  @Prop()
  summonerLevel: number;

  @Prop()
  region: string;

  @Prop({ type: Object })
  rankInfo: {
    tier?: string;
    rank?: string;
    leaguePoints?: number;
    wins?: number;
    losses?: number;
  };

  @Prop({ type: [String] })
  recentMatches: string[];

  @Prop()
  lastUpdated: Date;
}

export const SummonerSchema = SchemaFactory.createForClass(Summoner);
