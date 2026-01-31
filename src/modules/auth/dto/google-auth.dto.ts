import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for Google OAuth authentication.
 * Contains the ID token (credential) returned by Google Sign-In.
 */
export class GoogleAuthDto {
  @ApiProperty({
    description: 'Google ID token (credential) from Sign In with Google',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Google credential token is required' })
  credential: string;
}
