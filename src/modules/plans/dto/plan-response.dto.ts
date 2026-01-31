/**
 * Plan Response DTOs
 *
 * DTOs for nutrition plan API responses.
 * Complex configuration (dailyTargets, mealFlow, rules) are parsed from JSON.
 *
 * @module modules/plans/dto/plan-response
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Numeric constraint for macro targets.
 */
export class NumericConstraintDto {
  @ApiPropertyOptional({ description: 'Target value', example: 1800 })
  target?: number;

  @ApiPropertyOptional({ description: 'Minimum allowed', example: 1600 })
  min?: number;

  @ApiPropertyOptional({ description: 'Maximum allowed', example: 2000 })
  max?: number;
}

/**
 * Daily macro targets configuration.
 */
export class MacroTargetsDto {
  @ApiProperty({ description: 'Calorie targets' })
  calories: NumericConstraintDto;

  @ApiProperty({ description: 'Protein targets (grams)' })
  protein: NumericConstraintDto;

  @ApiProperty({ description: 'Carbohydrate targets (grams)' })
  carbs: NumericConstraintDto;

  @ApiProperty({ description: 'Fat targets (grams)' })
  fat: NumericConstraintDto;

  @ApiPropertyOptional({ description: 'Fiber targets (grams)' })
  fiber?: NumericConstraintDto;

  @ApiPropertyOptional({ description: 'Sugar targets (grams)' })
  sugar?: NumericConstraintDto;

  @ApiPropertyOptional({ description: 'Sodium targets (mg)' })
  sodium?: NumericConstraintDto;
}

/**
 * Meal slot configuration.
 */
export class MealSlotDto {
  @ApiProperty({ description: 'Unique slot identifier', example: 'breakfast' })
  id: string;

  @ApiProperty({
    description: 'Type of meal',
    example: 'breakfast',
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
  })
  type: string;

  @ApiProperty({ description: 'Display name', example: 'Breakfast' })
  name: string;

  @ApiProperty({ description: 'Display order', example: 1 })
  order: number;

  @ApiProperty({
    description: 'Whether this meal is required',
    example: true,
  })
  required: boolean;

  @ApiPropertyOptional({ description: 'Per-meal macro targets' })
  targetMacros?: Partial<MacroTargetsDto>;
}

/**
 * Meal flow configuration.
 */
export class MealFlowConfigDto {
  @ApiProperty({ description: 'Meal slots for the day', type: [MealSlotDto] })
  slots: MealSlotDto[];

  @ApiProperty({
    description: 'Whether meals can be skipped',
    example: false,
  })
  allowSkipping: boolean;

  @ApiProperty({
    description: 'Whether meal order can be changed',
    example: false,
  })
  allowReordering: boolean;

  @ApiPropertyOptional({
    description: 'Minimum minutes between meals',
    example: 180,
  })
  minTimeBetweenMeals?: number;
}

/**
 * Nutrition rule configuration.
 */
export class NutritionRuleDto {
  @ApiProperty({ description: 'Rule unique identifier', example: 'net_carbs' })
  id: string;

  @ApiProperty({
    description: 'Rule type',
    example: 'preferNetCarbs',
    enum: [
      'preferNetCarbs',
      'proteinPerMealMinimum',
      'limitUltraProcessed',
      'mealTiming',
      'foodCategoryRestriction',
      'macroRatio',
      'glycemicControl',
    ],
  })
  type: string;

  @ApiProperty({ description: 'Rule display name', example: 'Use Net Carbs' })
  name: string;

  @ApiPropertyOptional({
    description: 'Rule description',
    example: 'Fiber is subtracted from total carbs',
  })
  description?: string;

  @ApiProperty({
    description: 'Severity level',
    example: 'warning',
    enum: ['info', 'warning', 'error'],
  })
  severity: string;

  @ApiProperty({ description: 'Whether rule is enabled', example: true })
  enabled: boolean;

  // Additional rule-specific properties (varies by type)
  @ApiPropertyOptional({ description: 'Minimum grams (for protein rules)' })
  minGrams?: number;

  @ApiPropertyOptional({ description: 'Maximum percentage' })
  maxPercentage?: number;

  @ApiPropertyOptional({ description: 'Target macro for ratio rules' })
  macro?: string;

  @ApiPropertyOptional({ description: 'Percentage constraint' })
  percentage?: NumericConstraintDto;
}

/**
 * Full nutrition plan response DTO.
 */
export class PlanResponseDto {
  @ApiProperty({
    description: 'Unique plan identifier',
    example: 'low_carb_csiro_inspired',
  })
  id: string;

  @ApiProperty({ description: 'Plan name', example: 'Low Carb' })
  name: string;

  @ApiProperty({
    description: 'Short description',
    example: 'A science-backed low-carb approach',
  })
  shortDescription: string;

  @ApiPropertyOptional({ description: 'Long description with details' })
  longDescription?: string;

  @ApiProperty({
    description: 'Visibility level',
    example: 'system',
    enum: ['system', 'public', 'private'],
  })
  visibility: string;

  @ApiPropertyOptional({ description: 'Creator user ID (null for system plans)' })
  createdById?: string;

  @ApiProperty({
    description: 'Difficulty level',
    example: 'intermediate',
    enum: ['beginner', 'intermediate', 'advanced'],
  })
  difficulty: string;

  @ApiProperty({
    description: 'Plan tags',
    example: ['low-carb', 'diabetes-friendly'],
    type: [String],
  })
  tags: string[];

  @ApiPropertyOptional({
    description: 'Source attribution',
    example: 'Inspired by CSIRO research',
  })
  sourceAttribution?: string;

  @ApiProperty({ description: 'Plan version', example: '1.0.0' })
  version: string;

  @ApiProperty({ description: 'Whether plan requires premium', example: false })
  isPremium: boolean;

  @ApiPropertyOptional({ description: 'Plan icon emoji', example: '🥗' })
  icon?: string;

  @ApiPropertyOptional({
    description: 'Accent color (hex)',
    example: '#10B981',
  })
  accentColor?: string;

  @ApiProperty({ description: 'Daily macro targets', type: MacroTargetsDto })
  dailyTargets: MacroTargetsDto;

  @ApiProperty({ description: 'Meal flow configuration', type: MealFlowConfigDto })
  mealFlow: MealFlowConfigDto;

  @ApiProperty({
    description: 'Plan rules',
    type: [NutritionRuleDto],
  })
  rules: NutritionRuleDto[];

  @ApiProperty({
    description: 'Whether to use net carbs calculation',
    example: true,
  })
  useNetCarbs: boolean;

  @ApiProperty({
    description: 'Default serving size multiplier',
    example: 1,
  })
  defaultServingMultiplier: number;

  @ApiPropertyOptional({
    description: 'Tips for following the plan',
    type: [String],
    example: ['Focus on whole foods', 'Stay hydrated'],
  })
  tips?: string[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Flexible extensions - dietician-specific custom fields',
    example: {
      cookingFatBudget: { breakfast: '1 tsp ghee' },
      supplements: [{ name: 'Whey', timing: 'breakfast' }],
    },
  })
  extensions?: Record<string, unknown>;
}

/**
 * Simplified plan for list responses.
 */
export class PlanSummaryDto {
  @ApiProperty({ description: 'Unique plan identifier' })
  id: string;

  @ApiProperty({ description: 'Plan name' })
  name: string;

  @ApiProperty({ description: 'Short description' })
  shortDescription: string;

  @ApiProperty({ description: 'Visibility level' })
  visibility: string;

  @ApiProperty({ description: 'Difficulty level' })
  difficulty: string;

  @ApiProperty({ description: 'Plan tags', type: [String] })
  tags: string[];

  @ApiProperty({ description: 'Whether plan requires premium' })
  isPremium: boolean;

  @ApiPropertyOptional({ description: 'Plan icon emoji' })
  icon?: string;

  @ApiPropertyOptional({ description: 'Accent color (hex)' })
  accentColor?: string;

  @ApiProperty({ description: 'Daily calorie target' })
  calorieTarget?: number;
}

/**
 * User plan assignment response.
 */
export class UserPlanAssignmentResponseDto {
  @ApiProperty({ description: 'Assignment ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Plan ID' })
  planId: string;

  @ApiProperty({ description: 'The assigned plan', type: PlanResponseDto })
  plan: PlanResponseDto;

  @ApiPropertyOptional({
    description: 'User custom macro targets (overrides plan defaults)',
    type: MacroTargetsDto,
  })
  customTargets?: Partial<MacroTargetsDto>;

  @ApiPropertyOptional({
    description: 'IDs of rules disabled by user',
    type: [String],
  })
  disabledRules?: string[];

  @ApiProperty({ description: 'When user started this plan' })
  startedAt: Date;

  @ApiPropertyOptional({ description: 'Target completion date' })
  targetDate?: Date;

  @ApiPropertyOptional({ description: 'User notes about the plan' })
  notes?: string;

  @ApiProperty({ description: 'Whether this is the active plan' })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'ID of dietician who assigned this plan (null if self-assigned)',
  })
  assignedById?: string;

  @ApiPropertyOptional({
    description: 'Dietician IDs who can view this assignment (privacy control)',
    type: [String],
  })
  sharedWith?: string[];
}
