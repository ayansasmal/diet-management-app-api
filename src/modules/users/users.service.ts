import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CalculatorService,
  CalculationResult,
} from '../calculator/calculator.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';

/**
 * Users service for profile management.
 * Handles profile creation, updates, and retrieval with health calculations.
 */
@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private calculator: CalculatorService,
  ) { }

  /**
   * Create or update user profile with health calculations.
   * Uses upsert to handle both creation and updates.
   *
   * @param userId - User ID from JWT
   * @param createProfileDto - Profile data
   * @returns Profile with calculated metrics
   */
  async createOrUpdateProfile(
    userId: string,
    createProfileDto: CreateProfileDto,
  ): Promise<ProfileResponseDto> {
    // Perform health calculations
    const calculations = this.calculator.calculate({
      heightCm: createProfileDto.heightCm,
      weightKg: createProfileDto.weightKg,
      age: createProfileDto.age,
      sex: createProfileDto.sex,
      activityLevel: createProfileDto.activityLevel,
      targetWeightKg: createProfileDto.targetWeightKg,
    });

    // Upsert profile (create or update)
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...createProfileDto,
        ...this.mapCalculationsToProfile(calculations),
      },
      create: {
        userId,
        ...createProfileDto,
        ...this.mapCalculationsToProfile(calculations),
      },
    });

    return this.mapToResponse(profile, calculations);
  }

  /**
   * Get user profile with calculated metrics.
   *
   * @param userId - User ID from JWT
   * @returns Profile with calculations
   * @throws NotFoundException if profile doesn't exist
   */
  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(
        'Profile not found. Please create a profile first.',
      );
    }

    // Recalculate metrics (in case formulas change)
    const calculations = this.calculator.calculate({
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      age: profile.age,
      sex: profile.sex as 'male' | 'female',
      activityLevel: profile.activityLevel,
      targetWeightKg: profile.targetWeightKg,
    });

    return this.mapToResponse(profile, calculations);
  }

  /**
   * Partially update user profile.
   *
   * @param userId - User ID from JWT
   * @param updateProfileDto - Partial profile data
   * @returns Updated profile with calculations
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    // Get existing profile
    const existingProfile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!existingProfile) {
      throw new NotFoundException(
        'Profile not found. Please create a profile first.',
      );
    }

    // Merge updates with existing data
    const mergedData = {
      heightCm: updateProfileDto.heightCm ?? existingProfile.heightCm,
      weightKg: updateProfileDto.weightKg ?? existingProfile.weightKg,
      age: updateProfileDto.age ?? existingProfile.age,
      sex: (updateProfileDto.sex ?? existingProfile.sex) as 'male' | 'female',
      activityLevel:
        updateProfileDto.activityLevel ?? existingProfile.activityLevel,
      targetWeightKg:
        updateProfileDto.targetWeightKg ?? existingProfile.targetWeightKg,
    };

    // Recalculate health metrics
    const calculations = this.calculator.calculate(mergedData);

    // Update profile
    const profile = await this.prisma.userProfile.update({
      where: { userId },
      data: {
        ...updateProfileDto,
        ...this.mapCalculationsToProfile(calculations),
      },
    });

    return this.mapToResponse(profile, calculations);
  }

  /**
   * Map calculation results to profile database fields.
   */
  private mapCalculationsToProfile(calculations: CalculationResult) {
    return {
      bmi: calculations.bmi,
      bmr: calculations.bmr,
      targetBmi: calculations.targetBmi,
      dietLevel: calculations.dietLevel,
      dailyCalorieTarget: calculations.dailyCalorieTarget,
      estimatedWeeksToTarget: calculations.estimatedWeeksToTarget,
    };
  }

  /**
   * Map profile and calculations to response DTO.
   */
  private mapToResponse(
    profile: {
      userId: string;
      heightCm: number;
      weightKg: number;
      age: number;
      sex: string;
      activityLevel: string;
      targetWeightKg: number;
      dietLevel: number;
      bmr: number;
      bmi: number;
      targetBmi: number;
      dailyCalorieTarget: number;
      estimatedWeeksToTarget: number | null;
      themePreference: string;
      createdAt: Date;
      updatedAt: Date;
    },
    calculations: CalculationResult,
  ): ProfileResponseDto {
    return {
      userId: profile.userId,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      age: profile.age,
      sex: profile.sex,
      activityLevel: profile.activityLevel,
      targetWeightKg: profile.targetWeightKg,
      dietLevel: profile.dietLevel,
      bmr: profile.bmr,
      bmi: profile.bmi,
      bmiCategory: calculations.bmiCategory,
      targetBmi: profile.targetBmi,
      targetBmiCategory: calculations.targetBmiCategory,
      dailyCalorieTarget: profile.dailyCalorieTarget,
      tdee: calculations.tdee,
      weightToLose: calculations.weightToLose,
      estimatedWeeksToTarget: profile.estimatedWeeksToTarget,
      themePreference: profile.themePreference as 'light' | 'dark' | 'system',
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
