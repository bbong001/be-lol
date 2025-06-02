import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChampionDocument = Champion & Document;

@Schema()
export class Ability {
  @Prop({
    type: {
      en: String,
      vi: String,
    },
    required: true,
  })
  name: {
    en: string;
    vi: string;
  };

  @Prop({
    type: {
      en: String,
      vi: String,
    },
    required: true,
  })
  description: {
    en: string;
    vi: string;
  };

  @Prop()
  imageUrl: string;
}

@Schema()
export class Champion {
  @Prop({
    type: {
      en: String,
      vi: String,
    },
    required: true,
  })
  name: {
    en: string;
    vi: string;
  };

  @Prop({ required: true, unique: true })
  id: string;

  @Prop({
    type: {
      en: String,
      vi: String,
    },
  })
  title: {
    en: string;
    vi: string;
  };

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
