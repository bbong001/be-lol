import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChampionDocument = Champion & Document;

@Schema()
export class Ability {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  imageUrl: string;
}

@Schema()
export class Champion {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  id: string;

  @Prop()
  title: string;

  @Prop()
  imageUrl: string;

  @Prop()
  splashUrl: string;

  @Prop({ type: Object })
  stats: Record<string, number>;

  @Prop({ type: [Object] })
  abilities: Ability[];

  @Prop({ type: [String] })
  tags: string[];

  @Prop({ type: [String] })
  counters: string[];

  @Prop({ type: [String] })
  strongAgainst: string[];

  @Prop({ type: [Object] })
  recommendedRunes: any[];

  @Prop({ type: [Object] })
  recommendedItems: any[];
}

export const ChampionSchema = SchemaFactory.createForClass(Champion);
