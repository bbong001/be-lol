import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class TftItem extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: Object })
  stats: Record<string, any>;

  @Prop({ type: [String] })
  components: string[];

  @Prop()
  isBasic: boolean;

  @Prop()
  imageUrl: string;

  @Prop()
  patch: string;
}

export const TftItemSchema = SchemaFactory.createForClass(TftItem); 