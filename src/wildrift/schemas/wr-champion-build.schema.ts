import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { WrChampion } from './wr-champion.schema';

class BuildItem {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  imageUrl: string;
}

class BuildSpell {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  imageUrl: string;
}

class BuildRune {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  imageUrl: string;
}

@Schema({ timestamps: true })
export class WrChampionBuild extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: WrChampion.name,
    required: true,
  })
  championId: MongooseSchema.Types.ObjectId;

  @Prop({ type: [BuildItem] })
  startingItems: BuildItem[];

  @Prop({ type: [BuildItem] })
  coreItems: BuildItem[];

  @Prop({ type: [BuildItem] })
  finalBuildItems: BuildItem[];

  @Prop({ type: [BuildItem] })
  boots: BuildItem[];

  @Prop({ type: [BuildItem] })
  enchantments: BuildItem[];

  @Prop({ type: [BuildItem] })
  situationalItems: BuildItem[];

  @Prop({ type: [BuildSpell] })
  spells: BuildSpell[];

  @Prop({ type: [BuildRune] })
  runes: BuildRune[];

  @Prop({ type: [BuildRune] })
  situationalRunes: BuildRune[];

  @Prop({ type: [String] })
  skillOrder: string[];

  @Prop()
  buildType: string;

  @Prop({ required: true })
  sourceUrl: string;
}

export const WrChampionBuildSchema =
  SchemaFactory.createForClass(WrChampionBuild);
