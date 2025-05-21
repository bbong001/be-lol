import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class TftAugment extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  tier: string;

  @Prop({ type: [String] })
  synergies: string[];

  @Prop()
  imageUrl: string;

  @Prop()
  patch: string;
}

export const TftAugmentSchema = SchemaFactory.createForClass(TftAugment);
