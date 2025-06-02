import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Interface for multilingual text
export interface MultilingualText {
  en: string;
  vi: string;
}

// Interface for recommended item data with image
export interface RecommendedItemData {
  name: MultilingualText;
  imageUrl: string;
}

// Interface for champion ability with multilingual support
export interface ChampionAbility {
  name?: MultilingualText;
  description?: MultilingualText;
  mana?: string;
}

// Interface for champion stats
export interface ChampionStats {
  health?: string;
  mana?: string;
  armor?: string;
  magicResist?: string;
  dps?: string;
  damage?: string;
  attackSpeed?: string;
  critRate?: string;
  range?: string;
}

@Schema({ timestamps: true })
export class TftChampion extends Document {
  @Prop({
    type: Object,
    required: true,
    _id: false,
  })
  name: MultilingualText;

  @Prop({ required: true })
  cost: number;

  @Prop({
    type: [Object],
    required: true,
    _id: false,
  })
  traits: MultilingualText[];

  @Prop({
    type: Object,
    _id: false,
  })
  ability: ChampionAbility;

  @Prop({
    type: Object,
    _id: false,
  })
  stats: ChampionStats;

  @Prop({
    type: [Object],
    _id: false,
  })
  recommendedItems: MultilingualText[];

  @Prop({
    type: [Object],
    _id: false,
  })
  recommendedItemsData: RecommendedItemData[];

  @Prop()
  imageUrl: string;

  @Prop()
  patch: string;

  @Prop()
  setNumber: number;

  // Add language field for backward compatibility and filtering
  @Prop({ default: 'en' })
  lang: string;
}

export const TftChampionSchema = SchemaFactory.createForClass(TftChampion);
