import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class WrRune extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop()
  category: string;

  @Prop()
  slot: number;

  @Prop({ type: [String] })
  recommendedFor: string[];

  @Prop()
  imageUrl: string;

  @Prop()
  patch: string;
}

export const WrRuneSchema = SchemaFactory.createForClass(WrRune); 