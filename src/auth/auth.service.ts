import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CreateAdminDto } from './dto/create-admin.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    await this.userService.setCurrentRefreshToken(
      refreshToken,
      user._id.toString(),
    );

    return {
      userData: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async register(registerDto: RegisterDto) {
    const user = await this.userService.create(registerDto);
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    await this.userService.setCurrentRefreshToken(
      refreshToken,
      user._id.toString(),
    );

    return {
      userData: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async registerAdmin(createAdminDto: CreateAdminDto) {
    // Create admin user with role: 'admin'
    const adminData = {
      ...createAdminDto,
      role: 'admin',
    };

    const admin = await this.userService.create(adminData);
    const accessToken = this.generateAccessToken(admin);
    const refreshToken = this.generateRefreshToken(admin);

    await this.userService.setCurrentRefreshToken(
      refreshToken,
      admin._id.toString(),
    );

    return {
      userData: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      accessToken,
      refreshToken,
    };
  }

  private generateAccessToken(user: any) {
    const payload = {
      sub: user._id,
      email: user.email,
      roles: [user.role], // Convert single role to array for consistent access control
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });
  }

  private generateRefreshToken(user: any) {
    const payload = { sub: user._id };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
  }
}
