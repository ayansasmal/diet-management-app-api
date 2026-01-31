/**
 * Foods Module
 *
 * NestJS module for food database management.
 * Provides food search, CRUD, and category operations.
 *
 * @module modules/foods
 */

import { Module } from '@nestjs/common';
import { FoodsController } from './foods.controller';
import { FoodsService } from './foods.service';
import { PrismaModule } from '../../database/prisma.module';

/**
 * Module for food database operations.
 *
 * Features:
 * - List/search foods
 * - Get food details with servings
 * - Create/update/delete user foods
 * - Manage food categories
 * - Barcode lookup
 */
@Module({
  imports: [PrismaModule],
  controllers: [FoodsController],
  providers: [FoodsService],
  exports: [FoodsService],
})
export class FoodsModule {}
