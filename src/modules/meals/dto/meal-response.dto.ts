/**
 * Meal Response DTOs
 *
 * DTOs for meal logging API responses.
 * Includes meal logs and food items within meals.
 *
 * @module modules/meals/dto/meal-response
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Food item within a meal response DTO.
 */
export class MealFoodItemDto {
  @ApiProperty({ description: 'Item ID' })
  id: string;

  @ApiPropertyOptional({ description: 'Reference to food ID (may be null if food was deleted)' })
  foodId?: string;

  @ApiPropertyOptional({ description: 'Reference to serving ID' })
  servingId?: string;

  @ApiProperty({ description: 'Food name (snapshot at logging time)', example: 'Chicken Breast' })
  foodName: string;

  @ApiProperty({ description: 'Serving description', example: '100g' })
  servingName: string;

  @ApiProperty({ description: 'Number of servings', example: 1.5 })
  quantity: number;

  @ApiProperty({ description: 'Total calories (serving × quantity)', example: 247.5 })
  calories: number;

  @ApiProperty({ description: 'Total protein in grams', example: 46.5 })
  protein: number;

  @ApiProperty({ description: 'Total carbs in grams', example: 0 })
  carbs: number;

  @ApiProperty({ description: 'Total fat in grams', example: 5.4 })
  fat: number;

  @ApiProperty({ description: 'Total fiber in grams', example: 0 })
  fiber: number;

  @ApiProperty({ description: 'Is this a custom inline entry', example: false })
  isCustomEntry: boolean;
}

/**
 * Meal type enum values.
 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * Meal log response DTO.
 */
export class MealLogDto {
  @ApiProperty({ description: 'Meal log ID' })
  id: string;

  @ApiProperty({ description: 'Date of the meal (YYYY-MM-DD)', example: '2026-01-25' })
  mealDate: string;

  @ApiProperty({
    description: 'Meal type',
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    example: 'lunch',
  })
  mealType: MealType;

  @ApiPropertyOptional({ description: 'Specific time of the meal (ISO timestamp)' })
  mealTime?: string;

  // Calculated totals
  @ApiProperty({ description: 'Total calories', example: 450 })
  totalCalories: number;

  @ApiProperty({ description: 'Total protein in grams', example: 35 })
  totalProtein: number;

  @ApiProperty({ description: 'Total carbs in grams', example: 20 })
  totalCarbs: number;

  @ApiProperty({ description: 'Total fat in grams', example: 15 })
  totalFat: number;

  @ApiProperty({ description: 'Total fiber in grams', example: 5 })
  totalFiber: number;

  // User experience data
  @ApiPropertyOptional({ description: 'Photo URL (S3)' })
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'User rating (1-5)', example: 4 })
  rating?: number;

  @ApiPropertyOptional({ description: 'User notes about the meal' })
  notes?: string;

  @ApiProperty({ description: 'Food items in this meal', type: [MealFoodItemDto] })
  foodItems: MealFoodItemDto[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

/**
 * Simplified meal summary for list views.
 */
export class MealSummaryDto {
  @ApiProperty({ description: 'Meal log ID' })
  id: string;

  @ApiProperty({ description: 'Date of the meal', example: '2026-01-25' })
  mealDate: string;

  @ApiProperty({
    description: 'Meal type',
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    example: 'lunch',
  })
  mealType: MealType;

  @ApiProperty({ description: 'Total calories', example: 450 })
  totalCalories: number;

  @ApiProperty({ description: 'Total protein in grams', example: 35 })
  totalProtein: number;

  @ApiProperty({ description: 'Total carbs in grams', example: 20 })
  totalCarbs: number;

  @ApiProperty({ description: 'Total fat in grams', example: 15 })
  totalFat: number;

  @ApiProperty({ description: 'Number of food items', example: 3 })
  itemCount: number;

  @ApiPropertyOptional({ description: 'Photo URL thumbnail' })
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'User rating', example: 4 })
  rating?: number;
}

/**
 * Daily summary with all meals for a day.
 */
export class DailySummaryDto {
  @ApiProperty({ description: 'Date', example: '2026-01-25' })
  date: string;

  @ApiProperty({ description: 'Total calories for the day', example: 1500 })
  totalCalories: number;

  @ApiProperty({ description: 'Total protein for the day', example: 120 })
  totalProtein: number;

  @ApiProperty({ description: 'Total carbs for the day', example: 80 })
  totalCarbs: number;

  @ApiProperty({ description: 'Total fat for the day', example: 60 })
  totalFat: number;

  @ApiProperty({ description: 'Total fiber for the day', example: 25 })
  totalFiber: number;

  @ApiProperty({ description: 'Meals logged for the day', type: [MealSummaryDto] })
  meals: MealSummaryDto[];
}

/**
 * Meal history response with pagination.
 */
export class MealHistoryResponseDto {
  @ApiProperty({ description: 'Meal entries', type: [MealSummaryDto] })
  meals: MealSummaryDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Has more pages' })
  hasMore: boolean;
}
