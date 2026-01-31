/**
 * Create Food DTOs
 *
 * DTOs for creating and updating food items.
 *
 * @module modules/foods/dto/create-food
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNumber,
  IsInt,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating a serving size.
 */
export class CreateServingDto {
  @ApiProperty({
    description: 'Serving name',
    example: '100g',
  })
  @IsString()
  servingName: string;

  @ApiProperty({
    description: 'Serving size value',
    example: 100,
  })
  @IsNumber()
  @Min(0.1)
  servingSize: number;

  @ApiProperty({
    description: 'Serving unit (g, ml, piece, cup, etc.)',
    example: 'g',
  })
  @IsString()
  servingUnit: string;

  @ApiPropertyOptional({
    description: 'Is this the default serving?',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Is this the "1 unit" serving for the category?',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isUnitServing?: boolean;

  // Required macronutrients
  @ApiProperty({ description: 'Calories (kcal)', example: 165 })
  @IsNumber()
  @Min(0)
  calories: number;

  @ApiProperty({ description: 'Protein (g)', example: 31 })
  @IsNumber()
  @Min(0)
  protein: number;

  @ApiProperty({ description: 'Total carbohydrates (g)', example: 0 })
  @IsNumber()
  @Min(0)
  carbs: number;

  @ApiProperty({ description: 'Fat (g)', example: 3.6 })
  @IsNumber()
  @Min(0)
  fat: number;

  // Optional extended nutrition
  @ApiPropertyOptional({ description: 'Fiber (g)', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fiber?: number;

  @ApiPropertyOptional({ description: 'Sugar (g)', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sugar?: number;

  @ApiPropertyOptional({ description: 'Saturated fat (g)', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  saturatedFat?: number;

  @ApiPropertyOptional({ description: 'Sodium (mg)', example: 74 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sodium?: number;

  @ApiPropertyOptional({ description: 'Cholesterol (mg)', example: 85 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cholesterol?: number;

  @ApiPropertyOptional({ description: 'Potassium (mg)', example: 256 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  potassium?: number;

  @ApiPropertyOptional({ description: 'Glycemic index (0-100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  glycemicIndex?: number;

  @ApiPropertyOptional({ description: 'Glycemic load' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  glycemicLoad?: number;
}

/**
 * DTO for creating a new food item.
 */
export class CreateFoodDto {
  @ApiProperty({
    description: 'Food name',
    example: 'Chicken Breast (skinless)',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Brand name',
    example: 'Woolworths Free Range',
  })
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiPropertyOptional({
    description: 'Food description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Category ID',
  })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({
    description: 'Is publicly visible (default: true for user foods)',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Tags for filtering',
    type: [String],
    example: ['low-carb', 'high-protein', 'whole-food'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Barcode (EAN/UPC)',
  })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({
    description: 'Food image URL',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Nutrition label image URL (photo of packaging)',
  })
  @IsOptional()
  @IsString()
  nutritionLabelUrl?: string;

  @ApiProperty({
    description: 'Serving sizes with nutrition data',
    type: [CreateServingDto],
  })
  @ValidateNested({ each: true })
  @Type(() => CreateServingDto)
  @ArrayMinSize(1, { message: 'At least one serving size is required' })
  servings: CreateServingDto[];
}

/**
 * DTO for updating a food item.
 */
export class UpdateFoodDto {
  @ApiPropertyOptional({ description: 'Food name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Brand name' })
  @IsOptional()
  @IsString()
  brandName?: string;

  @ApiPropertyOptional({ description: 'Food description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Is publicly visible' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Tags for filtering',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Barcode (EAN/UPC)' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ description: 'Food image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Nutrition label image URL' })
  @IsOptional()
  @IsString()
  nutritionLabelUrl?: string;
}

/**
 * DTO for creating a new category (admin only).
 */
export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Protein' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'URL-friendly slug', example: 'protein' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Category icon (emoji)', example: '🥩' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ description: 'UI color (hex)', example: '#EF4444' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'Unit name for this category',
    example: 'protein unit',
  })
  @IsOptional()
  @IsString()
  unitName?: string;

  @ApiPropertyOptional({
    description: 'Unit description',
    example: 'Approximately 7g of protein',
  })
  @IsOptional()
  @IsString()
  unitDescription?: string;
}
