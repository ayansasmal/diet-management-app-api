import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsDateString,
  IsString,
  IsIn,
  IsOptional,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

/**
 * DTO for creating a glucose log entry.
 */
export class CreateGlucoseLogDto {
  @ApiPropertyOptional({
    description: 'Date of the glucose reading (YYYY-MM-DD). Defaults to today if not provided.',
    example: '2026-01-18',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Please provide a valid date (YYYY-MM-DD)' })
  logDate?: string;

  @ApiPropertyOptional({
    description: 'Time of the reading (ISO 8601 format). Defaults to current time if not provided.',
    example: '2026-01-18T08:30:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Please provide a valid datetime' })
  readingTime?: string;

  @ApiProperty({
    description: 'Blood glucose level in mmol/L',
    example: 5.5,
    minimum: 1,
    maximum: 35,
  })
  @IsNumber()
  @Min(1, { message: 'Glucose level must be at least 1 mmol/L' })
  @Max(35, { message: 'Glucose level must not exceed 35 mmol/L' })
  glucoseMmolL: number;

  @ApiProperty({
    description: 'Type of reading',
    example: 'fasting',
    enum: ['fasting', 'post_meal', 'random'],
  })
  @IsString()
  @IsIn(['fasting', 'post_meal', 'random'], {
    message: 'Reading type must be fasting, post_meal, or random',
  })
  readingType: 'fasting' | 'post_meal' | 'random';

  @ApiPropertyOptional({
    description: 'Optional notes about the reading',
    example: 'Felt tired this morning',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Notes must not exceed 500 characters' })
  notes?: string;
}
