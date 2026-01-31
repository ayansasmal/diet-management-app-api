/**
 * Meals Controller
 *
 * REST API endpoints for meal logging.
 * Supports creating, updating, and viewing meal logs.
 *
 * @module modules/meals/meals.controller
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MealsService } from './meals.service';
import {
  CreateMealDto,
  UpdateMealDto,
  AddFoodItemDto,
  UpdateMealMetadataDto,
  QuickLogMealDto,
} from './dto/create-meal.dto';
import { MealQueryDto, DailySummaryQueryDto } from './dto/meal-query.dto';
import {
  MealLogDto,
  DailySummaryDto,
  MealHistoryResponseDto,
} from './dto/meal-response.dto';

/**
 * JWT payload structure from authentication.
 */
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/**
 * Controller for meal logging operations.
 *
 * Endpoints:
 * - POST /meals - Create a new meal
 * - POST /meals/quick - Quick log a meal with single food
 * - GET /meals - List meal history
 * - GET /meals/today - Get today's meals
 * - GET /meals/summary - Get daily summary
 * - GET /meals/:id - Get meal details
 * - PATCH /meals/:id - Update a meal
 * - PATCH /meals/:id/metadata - Update meal metadata only
 * - POST /meals/:id/items - Add food item to meal
 * - DELETE /meals/:id/items/:itemId - Remove food item
 * - DELETE /meals/:id - Delete a meal
 */
@ApiTags('Meal Logging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('meals')
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  /**
   * Create a new meal log.
   */
  @Post()
  @ApiOperation({
    summary: 'Log a meal',
    description: 'Create a new meal log with one or more food items',
  })
  @ApiResponse({
    status: 201,
    description: 'Meal created successfully',
    type: MealLogDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createMeal(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMealDto,
  ): Promise<MealLogDto> {
    return this.mealsService.createMeal(user.sub, dto);
  }

  /**
   * Quick log a meal with a single food from the database.
   */
  @Post('quick')
  @ApiOperation({
    summary: 'Quick log a meal',
    description: 'Log a meal with a single food item from the database',
  })
  @ApiResponse({
    status: 201,
    description: 'Meal created successfully',
    type: MealLogDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Food or serving not found' })
  async quickLogMeal(
    @CurrentUser() user: JwtPayload,
    @Body() dto: QuickLogMealDto,
  ): Promise<MealLogDto> {
    return this.mealsService.quickLogMeal(user.sub, dto);
  }

  /**
   * Get meal history with pagination.
   */
  @Get()
  @ApiOperation({
    summary: 'Get meal history',
    description: 'List meal logs with optional filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Meal history retrieved successfully',
    type: MealHistoryResponseDto,
  })
  async getMealHistory(
    @CurrentUser() user: JwtPayload,
    @Query() query: MealQueryDto,
  ): Promise<MealHistoryResponseDto> {
    return this.mealsService.getMealHistory(user.sub, query);
  }

  /**
   * Get today's meals summary.
   */
  @Get('today')
  @ApiOperation({
    summary: "Get today's meals",
    description: "Get all meals logged today with daily totals",
  })
  @ApiResponse({
    status: 200,
    description: "Today's meals retrieved successfully",
    type: DailySummaryDto,
  })
  async getTodaysMeals(@CurrentUser() user: JwtPayload): Promise<DailySummaryDto> {
    return this.mealsService.getTodaysMeals(user.sub);
  }

  /**
   * Get daily summary for a specific date.
   */
  @Get('summary')
  @ApiOperation({
    summary: 'Get daily summary',
    description: 'Get all meals and totals for a specific date',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily summary retrieved successfully',
    type: DailySummaryDto,
  })
  async getDailySummary(
    @CurrentUser() user: JwtPayload,
    @Query() query: DailySummaryQueryDto,
  ): Promise<DailySummaryDto> {
    return this.mealsService.getDailySummary(user.sub, query);
  }

  /**
   * Get a specific meal by ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get meal details',
    description: 'Get full details of a specific meal including all food items',
  })
  @ApiParam({ name: 'id', description: 'Meal ID' })
  @ApiResponse({
    status: 200,
    description: 'Meal retrieved successfully',
    type: MealLogDto,
  })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getMealById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<MealLogDto> {
    return this.mealsService.getMealById(user.sub, id);
  }

  /**
   * Update a meal log.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a meal',
    description: 'Update meal details. Can replace food items if provided.',
  })
  @ApiParam({ name: 'id', description: 'Meal ID' })
  @ApiResponse({
    status: 200,
    description: 'Meal updated successfully',
    type: MealLogDto,
  })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async updateMeal(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMealDto,
  ): Promise<MealLogDto> {
    return this.mealsService.updateMeal(user.sub, id, dto);
  }

  /**
   * Update only meal metadata (rating, notes, photo).
   */
  @Patch(':id/metadata')
  @ApiOperation({
    summary: 'Update meal metadata',
    description: 'Update only the rating, notes, or photo URL without affecting food items',
  })
  @ApiParam({ name: 'id', description: 'Meal ID' })
  @ApiResponse({
    status: 200,
    description: 'Meal metadata updated successfully',
    type: MealLogDto,
  })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  async updateMealMetadata(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMealMetadataDto,
  ): Promise<MealLogDto> {
    return this.mealsService.updateMealMetadata(user.sub, id, dto);
  }

  /**
   * Add a food item to an existing meal.
   */
  @Post(':id/items')
  @ApiOperation({
    summary: 'Add food item to meal',
    description: 'Add another food item to an existing meal',
  })
  @ApiParam({ name: 'id', description: 'Meal ID' })
  @ApiResponse({
    status: 201,
    description: 'Food item added successfully',
    type: MealLogDto,
  })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async addFoodItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') mealId: string,
    @Body() dto: AddFoodItemDto,
  ): Promise<MealLogDto> {
    return this.mealsService.addFoodItem(user.sub, mealId, dto);
  }

  /**
   * Remove a food item from a meal.
   */
  @Delete(':id/items/:itemId')
  @ApiOperation({
    summary: 'Remove food item from meal',
    description: 'Remove a food item from an existing meal. Cannot remove the last item.',
  })
  @ApiParam({ name: 'id', description: 'Meal ID' })
  @ApiParam({ name: 'itemId', description: 'Food item ID' })
  @ApiResponse({
    status: 200,
    description: 'Food item removed successfully',
    type: MealLogDto,
  })
  @ApiResponse({ status: 400, description: 'Cannot remove last item' })
  @ApiResponse({ status: 404, description: 'Meal or item not found' })
  async removeFoodItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') mealId: string,
    @Param('itemId') itemId: string,
  ): Promise<MealLogDto> {
    return this.mealsService.removeFoodItem(user.sub, mealId, itemId);
  }

  /**
   * Delete a meal log.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a meal',
    description: 'Permanently delete a meal log and all its food items',
  })
  @ApiParam({ name: 'id', description: 'Meal ID' })
  @ApiResponse({ status: 204, description: 'Meal deleted successfully' })
  @ApiResponse({ status: 404, description: 'Meal not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async deleteMeal(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.mealsService.deleteMeal(user.sub, id);
  }
}
