import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Interface for multilingual text
export interface MultilingualText {
  en: string;
  vi: string;
}

@Schema({ timestamps: true })
export class TftItem extends Document {
  @Prop({
    type: Object,
    required: true,
    _id: false,
  })
  name: MultilingualText;

  @Prop({
    type: Object,
    _id: false,
  })
  description: MultilingualText;

  @Prop({ type: Object })
  stats: Record<string, any>;

  @Prop({ type: [String] })
  components: string[];

  @Prop()
  isBasic: boolean;

  @Prop()
  imageUrl: string;

  @Prop({ required: true })
  patch: string;

  // Add language field for backward compatibility and filtering
  @Prop({ default: 'en' })
  lang: string;
}

export const TftItemSchema = SchemaFactory.createForClass(TftItem);
