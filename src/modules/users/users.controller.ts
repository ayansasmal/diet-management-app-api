import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * Users controller for profile management.
 * All endpoints require JWT authentication.
 */
@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create or update user profile.
   * This endpoint uses upsert behavior - creates if not exists, updates if exists.
   */
  @Post('profile')
  @ApiOperation({
    summary: 'Create or update profile',
    description:
      'Create a new user profile or update existing. Automatically calculates BMR, BMI, and diet level based on provided metrics.',
  })
  @ApiResponse({
    status: 201,
    description: 'Profile created/updated successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async createProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createProfileDto: CreateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.usersService.createOrUpdateProfile(user.userId, createProfileDto);
  }

  /**
   * Get current user profile with health calculations.
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Get user profile',
    description:
      'Retrieve the current user profile with all health metrics and CSIRO diet recommendations.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile data',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  async getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProfileResponseDto> {
    return this.usersService.getProfile(user.userId);
  }

  /**
   * Partially update user profile.
   */
  @Patch('profile')
  @ApiOperation({
    summary: 'Update profile',
    description:
      'Partially update user profile. Only provided fields will be updated. Health metrics are recalculated.',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Profile not found',
  })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.usersService.updateProfile(user.userId, updateProfileDto);
  }
}
