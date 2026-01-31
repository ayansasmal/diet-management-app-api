/**
 * Meals Service
 *
 * Business logic for meal logging operations.
 * Handles CRUD operations, totals calculation, and daily summaries.
 *
 * @module modules/meals/meals.service
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateMealDto,
  UpdateMealDto,
  CreateMealFoodItemDto,
  AddFoodItemDto,
  UpdateMealMetadataDto,
  QuickLogMealDto,
  MealTypeEnum,
} from './dto/create-meal.dto';
import { MealQueryDto, DailySummaryQueryDto } from './dto/meal-query.dto';
import {
  MealLogDto,
  MealSummaryDto,
  MealFoodItemDto,
  DailySummaryDto,
  MealHistoryResponseDto,
} from './dto/meal-response.dto';

/**
 * Service for meal logging operations.
 */
@Injectable()
export class MealsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new meal log with food items.
   *
   * @param userId - User creating the meal
   * @param dto - Meal creation data
   * @returns Created meal with food items
   */
  async createMeal(userId: string, dto: CreateMealDto): Promise<MealLogDto> {
    // Default to today if no date provided
    const mealDate = dto.mealDate ? new Date(dto.mealDate) : new Date();
    mealDate.setHours(0, 0, 0, 0);

    // Parse meal time if provided
    let mealTime: Date | null = null;
    if (dto.mealTime) {
      const [hours, minutes] = dto.mealTime.split(':').map(Number);
      mealTime = new Date(mealDate);
      mealTime.setHours(hours, minutes, 0, 0);
    }

    // Calculate totals from food items
    const totals = this.calculateTotals(dto.foodItems);

    // Create meal with food items in a transaction
    const meal = await this.prisma.mealLog.create({
      data: {
        userId,
        mealDate,
        mealType: dto.mealType,
        mealTime,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
        totalFiber: totals.fiber,
        photoUrl: dto.photoUrl,
        rating: dto.rating,
        notes: dto.notes,
        foodItems: {
          create: dto.foodItems.map((item) => this.mapFoodItemToCreate(item)),
        },
      },
      include: {
        foodItems: true,
      },
    });

    return this.mapToMealDto(meal);
  }

  /**
   * Quick log a meal with a single food from the database.
   *
   * @param userId - User creating the meal
   * @param dto - Quick log data
   * @returns Created meal
   */
  async quickLogMeal(userId: string, dto: QuickLogMealDto): Promise<MealLogDto> {
    // Fetch food and serving
    const food = await this.prisma.foodItem.findUnique({
      where: { id: dto.foodId },
      include: { servings: true },
    });

    if (!food) {
      throw new NotFoundException(`Food not found: ${dto.foodId}`);
    }

    const serving = food.servings.find((s) => s.id === dto.servingId);
    if (!serving) {
      throw new NotFoundException(`Serving not found: ${dto.servingId}`);
    }

    const quantity = dto.quantity ?? 1;

    // Create meal DTO from food data
    const createDto: CreateMealDto = {
      mealDate: dto.mealDate,
      mealType: dto.mealType,
      foodItems: [
        {
          foodId: food.id,
          servingId: serving.id,
          foodName: food.name,
          servingName: serving.servingName,
          quantity,
          calories: serving.calories,
          protein: serving.protein,
          carbs: serving.carbs,
          fat: serving.fat,
          fiber: serving.fiber ?? 0,
          isCustomEntry: false,
        },
      ],
    };

    return this.createMeal(userId, createDto);
  }

  /**
   * Get a meal by ID.
   *
   * @param userId - User requesting the meal
   * @param mealId - Meal ID
   * @returns Meal details
   */
  async getMealById(userId: string, mealId: string): Promise<MealLogDto> {
    const meal = await this.prisma.mealLog.findUnique({
      where: { id: mealId },
      include: { foodItems: true },
    });

    if (!meal) {
      throw new NotFoundException(`Meal not found: ${mealId}`);
    }

    if (meal.userId !== userId) {
      throw new ForbiddenException('You do not have access to this meal');
    }

    return this.mapToMealDto(meal);
  }

  /**
   * Update a meal log.
   *
   * @param userId - User updating the meal
   * @param mealId - Meal ID
   * @param dto - Update data
   * @returns Updated meal
   */
  async updateMeal(userId: string, mealId: string, dto: UpdateMealDto): Promise<MealLogDto> {
    const existing = await this.prisma.mealLog.findUnique({
      where: { id: mealId },
      include: { foodItems: true },
    });

    if (!existing) {
      throw new NotFoundException(`Meal not found: ${mealId}`);
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('You do not have access to this meal');
    }

    // If food items are provided, recalculate totals
    let totals = {
      calories: existing.totalCalories,
      protein: existing.totalProtein,
      carbs: existing.totalCarbs,
      fat: existing.totalFat,
      fiber: existing.totalFiber,
    };

    if (dto.foodItems) {
      totals = this.calculateTotals(dto.foodItems);

      // Delete existing food items and create new ones
      await this.prisma.mealFoodItem.deleteMany({
        where: { mealId },
      });

      await this.prisma.mealFoodItem.createMany({
        data: dto.foodItems.map((item) => ({
          ...this.mapFoodItemToCreate(item),
          mealId,
        })),
      });
    }

    // Parse dates if provided
    let mealDate = existing.mealDate;
    if (dto.mealDate) {
      mealDate = new Date(dto.mealDate);
      mealDate.setHours(0, 0, 0, 0);
    }

    let mealTime = existing.mealTime;
    if (dto.mealTime) {
      const [hours, minutes] = dto.mealTime.split(':').map(Number);
      mealTime = new Date(mealDate);
      mealTime.setHours(hours, minutes, 0, 0);
    }

    // Update meal
    const meal = await this.prisma.mealLog.update({
      where: { id: mealId },
      data: {
        mealDate: dto.mealDate ? mealDate : undefined,
        mealType: dto.mealType,
        mealTime: dto.mealTime ? mealTime : undefined,
        totalCalories: totals.calories,
        totalProtein: totals.protein,
        totalCarbs: totals.carbs,
        totalFat: totals.fat,
        totalFiber: totals.fiber,
        photoUrl: dto.photoUrl,
        rating: dto.rating,
        notes: dto.notes,
      },
      include: { foodItems: true },
    });

    return this.mapToMealDto(meal);
  }

  /**
   * Update only meal metadata (rating, notes, photo).
   *
   * @param userId - User updating the meal
   * @param mealId - Meal ID
   * @param dto - Metadata update data
   * @returns Updated meal
   */
  async updateMealMetadata(
    userId: string,
    mealId: string,
    dto: UpdateMealMetadataDto,
  ): Promise<MealLogDto> {
    const existing = await this.prisma.mealLog.findUnique({
      where: { id: mealId },
    });

    if (!existing) {
      throw new NotFoundException(`Meal not found: ${mealId}`);
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('You do not have access to this meal');
    }

    const meal = await this.prisma.mealLog.update({
      where: { id: mealId },
      data: {
        photoUrl: dto.photoUrl,
        rating: dto.rating,
        notes: dto.notes,
      },
      include: { foodItems: true },
    });

    return this.mapToMealDto(meal);
  }

  /**
   * Add a food item to an existing meal.
   *
   * @param userId - User adding the item
   * @param mealId - Meal ID
   * @param dto - Food item data
   * @returns Updated meal
   */
  async addFoodItem(userId: string, mealId: string, dto: AddFoodItemDto): Promise<MealLogDto> {
    const meal = await this.prisma.mealLog.findUnique({
      where: { id: mealId },
      include: { foodItems: true },
    });

    if (!meal) {
      throw new NotFoundException(`Meal not found: ${mealId}`);
    }

    if (meal.userId !== userId) {
      throw new ForbiddenException('You do not have access to this meal');
    }

    // Create the new food item
    const itemData = this.mapFoodItemToCreate(dto);
    const calculatedCalories = dto.calories * dto.quantity;
    const calculatedProtein = dto.protein * dto.quantity;
    const calculatedCarbs = dto.carbs * dto.quantity;
    const calculatedFat = dto.fat * dto.quantity;
    const calculatedFiber = (dto.fiber ?? 0) * dto.quantity;

    await this.prisma.mealFoodItem.create({
      data: {
        ...itemData,
        mealId,
      },
    });

    // Update meal totals
    const updatedMeal = await this.prisma.mealLog.update({
      where: { id: mealId },
      data: {
        totalCalories: meal.totalCalories + calculatedCalories,
        totalProtein: meal.totalProtein + calculatedProtein,
        totalCarbs: meal.totalCarbs + calculatedCarbs,
        totalFat: meal.totalFat + calculatedFat,
        totalFiber: meal.totalFiber + calculatedFiber,
      },
      include: { foodItems: true },
    });

    return this.mapToMealDto(updatedMeal);
  }

  /**
   * Remove a food item from a meal.
   *
   * @param userId - User removing the item
   * @param mealId - Meal ID
   * @param itemId - Food item ID
   * @returns Updated meal
   */
  async removeFoodItem(userId: string, mealId: string, itemId: string): Promise<MealLogDto> {
    const meal = await this.prisma.mealLog.findUnique({
      where: { id: mealId },
      include: { foodItems: true },
    });

    if (!meal) {
      throw new NotFoundException(`Meal not found: ${mealId}`);
    }

    if (meal.userId !== userId) {
      throw new ForbiddenException('You do not have access to this meal');
    }

    const item = meal.foodItems.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(`Food item not found: ${itemId}`);
    }

    // Don't allow removing the last item
    if (meal.foodItems.length === 1) {
      throw new BadRequestException('Cannot remove the last food item. Delete the meal instead.');
    }

    // Delete the item
    await this.prisma.mealFoodItem.delete({
      where: { id: itemId },
    });

    // Update meal totals
    const updatedMeal = await this.prisma.mealLog.update({
      where: { id: mealId },
      data: {
        totalCalories: meal.totalCalories - item.calories,
        totalProtein: meal.totalProtein - item.protein,
        totalCarbs: meal.totalCarbs - item.carbs,
        totalFat: meal.totalFat - item.fat,
        totalFiber: meal.totalFiber - item.fiber,
      },
      include: { foodItems: true },
    });

    return this.mapToMealDto(updatedMeal);
  }

  /**
   * Delete a meal log.
   *
   * @param userId - User deleting the meal
   * @param mealId - Meal ID
   */
  async deleteMeal(userId: string, mealId: string): Promise<void> {
    const meal = await this.prisma.mealLog.findUnique({
      where: { id: mealId },
    });

    if (!meal) {
      throw new NotFoundException(`Meal not found: ${mealId}`);
    }

    if (meal.userId !== userId) {
      throw new ForbiddenException('You do not have access to this meal');
    }

    // Cascade delete will remove food items
    await this.prisma.mealLog.delete({
      where: { id: mealId },
    });
  }

  /**
   * Get meal history with pagination.
   *
   * @param userId - User ID
   * @param query - Query parameters
   * @returns Paginated meal list
   */
  async getMealHistory(userId: string, query: MealQueryDto): Promise<MealHistoryResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { userId };

    if (query.date) {
      const date = new Date(query.date);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      where.mealDate = { gte: date, lt: nextDay };
    } else if (query.startDate || query.endDate) {
      where.mealDate = {};
      if (query.startDate) {
        const startDate = new Date(query.startDate);
        startDate.setHours(0, 0, 0, 0);
        (where.mealDate as Record<string, Date>).gte = startDate;
      }
      if (query.endDate) {
        const endDate = new Date(query.endDate);
        endDate.setHours(23, 59, 59, 999);
        (where.mealDate as Record<string, Date>).lte = endDate;
      }
    }

    if (query.mealType) {
      where.mealType = query.mealType;
    }

    // Fetch meals
    const [meals, total] = await Promise.all([
      this.prisma.mealLog.findMany({
        where,
        include: { foodItems: true },
        orderBy: [{ mealDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.mealLog.count({ where }),
    ]);

    return {
      meals: meals.map((m) => this.mapToMealSummary(m)),
      total,
      page,
      limit,
      hasMore: skip + meals.length < total,
    };
  }

  /**
   * Get daily summary with all meals and totals.
   *
   * @param userId - User ID
   * @param query - Query parameters
   * @returns Daily summary
   */
  async getDailySummary(userId: string, query: DailySummaryQueryDto): Promise<DailySummaryDto> {
    const date = query.date ? new Date(query.date) : new Date();
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const meals = await this.prisma.mealLog.findMany({
      where: {
        userId,
        mealDate: { gte: date, lt: nextDay },
      },
      include: { foodItems: true },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate daily totals
    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.totalCalories,
        protein: acc.protein + meal.totalProtein,
        carbs: acc.carbs + meal.totalCarbs,
        fat: acc.fat + meal.totalFat,
        fiber: acc.fiber + meal.totalFiber,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );

    return {
      date: date.toISOString().split('T')[0],
      totalCalories: Math.round(totals.calories * 10) / 10,
      totalProtein: Math.round(totals.protein * 10) / 10,
      totalCarbs: Math.round(totals.carbs * 10) / 10,
      totalFat: Math.round(totals.fat * 10) / 10,
      totalFiber: Math.round(totals.fiber * 10) / 10,
      meals: meals.map((m) => this.mapToMealSummary(m)),
    };
  }

  /**
   * Get today's meals.
   *
   * @param userId - User ID
   * @returns Today's daily summary
   */
  async getTodaysMeals(userId: string): Promise<DailySummaryDto> {
    return this.getDailySummary(userId, {});
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Calculate totals from food items.
   */
  private calculateTotals(items: CreateMealFoodItemDto[]): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  } {
    return items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories * item.quantity,
        protein: acc.protein + item.protein * item.quantity,
        carbs: acc.carbs + item.carbs * item.quantity,
        fat: acc.fat + item.fat * item.quantity,
        fiber: acc.fiber + (item.fiber ?? 0) * item.quantity,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
    );
  }

  /**
   * Map food item DTO to Prisma create data.
   */
  private mapFoodItemToCreate(dto: CreateMealFoodItemDto) {
    return {
      foodId: dto.foodId ?? null,
      servingId: dto.servingId ?? null,
      foodName: dto.foodName,
      servingName: dto.servingName,
      quantity: dto.quantity,
      calories: dto.calories * dto.quantity,
      protein: dto.protein * dto.quantity,
      carbs: dto.carbs * dto.quantity,
      fat: dto.fat * dto.quantity,
      fiber: (dto.fiber ?? 0) * dto.quantity,
      isCustomEntry: dto.isCustomEntry ?? !dto.foodId,
    };
  }

  /**
   * Map Prisma meal to response DTO.
   */
  private mapToMealDto(
    meal: {
      id: string;
      mealDate: Date;
      mealType: string;
      mealTime: Date | null;
      totalCalories: number;
      totalProtein: number;
      totalCarbs: number;
      totalFat: number;
      totalFiber: number;
      photoUrl: string | null;
      rating: number | null;
      notes: string | null;
      createdAt: Date;
      updatedAt: Date;
      foodItems: {
        id: string;
        foodId: string | null;
        servingId: string | null;
        foodName: string;
        servingName: string;
        quantity: number;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
        isCustomEntry: boolean;
      }[];
    },
  ): MealLogDto {
    return {
      id: meal.id,
      mealDate: meal.mealDate.toISOString().split('T')[0],
      mealType: meal.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      mealTime: meal.mealTime?.toISOString() ?? undefined,
      totalCalories: Math.round(meal.totalCalories * 10) / 10,
      totalProtein: Math.round(meal.totalProtein * 10) / 10,
      totalCarbs: Math.round(meal.totalCarbs * 10) / 10,
      totalFat: Math.round(meal.totalFat * 10) / 10,
      totalFiber: Math.round(meal.totalFiber * 10) / 10,
      photoUrl: meal.photoUrl ?? undefined,
      rating: meal.rating ?? undefined,
      notes: meal.notes ?? undefined,
      foodItems: meal.foodItems.map((item) => this.mapToFoodItemDto(item)),
      createdAt: meal.createdAt,
      updatedAt: meal.updatedAt,
    };
  }

  /**
   * Map Prisma food item to response DTO.
   */
  private mapToFoodItemDto(item: {
    id: string;
    foodId: string | null;
    servingId: string | null;
    foodName: string;
    servingName: string;
    quantity: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    isCustomEntry: boolean;
  }): MealFoodItemDto {
    return {
      id: item.id,
      foodId: item.foodId ?? undefined,
      servingId: item.servingId ?? undefined,
      foodName: item.foodName,
      servingName: item.servingName,
      quantity: item.quantity,
      calories: Math.round(item.calories * 10) / 10,
      protein: Math.round(item.protein * 10) / 10,
      carbs: Math.round(item.carbs * 10) / 10,
      fat: Math.round(item.fat * 10) / 10,
      fiber: Math.round(item.fiber * 10) / 10,
      isCustomEntry: item.isCustomEntry,
    };
  }

  /**
   * Map Prisma meal to summary DTO.
   */
  private mapToMealSummary(
    meal: {
      id: string;
      mealDate: Date;
      mealType: string;
      totalCalories: number;
      totalProtein: number;
      totalCarbs: number;
      totalFat: number;
      photoUrl: string | null;
      rating: number | null;
      foodItems: { id: string }[];
    },
  ): MealSummaryDto {
    return {
      id: meal.id,
      mealDate: meal.mealDate.toISOString().split('T')[0],
      mealType: meal.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
      totalCalories: Math.round(meal.totalCalories * 10) / 10,
      totalProtein: Math.round(meal.totalProtein * 10) / 10,
      totalCarbs: Math.round(meal.totalCarbs * 10) / 10,
      totalFat: Math.round(meal.totalFat * 10) / 10,
      itemCount: meal.foodItems.length,
      photoUrl: meal.photoUrl ?? undefined,
      rating: meal.rating ?? undefined,
    };
  }
}
