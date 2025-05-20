import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export type ArticleDocument = Article & Document;

@Schema({ timestamps: true })
export class Article {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true,type: [String] })
  content: string[];

  @Prop()
  summary: string;

  @Prop()
  imageUrl: string;

  @Prop({ type: [String] })
  tags: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  author: User;

  @Prop({ default: false })
  published: boolean;

  @Prop()
  publishedAt: Date;

  @Prop({ default: 0 })
  viewCount: number;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);
