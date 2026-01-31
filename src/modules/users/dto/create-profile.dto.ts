import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsIn,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

/**
 * DTO for creating or updating a user profile.
 * All health metrics are validated for reasonable ranges.
 */
export class CreateProfileDto {
  @ApiProperty({
    description: 'Height in centimeters',
    example: 175,
    minimum: 100,
    maximum: 250,
  })
  @IsNumber()
  @Min(100, { message: 'Height must be at least 100 cm' })
  @Max(250, { message: 'Height must not exceed 250 cm' })
  heightCm: number;

  @ApiProperty({
    description: 'Current weight in kilograms',
    example: 80,
    minimum: 30,
    maximum: 300,
  })
  @IsNumber()
  @Min(30, { message: 'Weight must be at least 30 kg' })
  @Max(300, { message: 'Weight must not exceed 300 kg' })
  weightKg: number;

  @ApiProperty({
    description: 'Age in years',
    example: 35,
    minimum: 18,
    maximum: 120,
  })
  @IsNumber()
  @Min(18, { message: 'Must be at least 18 years old' })
  @Max(120, { message: 'Age must not exceed 120 years' })
  age: number;

  @ApiProperty({
    description: 'Biological sex for BMR calculation',
    example: 'male',
    enum: ['male', 'female'],
  })
  @IsString()
  @IsIn(['male', 'female'], { message: 'Sex must be either male or female' })
  sex: 'male' | 'female';

  @ApiProperty({
    description: 'Physical activity level',
    example: 'moderately_active',
    enum: [
      'sedentary',
      'lightly_active',
      'moderately_active',
      'very_active',
      'extremely_active',
    ],
  })
  @IsString()
  @IsIn(
    [
      'sedentary',
      'lightly_active',
      'moderately_active',
      'very_active',
      'extremely_active',
    ],
    { message: 'Invalid activity level' },
  )
  activityLevel: string;

  @ApiProperty({
    description: 'Target weight in kilograms',
    example: 70,
    minimum: 30,
    maximum: 300,
  })
  @IsNumber()
  @Min(30, { message: 'Target weight must be at least 30 kg' })
  @Max(300, { message: 'Target weight must not exceed 300 kg' })
  targetWeightKg: number;

  @ApiProperty({
    description: 'UI theme preference',
    example: 'system',
    enum: ['light', 'dark', 'system'],
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['light', 'dark', 'system'], { message: 'Theme must be light, dark, or system' })
  themePreference?: 'light' | 'dark' | 'system';
}
