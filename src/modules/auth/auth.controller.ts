import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { GoogleCallbackDto } from './dto/google-callback.dto';
import { AuthResponseDto, UserDto } from './dto/auth-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * Authentication controller for Google OAuth login.
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  /**
   * Authenticate with Google ID token.
   * This endpoint receives the credential (ID token) from Google Sign-In
   * on the frontend and returns an app JWT token.
   */
  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Google OAuth login',
    description:
      'Authenticate with Google ID token from Sign In with Google. ' +
      'Creates a new user account on first login or returns existing user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid Google token',
  })
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto): Promise<AuthResponseDto> {
    return this.authService.googleAuth(googleAuthDto);
  }

  /**
   * Handle Google OAuth callback (authorization code exchange).
   */
  @Public()
  @Post('google/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Google OAuth callback',
    description:
      'Exchange authorization code for access token and authenticate user. ' +
      'Called after user grants permission on Google consent screen.',
  })
  @ApiResponse({
    status: 200,
    description: 'Callback successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid authorization code',
  })
  async googleCallback(@Body() callbackDto: GoogleCallbackDto): Promise<AuthResponseDto> {
    return this.authService.googleCallback(callbackDto);
  }

  /**
   * Get current authenticated user.
   */
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Get the currently authenticated user profile.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user data',
    type: UserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - invalid or missing token',
  })
  async getCurrentUser(@CurrentUser() user: AuthenticatedUser): Promise<UserDto> {
    return this.authService.getCurrentUser(user.userId);
  }
}
