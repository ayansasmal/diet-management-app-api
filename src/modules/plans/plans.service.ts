/**
 * Plans Service
 *
 * Business logic for nutrition plan operations.
 * Handles plan CRUD, user assignments, and customizations.
 *
 * @module modules/plans/plans.service
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { AssignPlanDto, UpdateAssignmentDto, PlansQueryDto } from './dto/assign-plan.dto';
import {
  PlanResponseDto,
  PlanSummaryDto,
  UserPlanAssignmentResponseDto,
  MacroTargetsDto,
  MealFlowConfigDto,
  NutritionRuleDto,
} from './dto/plan-response.dto';

/**
 * Service for managing nutrition plans and user assignments.
 */
@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parse JSON fields from database plan record.
   * @param plan - Raw plan from database
   * @returns Plan with parsed JSON fields
   */
  private parsePlanJson(plan: {
    id: string;
    name: string;
    shortDescription: string;
    longDescription: string | null;
    visibility: string;
    createdById: string | null;
    difficulty: string;
    tags: string;
    sourceAttribution: string | null;
    version: string;
    isPremium: boolean;
    icon: string | null;
    accentColor: string | null;
    dailyTargets: string;
    mealFlow: string;
    rules: string;
    useNetCarbs: boolean;
    defaultServingMultiplier: number;
    tips: string | null;
    extensions: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): PlanResponseDto {
    return {
      id: plan.id,
      name: plan.name,
      shortDescription: plan.shortDescription,
      longDescription: plan.longDescription || undefined,
      visibility: plan.visibility,
      createdById: plan.createdById || undefined,
      difficulty: plan.difficulty,
      tags: JSON.parse(plan.tags) as string[],
      sourceAttribution: plan.sourceAttribution || undefined,
      version: plan.version,
      isPremium: plan.isPremium,
      icon: plan.icon || undefined,
      accentColor: plan.accentColor || undefined,
      dailyTargets: JSON.parse(plan.dailyTargets) as MacroTargetsDto,
      mealFlow: JSON.parse(plan.mealFlow) as MealFlowConfigDto,
      rules: JSON.parse(plan.rules) as NutritionRuleDto[],
      useNetCarbs: plan.useNetCarbs,
      defaultServingMultiplier: plan.defaultServingMultiplier,
      tips: plan.tips ? (JSON.parse(plan.tips) as string[]) : undefined,
      extensions: plan.extensions
        ? (JSON.parse(plan.extensions) as Record<string, unknown>)
        : undefined,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  /**
   * Convert plan to summary format for list responses.
   * @param plan - Full plan response
   * @returns Simplified plan summary
   */
  private toPlanSummary(plan: PlanResponseDto): PlanSummaryDto {
    return {
      id: plan.id,
      name: plan.name,
      shortDescription: plan.shortDescription,
      visibility: plan.visibility,
      difficulty: plan.difficulty,
      tags: plan.tags,
      isPremium: plan.isPremium,
      icon: plan.icon,
      accentColor: plan.accentColor,
      calorieTarget: plan.dailyTargets.calories?.target,
    };
  }

  /**
   * Get all available plans for the current user.
   * Includes system plans, public plans, and user's own private plans.
   *
   * @param userId - Current user ID
   * @param query - Filter parameters
   * @returns List of available plans
   */
  async findAll(userId: string, query: PlansQueryDto): Promise<PlanSummaryDto[]> {
    const whereClause: Record<string, unknown> = {
      OR: [
        { visibility: 'system' },
        { visibility: 'public' },
        { visibility: 'private', createdById: userId },
      ],
    };

    // Apply filters
    if (query.visibility) {
      if (query.visibility === 'private') {
        whereClause.AND = [{ visibility: 'private', createdById: userId }];
        delete whereClause.OR;
      } else {
        whereClause.AND = [{ visibility: query.visibility }];
        delete whereClause.OR;
      }
    }

    if (query.difficulty) {
      whereClause.difficulty = query.difficulty;
    }

    if (!query.includePremium) {
      whereClause.isPremium = false;
    }

    const plans = await this.prisma.nutritionPlan.findMany({
      where: whereClause,
      orderBy: [{ visibility: 'asc' }, { name: 'asc' }],
    });

    let result = plans.map((plan) => this.toPlanSummary(this.parsePlanJson(plan)));

    // Filter by tag if specified
    if (query.tag) {
      result = result.filter((plan) =>
        plan.tags.some((t) => t.toLowerCase().includes(query.tag!.toLowerCase())),
      );
    }

    return result;
  }

  /**
   * Get a plan by ID.
   * Validates user has access to the plan.
   *
   * @param planId - Plan ID
   * @param userId - Current user ID
   * @returns Full plan details
   * @throws NotFoundException if plan doesn't exist
   * @throws ForbiddenException if user can't access private plan
   */
  async findOne(planId: string, userId: string): Promise<PlanResponseDto> {
    const plan = await this.prisma.nutritionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    // Check access for private plans
    if (plan.visibility === 'private' && plan.createdById !== userId) {
      // Check if user has an assignment to this plan (dietician assigned)
      const hasAssignment = await this.prisma.userPlanAssignment.findUnique({
        where: { userId_planId: { userId, planId } },
      });

      if (!hasAssignment) {
        throw new ForbiddenException('You do not have access to this plan');
      }
    }

    return this.parsePlanJson(plan);
  }

  /**
   * Create a new nutrition plan.
   *
   * @param userId - Creator user ID
   * @param dto - Plan creation data
   * @returns Created plan
   */
  async create(userId: string, dto: CreatePlanDto): Promise<PlanResponseDto> {
    const plan = await this.prisma.nutritionPlan.create({
      data: {
        name: dto.name,
        shortDescription: dto.shortDescription,
        longDescription: dto.longDescription,
        visibility: dto.visibility || 'private',
        createdById: userId,
        difficulty: dto.difficulty || 'intermediate',
        tags: JSON.stringify(dto.tags || []),
        sourceAttribution: dto.sourceAttribution,
        icon: dto.icon,
        accentColor: dto.accentColor,
        dailyTargets: JSON.stringify(dto.dailyTargets),
        mealFlow: JSON.stringify(dto.mealFlow),
        rules: JSON.stringify(dto.rules || []),
        useNetCarbs: dto.useNetCarbs || false,
        defaultServingMultiplier: dto.defaultServingMultiplier || 1,
        tips: dto.tips ? JSON.stringify(dto.tips) : null,
        extensions: dto.extensions ? JSON.stringify(dto.extensions) : null,
      },
    });

    return this.parsePlanJson(plan);
  }

  /**
   * Update an existing plan.
   * Only the creator can update a plan.
   *
   * @param planId - Plan ID to update
   * @param userId - Current user ID
   * @param dto - Partial update data
   * @returns Updated plan
   * @throws NotFoundException if plan doesn't exist
   * @throws ForbiddenException if user isn't the creator
   */
  async update(
    planId: string,
    userId: string,
    dto: Partial<CreatePlanDto>,
  ): Promise<PlanResponseDto> {
    const existing = await this.prisma.nutritionPlan.findUnique({
      where: { id: planId },
    });

    if (!existing) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    // System plans can only be updated by admins (handled at controller level)
    if (existing.visibility === 'system') {
      throw new ForbiddenException('System plans cannot be modified');
    }

    if (existing.createdById !== userId) {
      throw new ForbiddenException('You can only update your own plans');
    }

    const updateData: Record<string, unknown> = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.shortDescription !== undefined)
      updateData.shortDescription = dto.shortDescription;
    if (dto.longDescription !== undefined)
      updateData.longDescription = dto.longDescription;
    if (dto.visibility !== undefined) updateData.visibility = dto.visibility;
    if (dto.difficulty !== undefined) updateData.difficulty = dto.difficulty;
    if (dto.tags !== undefined) updateData.tags = JSON.stringify(dto.tags);
    if (dto.sourceAttribution !== undefined)
      updateData.sourceAttribution = dto.sourceAttribution;
    if (dto.icon !== undefined) updateData.icon = dto.icon;
    if (dto.accentColor !== undefined) updateData.accentColor = dto.accentColor;
    if (dto.dailyTargets !== undefined)
      updateData.dailyTargets = JSON.stringify(dto.dailyTargets);
    if (dto.mealFlow !== undefined)
      updateData.mealFlow = JSON.stringify(dto.mealFlow);
    if (dto.rules !== undefined) updateData.rules = JSON.stringify(dto.rules);
    if (dto.useNetCarbs !== undefined) updateData.useNetCarbs = dto.useNetCarbs;
    if (dto.defaultServingMultiplier !== undefined)
      updateData.defaultServingMultiplier = dto.defaultServingMultiplier;
    if (dto.tips !== undefined)
      updateData.tips = dto.tips ? JSON.stringify(dto.tips) : null;
    if (dto.extensions !== undefined)
      updateData.extensions = dto.extensions
        ? JSON.stringify(dto.extensions)
        : null;

    const plan = await this.prisma.nutritionPlan.update({
      where: { id: planId },
      data: updateData,
    });

    return this.parsePlanJson(plan);
  }

  /**
   * Delete a plan.
   * Only the creator can delete a plan.
   *
   * @param planId - Plan ID to delete
   * @param userId - Current user ID
   * @throws NotFoundException if plan doesn't exist
   * @throws ForbiddenException if user isn't the creator
   */
  async delete(planId: string, userId: string): Promise<void> {
    const existing = await this.prisma.nutritionPlan.findUnique({
      where: { id: planId },
    });

    if (!existing) {
      throw new NotFoundException(`Plan with ID ${planId} not found`);
    }

    if (existing.visibility === 'system') {
      throw new ForbiddenException('System plans cannot be deleted');
    }

    if (existing.createdById !== userId) {
      throw new ForbiddenException('You can only delete your own plans');
    }

    await this.prisma.nutritionPlan.delete({
      where: { id: planId },
    });
  }

  // ========================================
  // User Plan Assignment Methods
  // ========================================

  /**
   * Get the user's current active plan assignment.
   *
   * @param userId - User ID
   * @returns Active plan assignment or null
   */
  async getActiveAssignment(
    userId: string,
  ): Promise<UserPlanAssignmentResponseDto | null> {
    const assignment = await this.prisma.userPlanAssignment.findFirst({
      where: { userId, isActive: true },
      include: { plan: true },
    });

    if (!assignment) {
      return null;
    }

    return {
      id: assignment.id,
      userId: assignment.userId,
      planId: assignment.planId,
      plan: this.parsePlanJson(assignment.plan),
      customTargets: assignment.customTargets
        ? (JSON.parse(assignment.customTargets) as Partial<MacroTargetsDto>)
        : undefined,
      disabledRules: assignment.disabledRules
        ? (JSON.parse(assignment.disabledRules) as string[])
        : undefined,
      startedAt: assignment.startedAt,
      targetDate: assignment.targetDate || undefined,
      notes: assignment.notes || undefined,
      isActive: assignment.isActive,
      assignedById: assignment.assignedById || undefined,
      sharedWith: assignment.sharedWith
        ? (JSON.parse(assignment.sharedWith) as string[])
        : undefined,
    };
  }

  /**
   * Get all plan assignments for a user (history).
   *
   * @param userId - User ID
   * @returns All plan assignments
   */
  async getAllAssignments(userId: string): Promise<UserPlanAssignmentResponseDto[]> {
    const assignments = await this.prisma.userPlanAssignment.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { startedAt: 'desc' },
    });

    return assignments.map((assignment) => ({
      id: assignment.id,
      userId: assignment.userId,
      planId: assignment.planId,
      plan: this.parsePlanJson(assignment.plan),
      customTargets: assignment.customTargets
        ? (JSON.parse(assignment.customTargets) as Partial<MacroTargetsDto>)
        : undefined,
      disabledRules: assignment.disabledRules
        ? (JSON.parse(assignment.disabledRules) as string[])
        : undefined,
      startedAt: assignment.startedAt,
      targetDate: assignment.targetDate || undefined,
      notes: assignment.notes || undefined,
      isActive: assignment.isActive,
      assignedById: assignment.assignedById || undefined,
      sharedWith: assignment.sharedWith
        ? (JSON.parse(assignment.sharedWith) as string[])
        : undefined,
    }));
  }

  /**
   * Assign a plan to the current user.
   * Deactivates any existing active assignment.
   *
   * @param userId - User ID
   * @param dto - Assignment data
   * @returns New assignment
   */
  async assignPlan(
    userId: string,
    dto: AssignPlanDto,
  ): Promise<UserPlanAssignmentResponseDto> {
    // Verify plan exists and user has access
    const plan = await this.findOne(dto.planId, userId);

    // Deactivate any existing active assignments
    await this.prisma.userPlanAssignment.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Create or update assignment
    const assignment = await this.prisma.userPlanAssignment.upsert({
      where: { userId_planId: { userId, planId: dto.planId } },
      update: {
        isActive: true,
        startedAt: new Date(),
        customTargets: dto.customTargets
          ? JSON.stringify(dto.customTargets)
          : null,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        notes: dto.notes,
      },
      create: {
        userId,
        planId: dto.planId,
        isActive: true,
        customTargets: dto.customTargets
          ? JSON.stringify(dto.customTargets)
          : null,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        notes: dto.notes,
      },
      include: { plan: true },
    });

    return {
      id: assignment.id,
      userId: assignment.userId,
      planId: assignment.planId,
      plan: plan,
      customTargets: dto.customTargets || undefined,
      disabledRules: undefined,
      startedAt: assignment.startedAt,
      targetDate: assignment.targetDate || undefined,
      notes: assignment.notes || undefined,
      isActive: assignment.isActive,
    };
  }

  /**
   * Update the user's current plan assignment (customizations).
   *
   * @param userId - User ID
   * @param dto - Update data
   * @returns Updated assignment
   * @throws BadRequestException if no active assignment
   */
  async updateAssignment(
    userId: string,
    dto: UpdateAssignmentDto,
  ): Promise<UserPlanAssignmentResponseDto> {
    const current = await this.prisma.userPlanAssignment.findFirst({
      where: { userId, isActive: true },
    });

    if (!current) {
      throw new BadRequestException('No active plan assignment to update');
    }

    const updateData: Record<string, unknown> = {};

    if (dto.customTargets !== undefined) {
      updateData.customTargets = dto.customTargets
        ? JSON.stringify(dto.customTargets)
        : null;
    }
    if (dto.disabledRules !== undefined) {
      updateData.disabledRules = dto.disabledRules
        ? JSON.stringify(dto.disabledRules)
        : null;
    }
    if (dto.targetDate !== undefined) {
      updateData.targetDate = dto.targetDate ? new Date(dto.targetDate) : null;
    }
    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }
    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    const updated = await this.prisma.userPlanAssignment.update({
      where: { id: current.id },
      data: updateData,
      include: { plan: true },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      planId: updated.planId,
      plan: this.parsePlanJson(updated.plan),
      customTargets: updated.customTargets
        ? (JSON.parse(updated.customTargets) as Partial<MacroTargetsDto>)
        : undefined,
      disabledRules: updated.disabledRules
        ? (JSON.parse(updated.disabledRules) as string[])
        : undefined,
      startedAt: updated.startedAt,
      targetDate: updated.targetDate || undefined,
      notes: updated.notes || undefined,
      isActive: updated.isActive,
    };
  }

  /**
   * Deactivate the user's current plan (stop following).
   *
   * @param userId - User ID
   */
  async deactivateCurrentPlan(userId: string): Promise<void> {
    await this.prisma.userPlanAssignment.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });
  }
}
