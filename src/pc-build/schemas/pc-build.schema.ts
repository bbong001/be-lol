import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export type PCBuildDocument = PCBuild & Document;

@Schema({ timestamps: true })
export class PCBuild {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  imageUrl: string;

  @Prop({ type: [String] })
  tags: string[];

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: User;

  @Prop({ type: String, enum: ['vi', 'en'], default: 'vi' })
  lang: string;
}

export const PCBuildSchema = SchemaFactory.createForClass(PCBuild);
