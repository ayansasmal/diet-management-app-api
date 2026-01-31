/**
 * Plans Module
 *
 * NestJS module for nutrition plan management.
 * Provides plan CRUD and user assignment functionality.
 *
 * @module modules/plans
 */

import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { PrismaModule } from '../../database/prisma.module';

/**
 * Module for nutrition plan operations.
 *
 * Features:
 * - List/view available plans
 * - Create/update/delete user plans
 * - Assign plans to users
 * - Customize plan assignments
 */
@Module({
  imports: [PrismaModule],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
