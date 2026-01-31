/**
 * Create Plan DTO
 *
 * DTO for creating a new nutrition plan (admin/premium feature).
 *
 * @module modules/plans/dto/create-plan
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  IsObject,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Numeric constraint for macro targets.
 */
export class NumericConstraintInput {
  @ApiPropertyOptional({ description: 'Target value', example: 1800 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  target?: number;

  @ApiPropertyOptional({ description: 'Minimum allowed', example: 1600 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min?: number;

  @ApiPropertyOptional({ description: 'Maximum allowed', example: 2000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max?: number;
}

/**
 * Daily macro targets input.
 */
export class MacroTargetsInput {
  @ApiProperty({ description: 'Calorie targets' })
  @ValidateNested()
  @Type(() => NumericConstraintInput)
  calories: NumericConstraintInput;

  @ApiProperty({ description: 'Protein targets (grams)' })
  @ValidateNested()
  @Type(() => NumericConstraintInput)
  protein: NumericConstraintInput;

  @ApiProperty({ description: 'Carbohydrate targets (grams)' })
  @ValidateNested()
  @Type(() => NumericConstraintInput)
  carbs: NumericConstraintInput;

  @ApiProperty({ description: 'Fat targets (grams)' })
  @ValidateNested()
  @Type(() => NumericConstraintInput)
  fat: NumericConstraintInput;

  @ApiPropertyOptional({ description: 'Fiber targets (grams)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => NumericConstraintInput)
  fiber?: NumericConstraintInput;

  @ApiPropertyOptional({ description: 'Sugar targets (grams)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => NumericConstraintInput)
  sugar?: NumericConstraintInput;

  @ApiPropertyOptional({ description: 'Sodium targets (mg)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => NumericConstraintInput)
  sodium?: NumericConstraintInput;
}

/**
 * Meal slot input.
 */
export class MealSlotInput {
  @ApiProperty({ description: 'Unique slot identifier', example: 'breakfast' })
  @IsString()
  @MaxLength(50)
  id: string;

  @ApiProperty({ description: 'Type of meal', example: 'breakfast' })
  @IsString()
  @IsIn(['breakfast', 'lunch', 'dinner', 'snack'])
  type: string;

  @ApiProperty({ description: 'Display name', example: 'Breakfast' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Display order', example: 1 })
  @IsNumber()
  @Min(1)
  @Max(10)
  order: number;

  @ApiProperty({ description: 'Whether this meal is required', example: true })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({ description: 'Per-meal macro targets' })
  @IsOptional()
  @IsObject()
  targetMacros?: Record<string, NumericConstraintInput>;
}

/**
 * Meal flow configuration input.
 */
export class MealFlowConfigInput {
  @ApiProperty({ description: 'Meal slots for the day', type: [MealSlotInput] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealSlotInput)
  slots: MealSlotInput[];

  @ApiProperty({ description: 'Whether meals can be skipped', example: false })
  @IsBoolean()
  allowSkipping: boolean;

  @ApiProperty({
    description: 'Whether meal order can be changed',
    example: false,
  })
  @IsBoolean()
  allowReordering: boolean;

  @ApiPropertyOptional({
    description: 'Minimum minutes between meals',
    example: 180,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(480)
  minTimeBetweenMeals?: number;
}

/**
 * Nutrition rule input.
 */
export class NutritionRuleInput {
  @ApiProperty({ description: 'Rule unique identifier', example: 'net_carbs' })
  @IsString()
  @MaxLength(50)
  id: string;

  @ApiProperty({ description: 'Rule type', example: 'preferNetCarbs' })
  @IsString()
  @IsIn([
    'preferNetCarbs',
    'proteinPerMealMinimum',
    'limitUltraProcessed',
    'mealTiming',
    'foodCategoryRestriction',
    'macroRatio',
    'glycemicControl',
  ])
  type: string;

  @ApiProperty({ description: 'Rule display name', example: 'Use Net Carbs' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Rule description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Severity level', example: 'warning' })
  @IsString()
  @IsIn(['info', 'warning', 'error'])
  severity: string;

  @ApiProperty({ description: 'Whether rule is enabled', example: true })
  @IsBoolean()
  enabled: boolean;

  // Rule-specific properties (optional based on rule type)
  @ApiPropertyOptional({ description: 'Minimum grams (for protein rules)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minGrams?: number;

  @ApiPropertyOptional({ description: 'Maximum percentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  maxPercentage?: number;

  @ApiPropertyOptional({ description: 'Target macro for ratio rules' })
  @IsOptional()
  @IsString()
  @IsIn(['protein', 'carbs', 'fat'])
  macro?: string;

  @ApiPropertyOptional({ description: 'Percentage constraint' })
  @IsOptional()
  @ValidateNested()
  @Type(() => NumericConstraintInput)
  percentage?: NumericConstraintInput;
}

/**
 * Create plan DTO.
 */
export class CreatePlanDto {
  @ApiProperty({ description: 'Plan name', example: 'My Custom Plan' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Short description',
    example: 'A personalized nutrition plan',
  })
  @IsString()
  @MaxLength(200)
  shortDescription: string;

  @ApiPropertyOptional({ description: 'Detailed description' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  longDescription?: string;

  @ApiPropertyOptional({
    description: 'Visibility (defaults to private for user-created)',
    example: 'private',
    enum: ['public', 'private'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['public', 'private'])
  visibility?: string;

  @ApiPropertyOptional({
    description: 'Difficulty level',
    example: 'intermediate',
    enum: ['beginner', 'intermediate', 'advanced'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  difficulty?: string;

  @ApiPropertyOptional({
    description: 'Plan tags',
    example: ['low-carb', 'custom'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Source attribution' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceAttribution?: string;

  @ApiPropertyOptional({ description: 'Plan icon emoji', example: '🥗' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;

  @ApiPropertyOptional({ description: 'Accent color (hex)', example: '#10B981' })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  accentColor?: string;

  @ApiProperty({ description: 'Daily macro targets', type: MacroTargetsInput })
  @ValidateNested()
  @Type(() => MacroTargetsInput)
  dailyTargets: MacroTargetsInput;

  @ApiProperty({
    description: 'Meal flow configuration',
    type: MealFlowConfigInput,
  })
  @ValidateNested()
  @Type(() => MealFlowConfigInput)
  mealFlow: MealFlowConfigInput;

  @ApiPropertyOptional({
    description: 'Plan rules',
    type: [NutritionRuleInput],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NutritionRuleInput)
  rules?: NutritionRuleInput[];

  @ApiPropertyOptional({
    description: 'Whether to use net carbs calculation',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  useNetCarbs?: boolean;

  @ApiPropertyOptional({
    description: 'Default serving size multiplier',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(3)
  defaultServingMultiplier?: number;

  @ApiPropertyOptional({
    description: 'Tips for following the plan',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tips?: string[];

  @ApiPropertyOptional({
    description:
      'Flexible extensions - any dietician-specific custom fields (cooking guidelines, supplements, client context, etc.)',
    example: {
      cookingFatBudget: { breakfast: '1 tsp ghee', lunch: '2 tbsp olive oil' },
      supplements: [{ name: 'Whey Protein', timing: 'breakfast', amount: '1 scoop' }],
      clientContext: { weight: 80, height: 170, age: 35 },
    },
  })
  @IsOptional()
  @IsObject()
  extensions?: Record<string, unknown>;
}
