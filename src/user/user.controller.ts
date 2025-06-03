import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Header,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/decorators/roles.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Get('me')
  async getCurrentUser(@Request() req) {
    return {
      status: 'success',
      data: await this.userService.findOne(req.user.userId),
    };
  }

  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Get()
  async getAllUsers() {
    return {
      status: 'success',
      data: await this.userService.findAll(),
    };
  }

  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return {
      status: 'success',
      data: await this.userService.findOne(id),
    };
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Put('me')
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return {
      status: 'success',
      data: await this.userService.update(req.user.userId, updateUserDto),
    };
  }

  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return {
      status: 'success',
      data: await this.userService.remove(id),
    };
  }

  @ApiOperation({ summary: 'Add summoner ID to user account' })
  @ApiParam({
    name: 'summonerId',
    description: 'Summoner ID to connect to account',
  })
  @ApiResponse({ status: 200, description: 'Summoner ID added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @Post('me/summoner/:summonerId')
  async addSummonerId(@Request() req, @Param('summonerId') summonerId: string) {
    return {
      status: 'success',
      data: await this.userService.addSummonerId(req.user.userId, summonerId),
    };
  }
}
