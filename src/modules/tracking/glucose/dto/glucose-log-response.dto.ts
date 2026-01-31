import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for a single glucose log entry.
 */
export class GlucoseLogResponseDto {
  @ApiProperty({
    description: 'Unique log ID',
    example: 'clrx1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Date of the glucose reading',
    example: '2026-01-18',
  })
  logDate: string;

  @ApiProperty({
    description: 'Time of the reading',
    example: '2026-01-18T08:30:00.000Z',
  })
  readingTime: Date;

  @ApiProperty({
    description: 'Blood glucose level in mmol/L',
    example: 5.5,
  })
  glucoseMmolL: number;

  @ApiProperty({
    description: 'Type of reading',
    example: 'fasting',
    enum: ['fasting', 'post_meal', 'random'],
  })
  readingType: string;

  @ApiProperty({
    description: 'Glucose level category',
    example: 'Normal',
    enum: ['Low', 'Normal', 'Elevated', 'High'],
  })
  category: string;

  @ApiPropertyOptional({
    description: 'Notes about the reading',
    example: 'Felt tired this morning',
    nullable: true,
  })
  notes: string | null;
}

/**
 * Response DTO for glucose history with stats.
 */
export class GlucoseHistoryResponseDto {
  @ApiProperty({
    description: 'List of glucose log entries',
    type: [GlucoseLogResponseDto],
  })
  logs: GlucoseLogResponseDto[];

  @ApiProperty({
    description: 'Total number of entries',
    example: 60,
  })
  total: number;

  @ApiProperty({
    description: 'Average fasting glucose (mmol/L)',
    example: 5.8,
    nullable: true,
  })
  averageFasting: number | null;

  @ApiProperty({
    description: 'Average post-meal glucose (mmol/L)',
    example: 7.2,
    nullable: true,
  })
  averagePostMeal: number | null;
}
