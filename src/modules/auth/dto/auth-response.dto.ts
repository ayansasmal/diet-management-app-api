import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * User data returned in auth responses.
 */
export class UserDto {
  @ApiProperty({
    description: 'Unique user ID',
    example: 'clrx1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'User display name from Google profile',
    example: 'John Doe',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Google profile picture URL',
    example: 'https://lh3.googleusercontent.com/a/...',
  })
  picture?: string;

  @ApiProperty({
    description: 'User role (user or admin)',
    example: 'user',
    enum: ['user', 'admin'],
  })
  role: string;

  @ApiProperty({
    description: 'Whether user has completed profile setup',
    example: false,
  })
  hasProfile: boolean;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2026-01-18T10:00:00.000Z',
  })
  createdAt: Date;
}

/**
 * Response DTO for successful authentication.
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token type (always "Bearer")',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Token expiration in seconds',
    example: 86400,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Authenticated user data',
    type: UserDto,
  })
  user: UserDto;
}
