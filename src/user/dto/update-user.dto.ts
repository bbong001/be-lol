import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsBoolean,
} from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'User name', example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'User password', example: 'Secur3P@ssw0rd' })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiProperty({
    description: 'User role',
    example: 'user',
    enum: ['user', 'admin'],
  })
  @IsOptional()
  @IsEnum(['user', 'admin'])
  role?: string;

  @ApiProperty({ description: 'User is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
