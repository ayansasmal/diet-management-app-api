import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { GlucoseService } from './glucose.service';
import { CreateGlucoseLogDto } from './dto/create-glucose-log.dto';
import {
  GlucoseLogResponseDto,
  GlucoseHistoryResponseDto,
} from './dto/glucose-log-response.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

/**
 * Glucose tracking controller.
 * Provides endpoints for logging and retrieving glucose data.
 */
@ApiTags('tracking')
@ApiBearerAuth('JWT-auth')
@Controller('tracking/glucose')
export class GlucoseController {
  constructor(private readonly glucoseService: GlucoseService) {}

  /**
   * Log a glucose reading.
   * Multiple readings per day are allowed.
   */
  @Post()
  @ApiOperation({
    summary: 'Log glucose reading',
    description:
      'Create a glucose log entry. Multiple readings per day are allowed with different times.',
  })
  @ApiResponse({
    status: 201,
    description: 'Glucose reading logged successfully',
    type: GlucoseLogResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async createLog(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createGlucoseLogDto: CreateGlucoseLogDto,
  ): Promise<GlucoseLogResponseDto> {
    return this.glucoseService.createLog(user.userId, createGlucoseLogDto);
  }

  /**
   * Get today's glucose readings.
   * Returns all glucose entries for the current date (can be multiple per day).
   */
  @Get('today')
  @ApiOperation({
    summary: 'Get today\'s glucose readings',
    description: 'Retrieve all glucose log entries for today.',
  })
  @ApiResponse({
    status: 200,
    description: 'Today\'s glucose readings (may be empty array)',
    type: [GlucoseLogResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getToday(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<GlucoseLogResponseDto[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.glucoseService.getByDate(user.userId, today);
  }

  /**
   * Get glucose history with optional filtering.
   */
  @Get()
  @ApiOperation({
    summary: 'Get glucose history',
    description:
      'Retrieve glucose log history with optional date range filtering and statistics.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter logs from this date (YYYY-MM-DD)',
    example: '2026-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter logs up to this date (YYYY-MM-DD)',
    example: '2026-01-31',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of entries to return',
    example: 50,
  })
  @ApiResponse({
    status: 200,
    description: 'Glucose history',
    type: GlucoseHistoryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ): Promise<GlucoseHistoryResponseDto> {
    return this.glucoseService.getHistory(
      user.userId,
      startDate,
      endDate,
      limit ? Number(limit) : undefined,
    );
  }

  /**
   * Get glucose logs for a specific date.
   */
  @Get(':date')
  @ApiOperation({
    summary: 'Get glucose readings for date',
    description: 'Retrieve all glucose log entries for a specific date.',
  })
  @ApiParam({
    name: 'date',
    description: 'Date to retrieve (YYYY-MM-DD)',
    example: '2026-01-18',
  })
  @ApiResponse({
    status: 200,
    description: 'Glucose logs for the date',
    type: [GlucoseLogResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getByDate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('date') date: string,
  ): Promise<GlucoseLogResponseDto[]> {
    return this.glucoseService.getByDate(user.userId, date);
  }

  /**
   * Delete a glucose log entry by ID.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete glucose log',
    description: 'Delete a glucose log entry by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Log entry ID',
    example: 'clrx1234567890abcdef',
  })
  @ApiResponse({
    status: 204,
    description: 'Glucose log deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Glucose log not found',
  })
  async deleteById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.glucoseService.deleteById(user.userId, id);
  }
}
