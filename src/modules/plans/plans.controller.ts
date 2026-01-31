/**
 * Plans Controller
 *
 * REST API endpoints for nutrition plan management.
 * Includes plan CRUD and user assignment operations.
 *
 * @module modules/plans/plans.controller
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
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import {
  AssignPlanDto,
  UpdateAssignmentDto,
  PlansQueryDto,
} from './dto/assign-plan.dto';
import {
  PlanResponseDto,
  PlanSummaryDto,
  UserPlanAssignmentResponseDto,
} from './dto/plan-response.dto';

/**
 * JWT payload structure from authentication.
 */
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

/**
 * Controller for nutrition plan operations.
 *
 * Endpoints:
 * - GET /plans - List available plans
 * - GET /plans/:id - Get plan details
 * - POST /plans - Create new plan
 * - PATCH /plans/:id - Update plan
 * - DELETE /plans/:id - Delete plan
 * - GET /users/plan - Get active plan assignment
 * - GET /users/plan/history - Get all assignments
 * - POST /users/plan - Assign plan to user
 * - PATCH /users/plan - Update assignment
 * - DELETE /users/plan - Deactivate current plan
 */
@ApiTags('Nutrition Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  // ========================================
  // Plan CRUD Endpoints
  // ========================================

  /**
   * List all available nutrition plans.
   * Returns system plans, public plans, and user's own private plans.
   */
  @Get('plans')
  @ApiOperation({
    summary: 'List available nutrition plans',
    description:
      'Returns system plans, public plans, and your private plans. Use query params to filter.',
  })
  @ApiQuery({ name: 'visibility', required: false, enum: ['system', 'public', 'private'] })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['beginner', 'intermediate', 'advanced'] })
  @ApiQuery({ name: 'tag', required: false, description: 'Filter by tag' })
  @ApiQuery({ name: 'includePremium', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'List of available plans',
    type: [PlanSummaryDto],
  })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: PlansQueryDto,
  ): Promise<PlanSummaryDto[]> {
    return this.plansService.findAll(user.sub, query);
  }

  /**
   * Get a specific plan by ID.
   */
  @Get('plans/:id')
  @ApiOperation({
    summary: 'Get plan details',
    description: 'Returns full plan details including targets, meal flow, and rules.',
  })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Plan details',
    type: PlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 403, description: 'Access denied to private plan' })
  async findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<PlanResponseDto> {
    return this.plansService.findOne(id, user.sub);
  }

  /**
   * Create a new nutrition plan.
   */
  @Post('plans')
  @ApiOperation({
    summary: 'Create a nutrition plan',
    description: 'Create a new private plan. Requires complete daily targets and meal flow.',
  })
  @ApiResponse({
    status: 201,
    description: 'Plan created successfully',
    type: PlanResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid plan data' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePlanDto,
  ): Promise<PlanResponseDto> {
    return this.plansService.create(user.sub, dto);
  }

  /**
   * Update an existing plan.
   * Only the creator can update their own plans.
   */
  @Patch('plans/:id')
  @ApiOperation({
    summary: 'Update a nutrition plan',
    description: 'Update your own plan. System plans cannot be modified.',
  })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Plan updated successfully',
    type: PlanResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 403, description: 'Cannot modify this plan' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: Partial<CreatePlanDto>,
  ): Promise<PlanResponseDto> {
    return this.plansService.update(id, user.sub, dto);
  }

  /**
   * Delete a plan.
   * Only the creator can delete their own plans.
   */
  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a nutrition plan',
    description: 'Delete your own plan. System plans cannot be deleted.',
  })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiResponse({ status: 204, description: 'Plan deleted successfully' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 403, description: 'Cannot delete this plan' })
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<void> {
    return this.plansService.delete(id, user.sub);
  }

  // ========================================
  // User Plan Assignment Endpoints
  // ========================================

  /**
   * Get the user's current active plan assignment.
   */
  @Get('users/plan')
  @ApiOperation({
    summary: 'Get your active plan',
    description: 'Returns your currently active plan assignment with customizations.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active plan assignment (or null if none)',
    type: UserPlanAssignmentResponseDto,
  })
  async getActivePlan(
    @CurrentUser() user: JwtPayload,
  ): Promise<UserPlanAssignmentResponseDto | null> {
    return this.plansService.getActiveAssignment(user.sub);
  }

  /**
   * Get all plan assignments (history).
   */
  @Get('users/plan/history')
  @ApiOperation({
    summary: 'Get your plan history',
    description: 'Returns all your past and current plan assignments.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all plan assignments',
    type: [UserPlanAssignmentResponseDto],
  })
  async getPlanHistory(
    @CurrentUser() user: JwtPayload,
  ): Promise<UserPlanAssignmentResponseDto[]> {
    return this.plansService.getAllAssignments(user.sub);
  }

  /**
   * Assign a plan to the current user.
   * Deactivates any existing active assignment.
   */
  @Post('users/plan')
  @ApiOperation({
    summary: 'Start following a plan',
    description:
      'Assign a plan to yourself. Any existing active plan will be deactivated.',
  })
  @ApiResponse({
    status: 201,
    description: 'Plan assigned successfully',
    type: UserPlanAssignmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 403, description: 'Cannot access this plan' })
  async assignPlan(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AssignPlanDto,
  ): Promise<UserPlanAssignmentResponseDto> {
    return this.plansService.assignPlan(user.sub, dto);
  }

  /**
   * Update the current plan assignment.
   * Use this to customize macro targets or disable rules.
   */
  @Patch('users/plan')
  @ApiOperation({
    summary: 'Customize your active plan',
    description: 'Update your customizations (targets, disabled rules, notes).',
  })
  @ApiResponse({
    status: 200,
    description: 'Assignment updated successfully',
    type: UserPlanAssignmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No active plan to update' })
  async updateAssignment(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateAssignmentDto,
  ): Promise<UserPlanAssignmentResponseDto> {
    return this.plansService.updateAssignment(user.sub, dto);
  }

  /**
   * Stop following the current plan.
   */
  @Delete('users/plan')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Stop following your plan',
    description: 'Deactivate your current plan. The assignment remains in history.',
  })
  @ApiResponse({ status: 204, description: 'Plan deactivated' })
  async deactivatePlan(@CurrentUser() user: JwtPayload): Promise<void> {
    return this.plansService.deactivateCurrentPlan(user.sub);
  }
}
