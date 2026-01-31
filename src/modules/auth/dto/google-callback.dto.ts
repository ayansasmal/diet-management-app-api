import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for Google OAuth callback.
 * Contains the authorization code returned by Google authorization endpoint.
 */
export class GoogleCallbackDto {
    @ApiProperty({
        description: 'Authorization code from Google OAuth flow',
        example: '4/0AY0e-g...',
    })
    @IsString()
    @IsNotEmpty({ message: 'Authorization code is required' })
    code: string;
}
