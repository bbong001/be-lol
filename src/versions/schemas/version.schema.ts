import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type VersionDocument = Version & Document;

@Schema({ timestamps: true })
export class Version {
  @Prop({ required: true })
  game: string; // 'lol', 'tft', or 'wildrift'

  @Prop({ required: true })
  version: string;

  @Prop()
  releasedAt: Date;

  @Prop({ default: true })
  isLatest: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const VersionSchema = SchemaFactory.createForClass(Version);
