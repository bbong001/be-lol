import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { TftChampion } from './tft-champion.schema';

@Schema({ timestamps: true })
export class TftComp extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'TftChampion' }] })
  champions: TftChampion[];

  @Prop({ type: [String] })
  traits: string[];

  @Prop({ type: [String] })
  earlyGame: string[];

  @Prop({ type: [String] })
  midGame: string[];

  @Prop({ type: Object })
  itemPriority: Record<string, string[]>;

  @Prop()
  difficulty: string;

  @Prop()
  tier: string;

  @Prop()
  patch: string;

  @Prop()
  imageUrl: string;
}

export const TftCompSchema = SchemaFactory.createForClass(TftComp);
