/**
 * Food Response DTOs
 *
 * DTOs for food database API responses.
 * Includes categories, items, and servings.
 *
 * @module modules/foods/dto/food-response
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Food category response DTO.
 */
export class FoodCategoryDto {
  @ApiProperty({ description: 'Category ID' })
  id: string;

  @ApiProperty({ description: 'Category name', example: 'Protein' })
  name: string;

  @ApiProperty({ description: 'URL-friendly slug', example: 'protein' })
  slug: string;

  @ApiPropertyOptional({ description: 'Category description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Category icon (emoji)', example: '🥩' })
  icon?: string;

  @ApiPropertyOptional({ description: 'UI color (hex)', example: '#EF4444' })
  color?: string;

  @ApiProperty({ description: 'Display order', example: 1 })
  sortOrder: number;

  @ApiPropertyOptional({
    description: 'Unit name for this category',
    example: 'protein unit',
  })
  unitName?: string;

  @ApiPropertyOptional({
    description: 'Unit description',
    example: 'Approximately 7g of protein',
  })
  unitDescription?: string;
}

/**
 * Serving size with full nutrition data.
 */
export class FoodServingDto {
  @ApiProperty({ description: 'Serving ID' })
  id: string;

  @ApiProperty({ description: 'Serving name', example: '100g' })
  servingName: string;

  @ApiProperty({ description: 'Serving size value', example: 100 })
  servingSize: number;

  @ApiProperty({ description: 'Serving unit', example: 'g' })
  servingUnit: string;

  @ApiProperty({ description: 'Is default serving for this food' })
  isDefault: boolean;

  @ApiProperty({
    description: 'Is this the "1 unit" serving for the category',
  })
  isUnitServing: boolean;

  // Macronutrients
  @ApiProperty({ description: 'Calories (kcal)', example: 165 })
  calories: number;

  @ApiProperty({ description: 'Protein (g)', example: 31 })
  protein: number;

  @ApiProperty({ description: 'Total carbohydrates (g)', example: 0 })
  carbs: number;

  @ApiProperty({ description: 'Fat (g)', example: 3.6 })
  fat: number;

  // Extended nutrition
  @ApiPropertyOptional({ description: 'Fiber (g)', example: 0 })
  fiber?: number;

  @ApiPropertyOptional({ description: 'Sugar (g)', example: 0 })
  sugar?: number;

  @ApiPropertyOptional({ description: 'Saturated fat (g)', example: 1 })
  saturatedFat?: number;

  @ApiPropertyOptional({ description: 'Sodium (mg)', example: 74 })
  sodium?: number;

  @ApiPropertyOptional({ description: 'Cholesterol (mg)', example: 85 })
  cholesterol?: number;

  @ApiPropertyOptional({ description: 'Potassium (mg)', example: 256 })
  potassium?: number;

  // Glycemic data
  @ApiPropertyOptional({ description: 'Glycemic index (0-100)' })
  glycemicIndex?: number;

  @ApiPropertyOptional({ description: 'Glycemic load' })
  glycemicLoad?: number;
}

/**
 * Food item response DTO.
 */
export class FoodItemDto {
  @ApiProperty({ description: 'Food ID' })
  id: string;

  @ApiProperty({ description: 'Food name', example: 'Chicken Breast' })
  name: string;

  @ApiPropertyOptional({
    description: 'Brand name',
    example: 'Woolworths Free Range',
  })
  brandName?: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiProperty({ description: 'Category ID' })
  categoryId: string;

  @ApiPropertyOptional({ description: 'Category details', type: FoodCategoryDto })
  category?: FoodCategoryDto;

  @ApiProperty({ description: 'Is admin-verified data' })
  isVerified: boolean;

  @ApiProperty({ description: 'Is publicly visible' })
  isPublic: boolean;

  @ApiProperty({
    description: 'Food tags',
    type: [String],
    example: ['low-carb', 'high-protein'],
  })
  tags: string[];

  @ApiPropertyOptional({ description: 'Barcode (EAN/UPC)' })
  barcode?: string;

  @ApiPropertyOptional({ description: 'Food image URL' })
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Nutrition label image URL' })
  nutritionLabelUrl?: string;

  @ApiProperty({ description: 'Available serving sizes', type: [FoodServingDto] })
  servings: FoodServingDto[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}

/**
 * Simplified food for list/search responses.
 */
export class FoodSummaryDto {
  @ApiProperty({ description: 'Food ID' })
  id: string;

  @ApiProperty({ description: 'Food name', example: 'Chicken Breast' })
  name: string;

  @ApiPropertyOptional({ description: 'Brand name' })
  brandName?: string;

  @ApiProperty({ description: 'Category slug', example: 'protein' })
  categorySlug: string;

  @ApiProperty({ description: 'Category name', example: 'Protein' })
  categoryName: string;

  @ApiPropertyOptional({ description: 'Category icon', example: '🥩' })
  categoryIcon?: string;

  @ApiProperty({ description: 'Is admin-verified data' })
  isVerified: boolean;

  @ApiProperty({
    description: 'Food tags',
    type: [String],
    example: ['low-carb', 'high-protein'],
  })
  tags: string[];

  // Default serving nutrition (for quick display)
  @ApiProperty({ description: 'Default serving name', example: '100g' })
  defaultServingName: string;

  @ApiProperty({ description: 'Calories per default serving' })
  calories: number;

  @ApiProperty({ description: 'Protein per default serving (g)' })
  protein: number;

  @ApiProperty({ description: 'Carbs per default serving (g)' })
  carbs: number;

  @ApiProperty({ description: 'Fat per default serving (g)' })
  fat: number;
}

/**
 * Paginated food list response.
 */
export class FoodListResponseDto {
  @ApiProperty({ description: 'Food items', type: [FoodSummaryDto] })
  items: FoodSummaryDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Has more pages' })
  hasMore: boolean;
}
