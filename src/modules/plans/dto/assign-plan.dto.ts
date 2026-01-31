/**
 * Plan Assignment DTOs
 *
 * DTOs for assigning plans to users and customizing assignments.
 *
 * @module modules/plans/dto/assign-plan
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsDateString,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MacroTargetsInput } from './create-plan.dto';

/**
 * DTO for assigning a plan to the current user.
 */
export class AssignPlanDto {
  @ApiProperty({
    description: 'ID of the plan to assign',
    example: 'low_carb_csiro_inspired',
  })
  @IsString()
  planId: string;

  @ApiPropertyOptional({
    description: 'Optional custom macro targets (overrides plan defaults)',
    type: MacroTargetsInput,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MacroTargetsInput)
  customTargets?: MacroTargetsInput;

  @ApiPropertyOptional({
    description: 'Target completion date',
    example: '2026-04-01',
  })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({
    description: 'Personal notes about following this plan',
    example: 'Starting after vacation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

/**
 * DTO for updating an existing plan assignment.
 */
export class UpdateAssignmentDto {
  @ApiPropertyOptional({
    description: 'Custom macro targets (overrides plan defaults)',
    type: MacroTargetsInput,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MacroTargetsInput)
  customTargets?: MacroTargetsInput;

  @ApiPropertyOptional({
    description: 'Rule IDs to disable',
    example: ['protein_per_meal'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  disabledRules?: string[];

  @ApiPropertyOptional({
    description: 'Target completion date',
    example: '2026-04-01',
  })
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional({
    description: 'Personal notes',
    example: 'Week 2 adjustment',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    description: 'Whether this is the active plan',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/**
 * Query parameters for filtering plans.
 */
export class PlansQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by visibility',
    enum: ['system', 'public', 'private'],
  })
  @IsOptional()
  @IsString()
  visibility?: string;

  @ApiPropertyOptional({
    description: 'Filter by difficulty',
    enum: ['beginner', 'intermediate', 'advanced'],
  })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({
    description: 'Filter by tag',
    example: 'low-carb',
  })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({
    description: 'Include premium plans (requires premium subscription)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  includePremium?: boolean;
}
