import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { WrChampion } from './wr-champion.schema';

@Schema({ timestamps: true })
export class WrGuide extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'WrChampion',
    required: true,
  })
  championId: WrChampion;

  @Prop()
  content: string;

  @Prop({ type: [String] })
  tags: string[];

  @Prop({ type: [String] })
  recommendedItems: string[];

  @Prop({ type: [String] })
  recommendedRunes: string[];

  @Prop({ type: Object })
  skillOrder: {
    first: string;
    second: string;
    third: string;
    ultimate: string;
  };

  @Prop({ type: [String] })
  counters: string[];

  @Prop({ type: [String] })
  synergies: string[];

  @Prop()
  difficulty: string;

  @Prop()
  authorName: string;

  @Prop()
  patch: string;
}

export const WrGuideSchema = SchemaFactory.createForClass(WrGuide);
