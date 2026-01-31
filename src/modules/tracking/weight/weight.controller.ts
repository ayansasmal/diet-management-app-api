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
import { WeightService } from './weight.service';
import { CreateWeightLogDto } from './dto/create-weight-log.dto';
import {
  WeightLogResponseDto,
  WeightHistoryResponseDto,
} from './dto/weight-log-response.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';

/**
 * Weight tracking controller.
 * Provides endpoints for logging and retrieving weight data.
 */
@ApiTags('tracking')
@ApiBearerAuth('JWT-auth')
@Controller('tracking/weight')
export class WeightController {
  constructor(private readonly weightService: WeightService) {}

  /**
   * Log weight for a specific date.
   * If an entry already exists for the date, it will be updated.
   */
  @Post()
  @ApiOperation({
    summary: 'Log weight',
    description:
      'Create or update a weight log for a specific date. Only one entry per day is allowed.',
  })
  @ApiResponse({
    status: 201,
    description: 'Weight logged successfully',
    type: WeightLogResponseDto,
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
    @Body() createWeightLogDto: CreateWeightLogDto,
  ): Promise<WeightLogResponseDto> {
    return this.weightService.createLog(user.userId, createWeightLogDto);
  }

  /**
   * Get today's weight log.
   * Returns the weight entry for the current date, or 404 if not logged yet.
   */
  @Get('today')
  @ApiOperation({
    summary: 'Get today\'s weight',
    description: 'Retrieve the weight log entry for today.',
  })
  @ApiResponse({
    status: 200,
    description: 'Today\'s weight log',
    type: WeightLogResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'No weight logged for today',
  })
  async getToday(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<WeightLogResponseDto> {
    const today = new Date().toISOString().split('T')[0];
    return this.weightService.getByDate(user.userId, today);
  }

  /**
   * Get weight history with optional filtering.
   */
  @Get()
  @ApiOperation({
    summary: 'Get weight history',
    description:
      'Retrieve weight log history with optional date range filtering and statistics.',
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
    example: 30,
  })
  @ApiResponse({
    status: 200,
    description: 'Weight history',
    type: WeightHistoryResponseDto,
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
  ): Promise<WeightHistoryResponseDto> {
    return this.weightService.getHistory(
      user.userId,
      startDate,
      endDate,
      limit ? Number(limit) : undefined,
    );
  }

  /**
   * Get weight log for a specific date.
   */
  @Get(':date')
  @ApiOperation({
    summary: 'Get weight for date',
    description: 'Retrieve the weight log entry for a specific date.',
  })
  @ApiParam({
    name: 'date',
    description: 'Date to retrieve (YYYY-MM-DD)',
    example: '2026-01-18',
  })
  @ApiResponse({
    status: 200,
    description: 'Weight log for the date',
    type: WeightLogResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'No weight log found for the date',
  })
  async getByDate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('date') date: string,
  ): Promise<WeightLogResponseDto> {
    return this.weightService.getByDate(user.userId, date);
  }

  /**
   * Delete weight log for a specific date.
   */
  @Delete(':date')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete weight log',
    description: 'Delete the weight log entry for a specific date.',
  })
  @ApiParam({
    name: 'date',
    description: 'Date to delete (YYYY-MM-DD)',
    example: '2026-01-18',
  })
  @ApiResponse({
    status: 204,
    description: 'Weight log deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'No weight log found for the date',
  })
  async deleteByDate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('date') date: string,
  ): Promise<void> {
    return this.weightService.deleteByDate(user.userId, date);
  }
}
