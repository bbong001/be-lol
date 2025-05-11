import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import * as mongoose from 'mongoose';
import { User } from '../../user/schemas/user.schema';
import { PCComponent } from './pc-component.schema';

export type PCBuildDocument = PCBuild & Document;

@Schema({ timestamps: true })
export class ComponentEntry {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PCComponent',
    required: true,
  })
  component: PCComponent;

  @Prop()
  quantity: number;

  @Prop()
  notes: string;
}

@Schema({ timestamps: true })
export class PCBuild {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  user: User;

  @Prop({ type: [Object] })
  components: ComponentEntry[];

  @Prop()
  totalPrice: number;

  @Prop()
  imageUrl: string;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ type: Object })
  performance: {
    gamesFps?: Record<string, number>;
    benchmarks?: Record<string, number>;
  };

  @Prop({ type: [String] })
  tags: string[];
}

export const PCBuildSchema = SchemaFactory.createForClass(PCBuild);
