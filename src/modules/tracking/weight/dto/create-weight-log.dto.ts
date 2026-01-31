import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsDateString, Min, Max, IsOptional } from 'class-validator';

/**
 * DTO for creating a weight log entry.
 */
export class CreateWeightLogDto {
  @ApiPropertyOptional({
    description: 'Date of the weight measurement (YYYY-MM-DD). Defaults to today if not provided.',
    example: '2026-01-18',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Please provide a valid date (YYYY-MM-DD)' })
  logDate?: string;

  @ApiProperty({
    description: 'Weight in kilograms',
    example: 79.5,
    minimum: 30,
    maximum: 300,
  })
  @IsNumber()
  @Min(30, { message: 'Weight must be at least 30 kg' })
  @Max(300, { message: 'Weight must not exceed 300 kg' })
  weightKg: number;
}
