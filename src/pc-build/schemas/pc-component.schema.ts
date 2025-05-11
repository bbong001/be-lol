import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PCComponentDocument = PCComponent & Document;

export enum ComponentType {
  CPU = 'cpu',
  GPU = 'gpu',
  RAM = 'ram',
  MOTHERBOARD = 'motherboard',
  STORAGE = 'storage',
  PSU = 'psu',
  CASE = 'case',
  COOLING = 'cooling',
  MONITOR = 'monitor',
  KEYBOARD = 'keyboard',
  MOUSE = 'mouse',
  HEADSET = 'headset',
}

@Schema({ timestamps: true })
export class PCComponent {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: Object.values(ComponentType) })
  type: ComponentType;

  @Prop({ required: true })
  brand: string;

  @Prop()
  model: string;

  @Prop()
  price: number;

  @Prop()
  imageUrl: string;

  @Prop({ type: Object })
  specs: Record<string, any>;

  @Prop()
  description: string;

  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ type: [String] })
  compatibleWith: string[];
}

export const PCComponentSchema = SchemaFactory.createForClass(PCComponent);
