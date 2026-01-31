/**
 * Meal Query DTOs
 *
 * DTOs for querying meal logs.
 *
 * @module modules/meals/dto/meal-query
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsDateString, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { MealTypeEnum } from './create-meal.dto';

/**
 * Query parameters for listing meals.
 */
export class MealQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by date (YYYY-MM-DD)',
    example: '2026-01-25',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Filter by date range start (YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by date range end (YYYY-MM-DD)',
    example: '2026-01-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by meal type',
    enum: MealTypeEnum,
  })
  @IsOptional()
  @IsEnum(MealTypeEnum)
  mealType?: MealTypeEnum;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * Query parameters for daily summary.
 */
export class DailySummaryQueryDto {
  @ApiPropertyOptional({
    description: 'Date for summary (YYYY-MM-DD), defaults to today',
    example: '2026-01-25',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
