import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export type MatchDocument = Match & Document;

@Schema({ timestamps: true, strict: false })
export class Match {
  @Prop({ type: mongoose.Schema.Types.Mixed })
  metadata: {
    dataVersion: string;
    matchId: string;
    participants: string[];
  };

  @Prop({ type: mongoose.Schema.Types.Mixed })
  info: {
    gameCreation: number;
    gameDuration: number;
    gameEndTimestamp: number;
    gameId: number;
    gameMode: string;
    gameName: string;
    gameStartTimestamp: number;
    gameType: string;
    gameVersion: string;
    mapId: number;
    participants: any[];
    platformId: string;
    queueId: number;
    teams: any[];
  };
}

export const MatchSchema = SchemaFactory.createForClass(Match);
