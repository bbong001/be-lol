import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @ApiProperty({ description: 'User ID', example: '507f1f77bcf86cd799439011' })
  _id: MongooseSchema.Types.ObjectId;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({ description: 'User name', example: 'John Doe' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'User password (hashed)', example: '*****' })
  @Prop({ required: true })
  password: string;

  @ApiProperty({
    description: 'User role',
    example: 'user',
    enum: ['user', 'admin'],
  })
  @Prop({ default: 'user', enum: ['user', 'admin'] })
  role: string;

  @ApiProperty({
    description: 'Summoner IDs connected to this account',
    type: [String],
  })
  @Prop({ type: [String], default: [] })
  summonerIds: string[];

  @ApiProperty({ description: 'User is active', example: true })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Refresh token for JWT authentication' })
  @Prop()
  refreshToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
