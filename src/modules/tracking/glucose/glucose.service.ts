import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateGlucoseLogDto } from './dto/create-glucose-log.dto';
import {
  GlucoseLogResponseDto,
  GlucoseHistoryResponseDto,
} from './dto/glucose-log-response.dto';

/**
 * Glucose level categories based on diabetes management guidelines.
 */
const GLUCOSE_CATEGORIES = {
  LOW: { max: 3.9, label: 'Low' },
  NORMAL: { max: 5.5, label: 'Normal' },
  ELEVATED: { max: 6.9, label: 'Elevated' },
  HIGH: { max: Infinity, label: 'High' },
};

/**
 * Glucose tracking service.
 * Handles glucose log creation, retrieval, and deletion.
 */
@Injectable()
export class GlucoseService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a glucose log entry.
   * Multiple entries per day are allowed (unlike weight).
   *
   * @param userId - User ID from JWT
   * @param createGlucoseLogDto - Glucose log data
   * @returns Created glucose log
   */
  async createLog(
    userId: string,
    createGlucoseLogDto: CreateGlucoseLogDto,
  ): Promise<GlucoseLogResponseDto> {
    // Default to current date/time if not provided
    const now = new Date();
    const dateString = createGlucoseLogDto.logDate ?? now.toISOString().split('T')[0];
    const logDate = new Date(dateString);
    logDate.setUTCHours(0, 0, 0, 0);

    const readingTime = createGlucoseLogDto.readingTime
      ? new Date(createGlucoseLogDto.readingTime)
      : now;

    const log = await this.prisma.glucoseLog.create({
      data: {
        userId,
        logDate,
        readingTime,
        glucoseMmolL: createGlucoseLogDto.glucoseMmolL,
        readingType: createGlucoseLogDto.readingType,
        notes: createGlucoseLogDto.notes,
      },
    });

    return this.mapToResponse(log);
  }

  /**
   * Get glucose history with optional date range.
   *
   * @param userId - User ID from JWT
   * @param startDate - Optional start date filter
   * @param endDate - Optional end date filter
   * @param limit - Maximum entries to return (default 50)
   * @returns Glucose history with stats
   */
  async getHistory(
    userId: string,
    startDate?: string,
    endDate?: string,
    limit = 50,
  ): Promise<GlucoseHistoryResponseDto> {
    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Get logs ordered by date and time descending
    const logs = await this.prisma.glucoseLog.findMany({
      where: {
        userId,
        ...(Object.keys(dateFilter).length > 0 && { logDate: dateFilter }),
      },
      orderBy: [{ logDate: 'desc' }, { readingTime: 'desc' }],
      take: limit,
    });

    // Get total count
    const total = await this.prisma.glucoseLog.count({
      where: { userId },
    });

    // Calculate averages
    const stats = await this.calculateAverages(userId, dateFilter);

    return {
      logs: logs.map((log) => this.mapToResponse(log)),
      total,
      averageFasting: stats.averageFasting,
      averagePostMeal: stats.averagePostMeal,
    };
  }

  /**
   * Get glucose logs for a specific date.
   *
   * @param userId - User ID from JWT
   * @param date - Date string (YYYY-MM-DD)
   * @returns List of glucose logs for the date
   */
  async getByDate(
    userId: string,
    date: string,
  ): Promise<GlucoseLogResponseDto[]> {
    const logDate = new Date(date);
    logDate.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(logDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const logs = await this.prisma.glucoseLog.findMany({
      where: {
        userId,
        logDate: {
          gte: logDate,
          lte: endOfDay,
        },
      },
      orderBy: { readingTime: 'asc' },
    });

    return logs.map((log) => this.mapToResponse(log));
  }

  /**
   * Delete a glucose log entry by ID.
   *
   * @param userId - User ID from JWT
   * @param logId - Log entry ID
   * @throws NotFoundException if log not found or belongs to another user
   */
  async deleteById(userId: string, logId: string): Promise<void> {
    const log = await this.prisma.glucoseLog.findFirst({
      where: {
        id: logId,
        userId,
      },
    });

    if (!log) {
      throw new NotFoundException('Glucose log not found');
    }

    await this.prisma.glucoseLog.delete({
      where: { id: logId },
    });
  }

  /**
   * Calculate average glucose levels by reading type.
   */
  private async calculateAverages(
    userId: string,
    dateFilter?: { gte?: Date; lte?: Date },
  ): Promise<{ averageFasting: number | null; averagePostMeal: number | null }> {
    // Get all logs for calculation (limited to last 30 days if no filter)
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const filter = {
      userId,
      logDate: dateFilter && Object.keys(dateFilter).length > 0
        ? dateFilter
        : { gte: defaultStartDate },
    };

    const fastingLogs = await this.prisma.glucoseLog.findMany({
      where: {
        ...filter,
        readingType: 'fasting',
      },
      select: { glucoseMmolL: true },
    });

    const postMealLogs = await this.prisma.glucoseLog.findMany({
      where: {
        ...filter,
        readingType: 'post_meal',
      },
      select: { glucoseMmolL: true },
    });

    const calcAverage = (logs: { glucoseMmolL: number }[]): number | null => {
      if (logs.length === 0) return null;
      const sum = logs.reduce((acc, log) => acc + log.glucoseMmolL, 0);
      return Math.round((sum / logs.length) * 10) / 10;
    };

    return {
      averageFasting: calcAverage(fastingLogs),
      averagePostMeal: calcAverage(postMealLogs),
    };
  }

  /**
   * Get glucose category based on reading value.
   */
  private getGlucoseCategory(glucoseMmolL: number): string {
    if (glucoseMmolL <= GLUCOSE_CATEGORIES.LOW.max) {
      return GLUCOSE_CATEGORIES.LOW.label;
    }
    if (glucoseMmolL <= GLUCOSE_CATEGORIES.NORMAL.max) {
      return GLUCOSE_CATEGORIES.NORMAL.label;
    }
    if (glucoseMmolL <= GLUCOSE_CATEGORIES.ELEVATED.max) {
      return GLUCOSE_CATEGORIES.ELEVATED.label;
    }
    return GLUCOSE_CATEGORIES.HIGH.label;
  }

  /**
   * Map database model to response DTO.
   */
  private mapToResponse(log: {
    id: string;
    logDate: Date;
    readingTime: Date;
    glucoseMmolL: number;
    readingType: string;
    notes: string | null;
  }): GlucoseLogResponseDto {
    return {
      id: log.id,
      logDate: log.logDate.toISOString().split('T')[0],
      readingTime: log.readingTime,
      glucoseMmolL: log.glucoseMmolL,
      readingType: log.readingType,
      category: this.getGlucoseCategory(log.glucoseMmolL),
      notes: log.notes,
    };
  }
}
