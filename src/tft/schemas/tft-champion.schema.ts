import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Interface for recommended item data with image
export interface RecommendedItemData {
  name: string;
  imageUrl: string;
}

@Schema({ timestamps: true })
export class TftChampion extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  cost: number;

  @Prop({ type: [String], required: true })
  traits: string[];

  @Prop({ type: Object })
  ability: {
    name: string;
    description: string;
    mana: string;
  };

  @Prop({ type: Object })
  stats: {
    health: string;
    mana: string;
    armor: string;
    magicResist: string;
    dps: string;
    damage: string;
    attackSpeed: string;
    critRate: string;
    range: string;
  };

  @Prop({ type: [String] })
  recommendedItems: string[];

  @Prop({ type: [Object] })
  recommendedItemsData: RecommendedItemData[];

  @Prop()
  imageUrl: string;

  @Prop()
  patch: string;

  @Prop()
  setNumber: number;
}

export const TftChampionSchema = SchemaFactory.createForClass(TftChampion); 