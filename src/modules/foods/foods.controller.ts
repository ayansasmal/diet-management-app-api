/**
 * Foods Controller
 *
 * REST API endpoints for the food database.
 * Includes categories, food items, and servings.
 *
 * @module modules/foods/foods.controller
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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FoodsService } from './foods.service';
import {
  FoodCategoryDto,
  FoodItemDto,
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
 * JWT payload structure from authentication.
 */
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/**
 * Controller for food database operations.
 *
 * Endpoints:
 * - GET /foods/categories - List all categories
 * - GET /foods/categories/:id - Get category by ID/slug
 * - POST /foods/categories - Create category (admin)
 * - GET /foods - Search/list foods
 * - GET /foods/:id - Get food details
 * - GET /foods/barcode/:barcode - Get food by barcode
 * - POST /foods - Create food
 * - PATCH /foods/:id - Update food
 * - DELETE /foods/:id - Delete food
 * - POST /foods/:id/servings - Add serving
 * - DELETE /foods/:id/servings/:servingId - Delete serving
 */
@ApiTags('Food Database')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  // ========================================
  // Category Endpoints
  // ========================================

  /**
   * List all food categories.
   */
  @Get('categories')
  @ApiOperation({
    summary: 'List food categories',
    description: 'Returns all food categories (protein, carbs, vegetables, etc.)',
  })
  @ApiQuery({
    name: 'includeCounts',
    required: false,
    type: Boolean,
    description: 'Include food counts per category',
  })
  @ApiResponse({
    status: 200,
    description: 'List of categories',
    type: [FoodCategoryDto],
  })
  async getCategories(
    @Query() query: CategoryQueryDto,
  ): Promise<(FoodCategoryDto & { foodCount?: number })[]> {
    return this.foodsService.getCategories(query);
  }

  /**
   * Get a category by ID or slug.
   */
  @Get('categories/:idOrSlug')
  @ApiOperation({
    summary: 'Get category by ID or slug',
    description: 'Returns category details by ID or URL-friendly slug',
  })
  @ApiParam({ name: 'idOrSlug', description: 'Category ID or slug' })
  @ApiResponse({
    status: 200,
    description: 'Category details',
    type: FoodCategoryDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryByIdOrSlug(
    @Param('idOrSlug') idOrSlug: string,
  ): Promise<FoodCategoryDto> {
    return this.foodsService.getCategoryByIdOrSlug(idOrSlug);
  }

  /**
   * Create a new category (admin only).
   */
  @Post('categories')
  @ApiOperation({
    summary: 'Create food category (admin)',
    description: 'Create a new food category. Requires admin role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Category created',
    type: FoodCategoryDto,
  })
  @ApiResponse({ status: 400, description: 'Category already exists' })
  @ApiResponse({ status: 403, description: 'Admin role required' })
  async createCategory(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCategoryDto,
  ): Promise<FoodCategoryDto> {
    // TODO: Add admin role check
    // if (user.role !== 'admin') {
    //   throw new ForbiddenException('Admin role required');
    // }
    return this.foodsService.createCategory(dto);
  }

  // ========================================
  // Food Search Endpoints
  // ========================================

  /**
   * Search and list foods.
   */
  @Get()
  @ApiOperation({
    summary: 'Search foods',
    description:
      'Search foods by name, brand, or tags. Filter by category and pagination.',
  })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category slug',
  })
  @ApiQuery({ name: 'tag', required: false, description: 'Filter by tag' })
  @ApiQuery({
    name: 'verifiedOnly',
    required: false,
    type: Boolean,
    description: 'Only verified foods',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated food list',
    type: FoodListResponseDto,
  })
  async searchFoods(
    @CurrentUser() user: JwtPayload,
    @Query() query: FoodSearchQueryDto,
  ): Promise<FoodListResponseDto> {
    return this.foodsService.searchFoods(query, user.sub);
  }

  /**
   * Get food by barcode.
   */
  @Get('barcode/:barcode')
  @ApiOperation({
    summary: 'Get food by barcode',
    description: 'Lookup a food item by its barcode (EAN/UPC)',
  })
  @ApiParam({ name: 'barcode', description: 'Barcode string' })
  @ApiResponse({
    status: 200,
    description: 'Food details or null if not found',
    type: FoodItemDto,
  })
  async getFoodByBarcode(
    @CurrentUser() user: JwtPayload,
    @Param('barcode') barcode: string,
  ): Promise<FoodItemDto | null> {
    return this.foodsService.getFoodByBarcode(barcode, user.sub);
  }

  /**
   * Get food by ID.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get food details',
    description: 'Returns full food details with all serving sizes',
  })
  @ApiParam({ name: 'id', description: 'Food ID' })
  @ApiResponse({
    status: 200,
    description: 'Food details',
    type: FoodItemDto,
  })
  @ApiResponse({ status: 404, description: 'Food not found' })
  @ApiResponse({ status: 403, description: 'Access denied to private food' })
  async getFoodById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<FoodItemDto> {
    return this.foodsService.getFoodById(id, user.sub);
  }

  // ========================================
  // Food CRUD Endpoints
  // ========================================

  /**
   * Create a new food.
   */
  @Post()
  @ApiOperation({
    summary: 'Create a food item',
    description:
      'Create a new food with serving sizes. User-created foods are not verified by default.',
  })
  @ApiResponse({
    status: 201,
    description: 'Food created',
    type: FoodItemDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid food data' })
  async createFood(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateFoodDto,
  ): Promise<FoodItemDto> {
    return this.foodsService.createFood(user.sub, dto);
  }

  /**
   * Update a food.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a food item',
    description: 'Update food details. Only the creator can update their foods.',
  })
  @ApiParam({ name: 'id', description: 'Food ID' })
  @ApiResponse({
    status: 200,
    description: 'Food updated',
    type: FoodItemDto,
  })
  @ApiResponse({ status: 404, description: 'Food not found' })
  @ApiResponse({ status: 403, description: 'Cannot modify this food' })
  async updateFood(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateFoodDto,
  ): Promise<FoodItemDto> {
    return this.foodsService.updateFood(id, user.sub, dto);
  }

  /**
   * Delete a food.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a food item',
    description: 'Delete a food. Only the creator can delete their foods.',
  })
  @ApiParam({ name: 'id', description: 'Food ID' })
  @ApiResponse({ status: 204, description: 'Food deleted' })
  @ApiResponse({ status: 404, description: 'Food not found' })
  @ApiResponse({ status: 403, description: 'Cannot delete this food' })
  async deleteFood(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.foodsService.deleteFood(id, user.sub);
  }

  // ========================================
  // Serving Endpoints
  // ========================================

  /**
   * Add a serving size to a food.
   */
  @Post(':id/servings')
  @ApiOperation({
    summary: 'Add serving size',
    description: 'Add a new serving size option to a food item',
  })
  @ApiParam({ name: 'id', description: 'Food ID' })
  @ApiResponse({
    status: 201,
    description: 'Serving added, returns updated food',
    type: FoodItemDto,
  })
  @ApiResponse({ status: 404, description: 'Food not found' })
  @ApiResponse({ status: 403, description: 'Cannot modify this food' })
  async addServing(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateServingDto,
  ): Promise<FoodItemDto> {
    return this.foodsService.addServing(id, user.sub, dto);
  }

  /**
   * Delete a serving size from a food.
   */
  @Delete(':id/servings/:servingId')
  @ApiOperation({
    summary: 'Delete serving size',
    description: 'Remove a serving size from a food. Cannot delete the last serving.',
  })
  @ApiParam({ name: 'id', description: 'Food ID' })
  @ApiParam({ name: 'servingId', description: 'Serving ID' })
  @ApiResponse({
    status: 200,
    description: 'Serving deleted, returns updated food',
    type: FoodItemDto,
  })
  @ApiResponse({ status: 404, description: 'Food or serving not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete only serving' })
  @ApiResponse({ status: 403, description: 'Cannot modify this food' })
  async deleteServing(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('servingId') servingId: string,
  ): Promise<FoodItemDto> {
    return this.foodsService.deleteServing(id, servingId, user.sub);
  }
}
