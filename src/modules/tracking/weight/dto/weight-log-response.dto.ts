import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for a single weight log entry.
 */
export class WeightLogResponseDto {
  @ApiProperty({
    description: 'Unique log ID',
    example: 'clrx1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Date of the weight measurement',
    example: '2026-01-18',
  })
  logDate: string;

  @ApiProperty({
    description: 'Weight in kilograms',
    example: 79.5,
  })
  weightKg: number;

  @ApiProperty({
    description: 'Timestamp when the log was recorded',
    example: '2026-01-18T08:30:00.000Z',
  })
  loggedAt: Date;
}

/**
 * Response DTO for weight history with stats.
 */
export class WeightHistoryResponseDto {
  @ApiProperty({
    description: 'List of weight log entries',
    type: [WeightLogResponseDto],
  })
  logs: WeightLogResponseDto[];

  @ApiProperty({
    description: 'Total number of entries',
    example: 30,
  })
  total: number;

  @ApiProperty({
    description: 'Starting weight (first log)',
    example: 85.0,
    nullable: true,
  })
  startingWeight: number | null;

  @ApiProperty({
    description: 'Current weight (most recent log)',
    example: 79.5,
    nullable: true,
  })
  currentWeight: number | null;

  @ApiProperty({
    description: 'Total weight change (negative = loss)',
    example: -5.5,
    nullable: true,
  })
  totalChange: number | null;
}
