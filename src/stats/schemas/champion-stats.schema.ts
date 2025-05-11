import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChampionStatsDocument = ChampionStats & Document;

@Schema({ timestamps: true })
export class ChampionStats {
  @Prop({ required: true, unique: true })
  championId: string;

  @Prop({ required: true })
  championName: string;

  @Prop({ default: 0 })
  gamesPlayed: number;

  @Prop({ default: 0 })
  gamesWon: number;

  @Prop({ default: 0 })
  gamesBanned: number;

  @Prop()
  winRate: number;

  @Prop()
  pickRate: number;

  @Prop()
  banRate: number;

  @Prop({ type: Object })
  roleStats: {
    top?: { gamesPlayed: number; winRate: number };
    jungle?: { gamesPlayed: number; winRate: number };
    mid?: { gamesPlayed: number; winRate: number };
    adc?: { gamesPlayed: number; winRate: number };
    support?: { gamesPlayed: number; winRate: number };
  };

  @Prop({ type: [Object] })
  counters: Array<{
    championId: string;
    championName: string;
    winRate: number;
  }>;

  @Prop()
  patchVersion: string;

  @Prop()
  lastUpdated: Date;
}

export const ChampionStatsSchema = SchemaFactory.createForClass(ChampionStats);
