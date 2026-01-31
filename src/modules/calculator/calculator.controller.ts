import { Controller, Get, NotFoundException } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CalculatorService, CalculationResult } from './calculator.service';
import { PrismaService } from '../../database/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * Calculator controller.
 * Provides endpoints for retrieving calculated health metrics.
 */
@ApiTags('calculator')
@ApiBearerAuth('JWT-auth')
@Controller('calculator')
export class CalculatorController {
  constructor(
    private readonly calculatorService: CalculatorService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get calculated health metrics for the current user.
   * Requires the user to have a complete profile.
   */
  @Get('metrics')
  @ApiOperation({
    summary: 'Get health metrics',
    description:
      'Calculate and return BMR, BMI, TDEE, and diet level based on user profile.',
  })
  @ApiResponse({
    status: 200,
    description: 'Calculated health metrics',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'User profile not found or incomplete',
  })
  async getMetrics(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<CalculationResult> {
    // Get user profile
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId: user.userId },
    });

    if (!profile) {
      throw new NotFoundException(
        'Profile not found. Please complete your profile first.',
      );
    }

    // Check for required fields
    if (
      !profile.heightCm ||
      !profile.weightKg ||
      !profile.age ||
      !profile.sex ||
      !profile.activityLevel ||
      !profile.targetWeightKg
    ) {
      throw new NotFoundException(
        'Profile is incomplete. Please fill in all required health data.',
      );
    }

    // Calculate metrics
    return this.calculatorService.calculate({
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      age: profile.age,
      sex: profile.sex as 'male' | 'female',
      activityLevel: profile.activityLevel,
      targetWeightKg: profile.targetWeightKg,
    });
  }
}
