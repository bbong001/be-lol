import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class WrItem extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: Object })
  stats: Record<string, any>;

  @Prop()
  price: number;

  @Prop({ type: [String] })
  buildsFrom: string[];

  @Prop({ type: [String] })
  buildsInto: string[];

  @Prop()
  category: string;

  @Prop()
  isActive: boolean;

  @Prop()
  activeDescription: string;

  @Prop()
  cooldown: number;

  @Prop()
  imageUrl: string;

  @Prop()
  patch: string;
}

export const WrItemSchema = SchemaFactory.createForClass(WrItem);
