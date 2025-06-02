import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CounterDocument = Counter & Document;

@Schema()
export class CounterRelation {
  @Prop({ required: true })
  championId: string;

  @Prop({ required: true })
  championName: string;

  @Prop({ type: Number, min: 0, max: 100 })
  winRate: number;

  @Prop({ type: Number, min: 0, max: 10 })
  counterRating: number;

  @Prop({ type: Number, min: 0 })
  gameCount: number;

  @Prop({ type: Number })
  goldDifferentialAt15: number; // GD@15 - có thể âm hoặc dương

  @Prop()
  difficulty: string; // 'Easy', 'Medium', 'Hard'

  @Prop()
  tips: string;

  @Prop()
  patch: string; // Patch version (e.g., '15.10')

  @Prop()
  rank: string; // Rank tier (e.g., 'Emerald+')

  @Prop()
  imageUrl: string; // Link hình ảnh của champion counter
}

@Schema({ timestamps: true })
export class Counter {
  @Prop({ required: true })
  championId: string;

  @Prop({ required: true })
  championName: string;

  @Prop({ required: true })
  role: string; // 'jungle', 'top', 'mid', 'adc', 'support'

  @Prop({ type: Number, min: 0, max: 100 })
  overallWinRate: number; // Tỷ lệ thắng tổng thể của champion ở role này

  @Prop({ type: Number, min: 0, max: 100 })
  pickRate: number; // Tỷ lệ pick

  @Prop({ type: Number, min: 0, max: 100 })
  banRate: number; // Tỷ lệ ban

  @Prop({ type: [CounterRelation], default: [] })
  strongAgainst: CounterRelation[]; // Champions mà champion này counter tốt

  @Prop({ type: [CounterRelation], default: [] })
  weakAgainst: CounterRelation[]; // Champions counter champion này

  @Prop({ type: [CounterRelation], default: [] })
  bestLaneCounters: CounterRelation[]; // Best early game counters (based on GD@15)

  @Prop({ type: [CounterRelation], default: [] })
  worstLaneCounters: CounterRelation[]; // Worst early game matchups

  @Prop()
  patch: string; // Patch version

  @Prop()
  rank: string; // Rank tier

  @Prop()
  region: string; // 'World', 'Korea', 'EUW', etc.

  // Bỏ raw HTML content để tiết kiệm dung lượng database
  // @Prop({ type: String })
  // rawHtmlContent: string; // Full HTML content từ source page

  // @Prop({ type: String })
  // rawResponseData: string; // JSON string của response gốc từ API hoặc crawl

  @Prop({ type: String })
  formattedContent: string; // Formatted HTML content cho display (weaknesses, strategies, tips)

  // Separate sections for better organization
  @Prop({ type: String })
  weaknessesContent: string; // Điểm yếu chí mạng của champion

  @Prop({ type: String })
  counterItemsContent: string; // Trang bị khắc chế "cứng"

  @Prop({ type: String })
  strategiesContent: string; // Chiến thuật đối đầu "cao tay"

  @Prop({ type: String })
  additionalTipsContent: string; // Bên cạnh đó / Các lời khuyên bổ sung

  // Additional structured data that might be useful
  @Prop({ type: Object })
  additionalData: {
    matchupDetails?: any; // Chi tiết matchup nếu có
    itemBuildRecommendations?: any; // Recommend items cho counter
    runeRecommendations?: any; // Recommend runes
    skillOrder?: any; // Thứ tự skill khuyến nghị
    playStyle?: string; // Phong cách chơi khuyến nghị
    lanePhase?: any; // Thông tin lane phase chi tiết
    teamFight?: any; // Thông tin team fight
  };

  @Prop({ type: Date, default: Date.now })
  lastUpdated: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);

// Tạo index để tối ưu query
CounterSchema.index({ championId: 1, role: 1 });
CounterSchema.index({ championName: 1 });
CounterSchema.index({ patch: 1 });
CounterSchema.index({ rank: 1 });
CounterSchema.index({ region: 1 });
CounterSchema.index({ lastUpdated: -1 });
