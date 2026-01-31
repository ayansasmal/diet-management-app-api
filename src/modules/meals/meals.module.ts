/**
 * Meals Module
 *
 * NestJS module for meal logging functionality.
 *
 * @module modules/meals
 */

import { Module } from '@nestjs/common';
import { MealsController } from './meals.controller';
import { MealsService } from './meals.service';
import { PrismaModule } from '../../database/prisma.module';

/**
 * Module for meal logging functionality.
 *
 * Features:
 * - Create/update/delete meal logs
 * - Track food items within meals
 * - Daily summaries and history
 * - Rating and notes for meals
 */
@Module({
  imports: [PrismaModule],
  controllers: [MealsController],
  providers: [MealsService],
  exports: [MealsService],
})
export class MealsModule {}
