import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateWeightLogDto } from './dto/create-weight-log.dto';
import {
  WeightLogResponseDto,
  WeightHistoryResponseDto,
} from './dto/weight-log-response.dto';

/**
 * Weight tracking service.
 * Handles weight log creation, retrieval, and deletion.
 */
@Injectable()
export class WeightService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a weight log entry.
   * Only one entry per day is allowed - upserts if entry exists.
   *
   * @param userId - User ID from JWT
   * @param createWeightLogDto - Weight log data
   * @returns Created/updated weight log
   */
  async createLog(
    userId: string,
    createWeightLogDto: CreateWeightLogDto,
  ): Promise<WeightLogResponseDto> {
    // Default to today's date if not provided
    const dateString = createWeightLogDto.logDate ?? new Date().toISOString().split('T')[0];
    const logDate = new Date(dateString);
    logDate.setUTCHours(0, 0, 0, 0); // Normalize to start of day

    // Upsert - create or update if exists
    const log = await this.prisma.weightLog.upsert({
      where: {
        userId_logDate: {
          userId,
          logDate,
        },
      },
      update: {
        weightKg: createWeightLogDto.weightKg,
      },
      create: {
        userId,
        logDate,
        weightKg: createWeightLogDto.weightKg,
      },
    });

    return this.mapToResponse(log);
  }

  /**
   * Get weight history with optional date range.
   *
   * @param userId - User ID from JWT
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @param limit - Maximum entries to return (default 30)
   * @returns Weight history with stats
   */
  async getHistory(
    userId: string,
    startDate?: string,
    endDate?: string,
    limit = 30,
  ): Promise<WeightHistoryResponseDto> {
    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Get logs ordered by date descending
    const logs = await this.prisma.weightLog.findMany({
      where: {
        userId,
        ...(Object.keys(dateFilter).length > 0 && { logDate: dateFilter }),
      },
      orderBy: { logDate: 'desc' },
      take: limit,
    });

    // Get total count
    const total = await this.prisma.weightLog.count({
      where: { userId },
    });

    // Calculate stats if logs exist
    let startingWeight: number | null = null;
    let currentWeight: number | null = null;
    let totalChange: number | null = null;

    if (logs.length > 0) {
      currentWeight = logs[0].weightKg;

      // Get the earliest log
      const earliestLog = await this.prisma.weightLog.findFirst({
        where: { userId },
        orderBy: { logDate: 'asc' },
      });

      if (earliestLog) {
        startingWeight = earliestLog.weightKg;
        totalChange =
          Math.round((currentWeight - startingWeight) * 10) / 10;
      }
    }

    return {
      logs: logs.map(this.mapToResponse),
      total,
      startingWeight,
      currentWeight,
      totalChange,
    };
  }

  /**
   * Get weight log for a specific date.
   *
   * @param userId - User ID from JWT
   * @param date - Date string (YYYY-MM-DD)
   * @returns Weight log for the date
   * @throws NotFoundException if no log exists for the date
   */
  async getByDate(userId: string, date: string): Promise<WeightLogResponseDto> {
    const logDate = new Date(date);
    logDate.setUTCHours(0, 0, 0, 0);

    const log = await this.prisma.weightLog.findUnique({
      where: {
        userId_logDate: {
          userId,
          logDate,
        },
      },
    });

    if (!log) {
      throw new NotFoundException(`No weight log found for ${date}`);
    }

    return this.mapToResponse(log);
  }

  /**
   * Delete weight log for a specific date.
   *
   * @param userId - User ID from JWT
   * @param date - Date string (YYYY-MM-DD)
   * @throws NotFoundException if no log exists for the date
   */
  async deleteByDate(userId: string, date: string): Promise<void> {
    const logDate = new Date(date);
    logDate.setUTCHours(0, 0, 0, 0);

    const log = await this.prisma.weightLog.findUnique({
      where: {
        userId_logDate: {
          userId,
          logDate,
        },
      },
    });

    if (!log) {
      throw new NotFoundException(`No weight log found for ${date}`);
    }

    await this.prisma.weightLog.delete({
      where: { id: log.id },
    });
  }

  /**
   * Map database model to response DTO.
   */
  private mapToResponse(log: {
    id: string;
    logDate: Date;
    weightKg: number;
    loggedAt: Date;
  }): WeightLogResponseDto {
    return {
      id: log.id,
      logDate: log.logDate.toISOString().split('T')[0],
      weightKg: log.weightKg,
      loggedAt: log.loggedAt,
    };
  }
}
