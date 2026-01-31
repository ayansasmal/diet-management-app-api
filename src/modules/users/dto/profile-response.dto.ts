import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for user profile with calculated health metrics.
 */
export class ProfileResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'clrx1234567890abcdef',
  })
  userId: string;

  @ApiProperty({
    description: 'Height in centimeters',
    example: 175,
  })
  heightCm: number;

  @ApiProperty({
    description: 'Current weight in kilograms',
    example: 80,
  })
  weightKg: number;

  @ApiProperty({
    description: 'Age in years',
    example: 35,
  })
  age: number;

  @ApiProperty({
    description: 'Biological sex',
    example: 'male',
  })
  sex: string;

  @ApiProperty({
    description: 'Physical activity level',
    example: 'moderately_active',
  })
  activityLevel: string;

  @ApiProperty({
    description: 'Target weight in kilograms',
    example: 70,
  })
  targetWeightKg: number;

  @ApiProperty({
    description: 'CSIRO diet level (1, 2, or 3)',
    example: 2,
  })
  dietLevel: number;

  @ApiProperty({
    description: 'Basal Metabolic Rate (calories/day at rest)',
    example: 1750,
  })
  bmr: number;

  @ApiProperty({
    description: 'Body Mass Index',
    example: 26.1,
  })
  bmi: number;

  @ApiProperty({
    description: 'BMI category (e.g., Normal, Overweight)',
    example: 'Overweight',
  })
  bmiCategory: string;

  @ApiProperty({
    description: 'Target BMI at goal weight',
    example: 22.9,
  })
  targetBmi: number;

  @ApiProperty({
    description: 'Target BMI category',
    example: 'Normal',
  })
  targetBmiCategory: string;

  @ApiProperty({
    description: 'Daily calorie target for weight loss',
    example: 1600,
  })
  dailyCalorieTarget: number;

  @ApiProperty({
    description: 'Total Daily Energy Expenditure (calories)',
    example: 2100,
  })
  tdee: number;

  @ApiProperty({
    description: 'Weight to lose to reach target (kg)',
    example: 10,
  })
  weightToLose: number;

  @ApiProperty({
    description: 'Estimated weeks to reach target weight',
    example: 20,
    nullable: true,
  })
  estimatedWeeksToTarget: number | null;

  @ApiProperty({
    description: 'Profile creation timestamp',
    example: '2026-01-18T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Profile last updated timestamp',
    example: '2026-01-18T10:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'UI theme preference',
    example: 'system',
    enum: ['light', 'dark', 'system'],
  })
  themePreference: 'light' | 'dark' | 'system';
}
