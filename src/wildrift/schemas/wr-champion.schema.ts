import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class WrChampion extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  title: string;

  @Prop()
  description: string;

  @Prop({ type: [String], required: true })
  roles: string[];

  @Prop({ type: Object })
  abilities: {
    passive: {
      name: string;
      description: string;
      imageUrl: string;
    };
    q: {
      name: string;
      description: string;
      cooldown: number[];
      cost: number[];
      imageUrl: string;
    };
    w: {
      name: string;
      description: string;
      cooldown: number[];
      cost: number[];
      imageUrl: string;
    };
    e: {
      name: string;
      description: string;
      cooldown: number[];
      cost: number[];
      imageUrl: string;
    };
    ultimate: {
      name: string;
      description: string;
      cooldown: number[];
      cost: number[];
      imageUrl: string;
    };
  };

  @Prop({ type: Object })
  stats: {
    health: number;
    healthPerLevel: number;
    mana: number;
    manaPerLevel: number;
    armor: number;
    armorPerLevel: number;
    magicResist: number;
    magicResistPerLevel: number;
    attackDamage: number;
    attackDamagePerLevel: number;
    attackSpeed: number;
    attackSpeedPerLevel: number;
    moveSpeed: number;
  };

  @Prop({ type: [String] })
  recommendedItems: string[];

  @Prop()
  imageUrl: string;

  @Prop()
  splashUrl: string;

  @Prop()
  patch: string;
}

export const WrChampionSchema = SchemaFactory.createForClass(WrChampion);
