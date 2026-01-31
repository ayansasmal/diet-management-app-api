/**
 * Meal Create/Update DTOs
 *
 * DTOs for creating and updating meal logs.
 *
 * @module modules/meals/dto/create-meal
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsDateString,
  IsUrl,
  ArrayMinSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * Valid meal types.
 */
export enum MealTypeEnum {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

/**
 * Food item to add to a meal.
 * Can reference an existing food or be a custom inline entry.
 */
export class CreateMealFoodItemDto {
  @ApiPropertyOptional({
    description: 'Food ID (optional for custom entries)',
  })
  @IsOptional()
  @IsString()
  foodId?: string;

  @ApiPropertyOptional({
    description: 'Serving ID (optional for custom entries)',
  })
  @IsOptional()
  @IsString()
  servingId?: string;

  @ApiProperty({
    description: 'Food name (required for custom entries, auto-filled for existing foods)',
    example: 'Chicken Breast',
  })
  @IsString()
  foodName: string;

  @ApiProperty({
    description: 'Serving description (required for custom entries)',
    example: '100g',
  })
  @IsString()
  servingName: string;

  @ApiProperty({
    description: 'Number of servings',
    example: 1.5,
    minimum: 0.1,
    maximum: 100,
  })
  @IsNumber()
  @Min(0.1)
  @Max(100)
  quantity: number;

  @ApiProperty({
    description: 'Calories per serving (required for custom entries)',
    example: 165,
  })
  @IsNumber()
  @Min(0)
  calories: number;

  @ApiProperty({
    description: 'Protein per serving in grams',
    example: 31,
  })
  @IsNumber()
  @Min(0)
  protein: number;

  @ApiProperty({
    description: 'Carbs per serving in grams',
    example: 0,
  })
  @IsNumber()
  @Min(0)
  carbs: number;

  @ApiProperty({
    description: 'Fat per serving in grams',
    example: 3.6,
  })
  @IsNumber()
  @Min(0)
  fat: number;

  @ApiPropertyOptional({
    description: 'Fiber per serving in grams',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fiber?: number;

  @ApiPropertyOptional({
    description: 'Is this a custom inline entry (not from food database)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isCustomEntry?: boolean;
}

/**
 * Create a new meal log.
 */
export class CreateMealDto {
  @ApiPropertyOptional({
    description: 'Date of the meal (YYYY-MM-DD), defaults to today',
    example: '2026-01-25',
  })
  @IsOptional()
  @IsDateString()
  mealDate?: string;

  @ApiProperty({
    description: 'Meal type',
    enum: MealTypeEnum,
    example: 'lunch',
  })
  @IsEnum(MealTypeEnum)
  mealType: MealTypeEnum;

  @ApiPropertyOptional({
    description: 'Specific time of the meal (HH:mm format)',
    example: '12:30',
  })
  @IsOptional()
  @IsString()
  mealTime?: string;

  @ApiProperty({
    description: 'Food items in this meal',
    type: [CreateMealFoodItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateMealFoodItemDto)
  foodItems: CreateMealFoodItemDto[];

  @ApiPropertyOptional({
    description: 'Photo URL (pre-uploaded to S3)',
  })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @ApiPropertyOptional({
    description: 'User rating of the meal (1-5 stars)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Transform(({ value }) => (value !== null ? Number(value) : null))
  rating?: number;

  @ApiPropertyOptional({
    description: 'User notes about the meal (how they felt, meal quality, etc.)',
    example: 'Felt energized after this meal. Will make again!',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Update an existing meal log.
 * All fields are optional.
 */
export class UpdateMealDto extends PartialType(CreateMealDto) {}

/**
 * Add food item to existing meal.
 */
export class AddFoodItemDto extends CreateMealFoodItemDto {}

/**
 * Update meal metadata (rating, notes, photo).
 * Does not affect food items.
 */
export class UpdateMealMetadataDto {
  @ApiPropertyOptional({
    description: 'Photo URL',
  })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @ApiPropertyOptional({
    description: 'User rating (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'User notes about the meal',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Quick log a meal with a single food item.
 * Convenience endpoint for common use case.
 */
export class QuickLogMealDto {
  @ApiPropertyOptional({
    description: 'Date of the meal (YYYY-MM-DD), defaults to today',
  })
  @IsOptional()
  @IsDateString()
  mealDate?: string;

  @ApiProperty({
    description: 'Meal type',
    enum: MealTypeEnum,
    example: 'breakfast',
  })
  @IsEnum(MealTypeEnum)
  mealType: MealTypeEnum;

  @ApiProperty({
    description: 'Food ID from database',
  })
  @IsString()
  foodId: string;

  @ApiProperty({
    description: 'Serving ID to use',
  })
  @IsString()
  servingId: string;

  @ApiPropertyOptional({
    description: 'Number of servings',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(100)
  quantity?: number;
}
