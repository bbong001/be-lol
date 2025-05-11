import { ApiProperty } from '@nestjs/swagger';
import { Schema } from 'mongoose';

export class UserDataDto {
  @ApiProperty({
    description: 'ID của người dùng',
    example: '6050c9f72aa2df3a5c5dc08a',
  })
  id: Schema.Types.ObjectId | string;

  @ApiProperty({
    description: 'Tên người dùng',
    example: 'Admin User',
  })
  name: string;

  @ApiProperty({
    description: 'Email người dùng',
    example: 'admin@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Vai trò người dùng',
    example: 'admin',
    enum: ['user', 'admin'],
  })
  role: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Thông tin người dùng',
    type: UserDataDto,
  })
  userData: UserDataDto;

  @ApiProperty({
    description: 'Access token JWT để xác thực',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token JWT để lấy access token mới',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  })
  refreshToken: string;
}
