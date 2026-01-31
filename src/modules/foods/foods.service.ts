/**
 * Foods Service
 *
 * Business logic for food database operations.
 * Handles categories, food items, and serving sizes.
 *
 * @module modules/foods/foods.service
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  FoodCategoryDto,
  FoodItemDto,
  FoodSummaryDto,
  FoodServingDto,
  FoodListResponseDto,
} from './dto/food-response.dto';
import { FoodSearchQueryDto, CategoryQueryDto } from './dto/food-query.dto';
import {
  CreateFoodDto,
  UpdateFoodDto,
  CreateCategoryDto,
  CreateServingDto,
} from './dto/create-food.dto';

/**
 * Service for managing the food database.
 */
@Injectable()
export class FoodsService {
  constructor(private readonly prisma: PrismaService) {}

  // ========================================
  // Category Methods
  // ========================================

  /**
   * Get all food categories.
   *
   * @param query - Query options
   * @returns List of categories
   */
  async getCategories(
    query: CategoryQueryDto,
  ): Promise<(FoodCategoryDto & { foodCount?: number })[]> {
    const categories = await this.prisma.foodCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: query.includeCounts
        ? {
            _count: {
              select: { foods: true },
            },
          }
        : undefined,
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || undefined,
      icon: cat.icon || undefined,
      color: cat.color || undefined,
      sortOrder: cat.sortOrder,
      unitName: cat.unitName || undefined,
      unitDescription: cat.unitDescription || undefined,
      ...(query.includeCounts && {
        foodCount: (cat as { _count?: { foods: number } })._count?.foods || 0,
      }),
    }));
  }

  /**
   * Get a category by ID or slug.
   *
   * @param idOrSlug - Category ID or slug
   * @returns Category details
   */
  async getCategoryByIdOrSlug(idOrSlug: string): Promise<FoodCategoryDto> {
    const category = await this.prisma.foodCategory.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });

    if (!category) {
      throw new NotFoundException(`Category "${idOrSlug}" not found`);
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || undefined,
      icon: category.icon || undefined,
      color: category.color || undefined,
      sortOrder: category.sortOrder,
      unitName: category.unitName || undefined,
      unitDescription: category.unitDescription || undefined,
    };
  }

  /**
   * Create a new category (admin only).
   *
   * @param dto - Category data
   * @returns Created category
   */
  async createCategory(dto: CreateCategoryDto): Promise<FoodCategoryDto> {
    const existing = await this.prisma.foodCategory.findFirst({
      where: { OR: [{ name: dto.name }, { slug: dto.slug }] },
    });

    if (existing) {
      throw new BadRequestException(
        `Category with name "${dto.name}" or slug "${dto.slug}" already exists`,
      );
    }

    const category = await this.prisma.foodCategory.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        icon: dto.icon,
        color: dto.color,
        sortOrder: dto.sortOrder ?? 0,
        unitName: dto.unitName,
        unitDescription: dto.unitDescription,
      },
    });

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || undefined,
      icon: category.icon || undefined,
      color: category.color || undefined,
      sortOrder: category.sortOrder,
      unitName: category.unitName || undefined,
      unitDescription: category.unitDescription || undefined,
    };
  }

  // ========================================
  // Food Item Methods
  // ========================================

  /**
   * Search and list foods with filtering and pagination.
   *
   * @param query - Search and filter parameters
   * @param userId - Current user ID (for access control)
   * @returns Paginated food list
   */
  async searchFoods(
    query: FoodSearchQueryDto,
    userId: string,
  ): Promise<FoodListResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Record<string, unknown> = {
      OR: [
        { isPublic: true },
        { createdById: userId }, // User can see their own private foods
      ],
    };

    // Search by name/brand
    if (query.q) {
      whereClause.AND = [
        {
          OR: [
            { name: { contains: query.q } },
            { brandName: { contains: query.q } },
            { searchTerms: { contains: query.q } },
          ],
        },
      ];
    }

    // Filter by category
    if (query.category) {
      const category = await this.prisma.foodCategory.findFirst({
        where: { OR: [{ id: query.category }, { slug: query.category }] },
      });
      if (category) {
        whereClause.categoryId = category.id;
      }
    }

    // Filter by verified only
    if (query.verifiedOnly) {
      whereClause.isVerified = true;
    }

    // Count total
    const total = await this.prisma.foodItem.count({ where: whereClause });

    // Fetch foods with category and default serving
    const foods = await this.prisma.foodItem.findMany({
      where: whereClause,
      include: {
        category: true,
        servings: {
          where: { isDefault: true },
          take: 1,
        },
      },
      orderBy: [{ isVerified: 'desc' }, { name: 'asc' }],
      skip,
      take: limit,
    });

    // Map to summary DTOs
    const items: FoodSummaryDto[] = foods.map((food) => {
      const defaultServing = food.servings[0];
      const tags = JSON.parse(food.tags || '[]') as string[];

      // Filter by tag if specified
      if (query.tag && !tags.some((t) => t.toLowerCase().includes(query.tag!.toLowerCase()))) {
        return null as unknown as FoodSummaryDto;
      }

      return {
        id: food.id,
        name: food.name,
        brandName: food.brandName || undefined,
        categorySlug: food.category.slug,
        categoryName: food.category.name,
        categoryIcon: food.category.icon || undefined,
        isVerified: food.isVerified,
        tags,
        defaultServingName: defaultServing?.servingName || '100g',
        calories: defaultServing?.calories || 0,
        protein: defaultServing?.protein || 0,
        carbs: defaultServing?.carbs || 0,
        fat: defaultServing?.fat || 0,
      };
    }).filter(Boolean);

    return {
      items,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  /**
   * Get a food item by ID with all details.
   *
   * @param foodId - Food ID
   * @param userId - Current user ID (for access control)
   * @returns Full food details
   */
  async getFoodById(foodId: string, userId: string): Promise<FoodItemDto> {
    const food = await this.prisma.foodItem.findUnique({
      where: { id: foodId },
      include: {
        category: true,
        servings: {
          orderBy: [{ isDefault: 'desc' }, { servingName: 'asc' }],
        },
      },
    });

    if (!food) {
      throw new NotFoundException(`Food with ID "${foodId}" not found`);
    }

    // Check access
    if (!food.isPublic && food.createdById !== userId) {
      throw new ForbiddenException('You do not have access to this food item');
    }

    return this.mapToFoodItemDto(food);
  }

  /**
   * Get food by barcode.
   *
   * @param barcode - Barcode string
   * @param userId - Current user ID
   * @returns Food item or null
   */
  async getFoodByBarcode(
    barcode: string,
    userId: string,
  ): Promise<FoodItemDto | null> {
    const food = await this.prisma.foodItem.findUnique({
      where: { barcode },
      include: {
        category: true,
        servings: {
          orderBy: [{ isDefault: 'desc' }, { servingName: 'asc' }],
        },
      },
    });

    if (!food) {
      return null;
    }

    // Check access
    if (!food.isPublic && food.createdById !== userId) {
      throw new ForbiddenException('You do not have access to this food item');
    }

    return this.mapToFoodItemDto(food);
  }

  /**
   * Create a new food item.
   *
   * @param userId - Creator user ID
   * @param dto - Food data
   * @returns Created food
   */
  async createFood(userId: string, dto: CreateFoodDto): Promise<FoodItemDto> {
    // Verify category exists
    const category = await this.prisma.foodCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new BadRequestException(`Category "${dto.categoryId}" not found`);
    }

    // Check for unique barcode
    if (dto.barcode) {
      const existingBarcode = await this.prisma.foodItem.findUnique({
        where: { barcode: dto.barcode },
      });
      if (existingBarcode) {
        throw new BadRequestException(
          `Food with barcode "${dto.barcode}" already exists`,
        );
      }
    }

    // Ensure at least one serving is marked as default
    const hasDefault = dto.servings.some((s) => s.isDefault);
    if (!hasDefault) {
      dto.servings[0].isDefault = true;
    }

    // Create food with servings
    const food = await this.prisma.foodItem.create({
      data: {
        name: dto.name,
        brandName: dto.brandName,
        description: dto.description,
        categoryId: dto.categoryId,
        createdById: userId,
        isVerified: false, // User-created foods are not verified
        isPublic: dto.isPublic ?? true,
        tags: JSON.stringify(dto.tags || []),
        searchTerms: this.buildSearchTerms(dto),
        barcode: dto.barcode,
        imageUrl: dto.imageUrl,
        nutritionLabelUrl: dto.nutritionLabelUrl,
        servings: {
          create: dto.servings.map((serving) => ({
            servingName: serving.servingName,
            servingSize: serving.servingSize,
            servingUnit: serving.servingUnit,
            isDefault: serving.isDefault || false,
            isUnitServing: serving.isUnitServing || false,
            calories: serving.calories,
            protein: serving.protein,
            carbs: serving.carbs,
            fat: serving.fat,
            fiber: serving.fiber,
            sugar: serving.sugar,
            saturatedFat: serving.saturatedFat,
            sodium: serving.sodium,
            cholesterol: serving.cholesterol,
            potassium: serving.potassium,
            glycemicIndex: serving.glycemicIndex,
            glycemicLoad: serving.glycemicLoad,
          })),
        },
      },
      include: {
        category: true,
        servings: {
          orderBy: [{ isDefault: 'desc' }, { servingName: 'asc' }],
        },
      },
    });

    return this.mapToFoodItemDto(food);
  }

  /**
   * Update a food item.
   * Only the creator or admin can update.
   *
   * @param foodId - Food ID
   * @param userId - Current user ID
   * @param dto - Update data
   * @returns Updated food
   */
  async updateFood(
    foodId: string,
    userId: string,
    dto: UpdateFoodDto,
  ): Promise<FoodItemDto> {
    const existing = await this.prisma.foodItem.findUnique({
      where: { id: foodId },
    });

    if (!existing) {
      throw new NotFoundException(`Food with ID "${foodId}" not found`);
    }

    // Check ownership (system foods require admin role, handled at controller)
    if (existing.createdById && existing.createdById !== userId) {
      throw new ForbiddenException('You can only update your own foods');
    }

    // Check barcode uniqueness if updating
    if (dto.barcode && dto.barcode !== existing.barcode) {
      const existingBarcode = await this.prisma.foodItem.findUnique({
        where: { barcode: dto.barcode },
      });
      if (existingBarcode) {
        throw new BadRequestException(
          `Food with barcode "${dto.barcode}" already exists`,
        );
      }
    }

    const food = await this.prisma.foodItem.update({
      where: { id: foodId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.brandName !== undefined && { brandName: dto.brandName }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.isPublic !== undefined && { isPublic: dto.isPublic }),
        ...(dto.tags !== undefined && { tags: JSON.stringify(dto.tags) }),
        ...(dto.barcode !== undefined && { barcode: dto.barcode }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.nutritionLabelUrl !== undefined && {
          nutritionLabelUrl: dto.nutritionLabelUrl,
        }),
      },
      include: {
        category: true,
        servings: {
          orderBy: [{ isDefault: 'desc' }, { servingName: 'asc' }],
        },
      },
    });

    return this.mapToFoodItemDto(food);
  }

  /**
   * Delete a food item.
   * Only the creator or admin can delete.
   *
   * @param foodId - Food ID
   * @param userId - Current user ID
   */
  async deleteFood(foodId: string, userId: string): Promise<void> {
    const existing = await this.prisma.foodItem.findUnique({
      where: { id: foodId },
    });

    if (!existing) {
      throw new NotFoundException(`Food with ID "${foodId}" not found`);
    }

    // System foods (no creator) require admin role
    if (!existing.createdById) {
      throw new ForbiddenException('System foods cannot be deleted');
    }

    if (existing.createdById !== userId) {
      throw new ForbiddenException('You can only delete your own foods');
    }

    await this.prisma.foodItem.delete({ where: { id: foodId } });
  }

  // ========================================
  // Serving Methods
  // ========================================

  /**
   * Add a serving size to a food.
   *
   * @param foodId - Food ID
   * @param userId - Current user ID
   * @param dto - Serving data
   * @returns Updated food
   */
  async addServing(
    foodId: string,
    userId: string,
    dto: CreateServingDto,
  ): Promise<FoodItemDto> {
    const food = await this.prisma.foodItem.findUnique({
      where: { id: foodId },
    });

    if (!food) {
      throw new NotFoundException(`Food with ID "${foodId}" not found`);
    }

    // Check ownership
    if (food.createdById && food.createdById !== userId) {
      throw new ForbiddenException('You can only modify your own foods');
    }

    // If this is the new default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.foodServing.updateMany({
        where: { foodId },
        data: { isDefault: false },
      });
    }

    await this.prisma.foodServing.create({
      data: {
        foodId,
        servingName: dto.servingName,
        servingSize: dto.servingSize,
        servingUnit: dto.servingUnit,
        isDefault: dto.isDefault || false,
        isUnitServing: dto.isUnitServing || false,
        calories: dto.calories,
        protein: dto.protein,
        carbs: dto.carbs,
        fat: dto.fat,
        fiber: dto.fiber,
        sugar: dto.sugar,
        saturatedFat: dto.saturatedFat,
        sodium: dto.sodium,
        cholesterol: dto.cholesterol,
        potassium: dto.potassium,
        glycemicIndex: dto.glycemicIndex,
        glycemicLoad: dto.glycemicLoad,
      },
    });

    return this.getFoodById(foodId, userId);
  }

  /**
   * Delete a serving size from a food.
   *
   * @param foodId - Food ID
   * @param servingId - Serving ID
   * @param userId - Current user ID
   * @returns Updated food
   */
  async deleteServing(
    foodId: string,
    servingId: string,
    userId: string,
  ): Promise<FoodItemDto> {
    const food = await this.prisma.foodItem.findUnique({
      where: { id: foodId },
      include: { servings: true },
    });

    if (!food) {
      throw new NotFoundException(`Food with ID "${foodId}" not found`);
    }

    // Check ownership
    if (food.createdById && food.createdById !== userId) {
      throw new ForbiddenException('You can only modify your own foods');
    }

    // Cannot delete if it's the only serving
    if (food.servings.length <= 1) {
      throw new BadRequestException('Cannot delete the only serving size');
    }

    const serving = food.servings.find((s) => s.id === servingId);
    if (!serving) {
      throw new NotFoundException(`Serving "${servingId}" not found`);
    }

    await this.prisma.foodServing.delete({ where: { id: servingId } });

    // If deleted serving was default, make another one default
    if (serving.isDefault) {
      await this.prisma.foodServing.updateMany({
        where: { foodId },
        data: { isDefault: true },
      });
    }

    return this.getFoodById(foodId, userId);
  }

  // ========================================
  // Helper Methods
  // ========================================

  /**
   * Build search terms string for a food.
   */
  private buildSearchTerms(dto: CreateFoodDto): string {
    const terms: string[] = [dto.name.toLowerCase()];

    if (dto.brandName) {
      terms.push(dto.brandName.toLowerCase());
    }

    if (dto.tags) {
      terms.push(...dto.tags.map((t) => t.toLowerCase()));
    }

    return terms.join(',');
  }

  /**
   * Map Prisma food to DTO.
   */
  private mapToFoodItemDto(food: {
    id: string;
    name: string;
    brandName: string | null;
    description: string | null;
    categoryId: string;
    isVerified: boolean;
    isPublic: boolean;
    tags: string;
    barcode: string | null;
    imageUrl: string | null;
    nutritionLabelUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    category: {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      icon: string | null;
      color: string | null;
      sortOrder: number;
      unitName: string | null;
      unitDescription: string | null;
    };
    servings: {
      id: string;
      servingName: string;
      servingSize: number;
      servingUnit: string;
      isDefault: boolean;
      isUnitServing: boolean;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number | null;
      sugar: number | null;
      saturatedFat: number | null;
      sodium: number | null;
      cholesterol: number | null;
      potassium: number | null;
      glycemicIndex: number | null;
      glycemicLoad: number | null;
    }[];
  }): FoodItemDto {
    return {
      id: food.id,
      name: food.name,
      brandName: food.brandName || undefined,
      description: food.description || undefined,
      categoryId: food.categoryId,
      category: {
        id: food.category.id,
        name: food.category.name,
        slug: food.category.slug,
        description: food.category.description || undefined,
        icon: food.category.icon || undefined,
        color: food.category.color || undefined,
        sortOrder: food.category.sortOrder,
        unitName: food.category.unitName || undefined,
        unitDescription: food.category.unitDescription || undefined,
      },
      isVerified: food.isVerified,
      isPublic: food.isPublic,
      tags: JSON.parse(food.tags || '[]') as string[],
      barcode: food.barcode || undefined,
      imageUrl: food.imageUrl || undefined,
      nutritionLabelUrl: food.nutritionLabelUrl || undefined,
      servings: food.servings.map(
        (s): FoodServingDto => ({
          id: s.id,
          servingName: s.servingName,
          servingSize: s.servingSize,
          servingUnit: s.servingUnit,
          isDefault: s.isDefault,
          isUnitServing: s.isUnitServing,
          calories: s.calories,
          protein: s.protein,
          carbs: s.carbs,
          fat: s.fat,
          fiber: s.fiber ?? undefined,
          sugar: s.sugar ?? undefined,
          saturatedFat: s.saturatedFat ?? undefined,
          sodium: s.sodium ?? undefined,
          cholesterol: s.cholesterol ?? undefined,
          potassium: s.potassium ?? undefined,
          glycemicIndex: s.glycemicIndex ?? undefined,
          glycemicLoad: s.glycemicLoad ?? undefined,
        }),
      ),
      createdAt: food.createdAt,
      updatedAt: food.updatedAt,
    };
  }
}
