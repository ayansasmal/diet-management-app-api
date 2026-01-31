import { Injectable } from '@nestjs/common';

/**
 * Activity level multipliers for TDEE calculation.
 * Based on standard PAL (Physical Activity Level) values.
 */
const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2, // Little or no exercise
  lightly_active: 1.375, // Light exercise 1-3 days/week
  moderately_active: 1.55, // Moderate exercise 3-5 days/week
  very_active: 1.725, // Hard exercise 6-7 days/week
  extremely_active: 1.9, // Very hard exercise, physical job
};

/**
 * CSIRO diet level calorie ranges.
 * Level 1: Lowest calories for faster weight loss
 * Level 2: Moderate calories for steady weight loss
 * Level 3: Higher calories for maintenance or slower loss
 */
const DIET_LEVELS = {
  1: { minCalories: 1200, maxCalories: 1400 },
  2: { minCalories: 1400, maxCalories: 1600 },
  3: { minCalories: 1600, maxCalories: 1800 },
};

/**
 * Input data for health calculations.
 */
export interface CalculationInput {
  heightCm: number;
  weightKg: number;
  age: number;
  sex: 'male' | 'female';
  activityLevel: string;
  targetWeightKg: number;
}

/**
 * Results from health calculations.
 */
export interface CalculationResult {
  bmi: number;
  bmiCategory: string;
  targetBmi: number;
  targetBmiCategory: string;
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  dietLevel: number;
  weightToLose: number;
  estimatedWeeksToTarget: number | null;
}

/**
 * Calculator service for BMR, BMI, and diet level calculations.
 * Implements CSIRO Low-Carb Diet formulas and recommendations.
 */
@Injectable()
export class CalculatorService {
  /**
   * Perform all health calculations for a user profile.
   *
   * @param input - User health metrics
   * @returns Complete calculation results
   */
  calculate(input: CalculationInput): CalculationResult {
    const { heightCm, weightKg, age, sex, activityLevel, targetWeightKg } =
      input;

    // Convert height to meters for BMI
    const heightM = heightCm / 100;

    // Calculate current BMI
    const bmi = this.calculateBMI(weightKg, heightM);
    const bmiCategory = this.getBMICategory(bmi);

    // Calculate target BMI
    const targetBmi = this.calculateBMI(targetWeightKg, heightM);
    const targetBmiCategory = this.getBMICategory(targetBmi);

    // Calculate BMR using Mifflin-St Jeor equation
    const bmr = this.calculateBMR(weightKg, heightCm, age, sex);

    // Calculate TDEE (Total Daily Energy Expenditure)
    const tdee = this.calculateTDEE(bmr, activityLevel);

    // Calculate weight to lose
    const weightToLose = Math.max(0, weightKg - targetWeightKg);

    // Determine calorie deficit and diet level
    const { dailyCalorieTarget, dietLevel } = this.calculateDietLevel(
      tdee,
      weightToLose,
    );

    // Estimate weeks to reach target (assuming 0.5kg/week healthy loss)
    const estimatedWeeksToTarget =
      weightToLose > 0 ? Math.ceil(weightToLose / 0.5) : null;

    return {
      bmi: this.round(bmi, 1),
      bmiCategory,
      targetBmi: this.round(targetBmi, 1),
      targetBmiCategory,
      bmr: this.round(bmr, 0),
      tdee: this.round(tdee, 0),
      dailyCalorieTarget: this.round(dailyCalorieTarget, 0),
      dietLevel,
      weightToLose: this.round(weightToLose, 1),
      estimatedWeeksToTarget,
    };
  }

  /**
   * Calculate Body Mass Index.
   *
   * Formula: weight(kg) / height(m)²
   */
  calculateBMI(weightKg: number, heightM: number): number {
    return weightKg / (heightM * heightM);
  }

  /**
   * Get BMI category based on WHO classifications.
   */
  getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    if (bmi < 35) return 'Obese Class I';
    if (bmi < 40) return 'Obese Class II';
    return 'Obese Class III';
  }

  /**
   * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation.
   *
   * This equation is considered the most accurate for modern populations.
   *
   * Male:   BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) + 5
   * Female: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age) - 161
   */
  calculateBMR(
    weightKg: number,
    heightCm: number,
    age: number,
    sex: 'male' | 'female',
  ): number {
    const baseBMR = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return sex === 'male' ? baseBMR + 5 : baseBMR - 161;
  }

  /**
   * Calculate Total Daily Energy Expenditure.
   *
   * TDEE = BMR × Activity Multiplier
   */
  calculateTDEE(bmr: number, activityLevel: string): number {
    const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
    return bmr * multiplier;
  }

  /**
   * Determine CSIRO diet level and daily calorie target.
   *
   * The diet level is based on calorie deficit needed for healthy weight loss.
   * A deficit of 500 cal/day = ~0.5kg/week loss.
   */
  calculateDietLevel(
    tdee: number,
    weightToLose: number,
  ): { dailyCalorieTarget: number; dietLevel: number } {
    // If no weight to lose, use maintenance level
    if (weightToLose <= 0) {
      return {
        dailyCalorieTarget: tdee,
        dietLevel: 3, // Maintenance level
      };
    }

    // Calculate target calories with 500 cal deficit
    let targetCalories = tdee - 500;

    // Ensure minimum safe calorie intake
    targetCalories = Math.max(1200, targetCalories);

    // Determine diet level based on target calories
    let dietLevel: number;
    if (targetCalories <= DIET_LEVELS[1].maxCalories) {
      dietLevel = 1;
    } else if (targetCalories <= DIET_LEVELS[2].maxCalories) {
      dietLevel = 2;
    } else {
      dietLevel = 3;
    }

    return {
      dailyCalorieTarget: targetCalories,
      dietLevel,
    };
  }

  /**
   * Round number to specified decimal places.
   */
  private round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
}
