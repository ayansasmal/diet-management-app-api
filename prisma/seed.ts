/**
 * Prisma Database Seed Script
 *
 * Seeds the database with initial system nutrition plans.
 * Run with: npx prisma db seed
 *
 * @module prisma/seed
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import 'dotenv/config';

/**
 * Builds SSL config for PostgreSQL connections.
 * In production, DATABASE_SSL_CA must point to a valid CA cert file.
 *
 * @throws Error if DATABASE_SSL_CA is missing or invalid in production
 */
function buildSslConfig():
  | { rejectUnauthorized: boolean; ca: string }
  | undefined {
  if (process.env.NODE_ENV !== 'production') return undefined;
  const caPath = process.env.DATABASE_SSL_CA;
  if (!caPath) {
    throw new Error(
      'DATABASE_SSL_CA env var is required in production. ' +
        'Set it to the path of the RDS CA bundle (e.g., /app/certs/global-bundle.pem).',
    );
  }
  if (!fs.existsSync(caPath)) {
    throw new Error(
      `SSL CA cert not found at ${caPath}. ` +
        'Ensure the RDS global-bundle.pem is mounted into the container.',
    );
  }
  return { rejectUnauthorized: true, ca: fs.readFileSync(caPath, 'utf-8') };
}

/**
 * Creates a PrismaClient for PostgreSQL.
 * Prisma 7 requires adapter-based configuration.
 * SSL is enabled in production for AWS RDS connections.
 */
const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString, ssl: buildSslConfig() });
const prisma = new PrismaClient({ adapter });

/**
 * Admin and user emails for dietician plan assignment.
 */
const DIETICIAN_EMAIL = 'ayan.m.sasmal@gmail.com';
const CLIENT_EMAIL = 'ayandelhi@gmail.com';

/**
 * System nutrition plans - these are pre-configured plans available to all users.
 * Plans are stored with JSON configuration for flexibility.
 */
const systemPlans = [
  {
    id: 'low_carb_standard',
    name: 'Low Carb',
    shortDescription:
      'A science-backed low-carb approach for blood sugar management and weight loss',
    longDescription: `This low-carb plan is based on evidence-based research on low-carbohydrate diets for diabetes management and weight loss. It emphasizes protein at every meal, limits carbohydrates, and focuses on whole foods.

Key principles:
• 80g or less of carbohydrates per day (net carbs)
• High protein intake (120g+) distributed across meals
• Moderate healthy fats
• Focus on vegetables, lean proteins, and healthy fats
• Minimize processed foods and added sugars`,
    visibility: 'system',
    difficulty: 'intermediate',
    tags: JSON.stringify([
      'low-carb',
      'diabetes-friendly',
      'weight-loss',
      'high-protein',
    ]),
    sourceAttribution: 'Based on evidence-based low-carbohydrate diet research',
    version: '1.0.0',
    isPremium: false,
    icon: '🥗',
    accentColor: '#10B981',
    dailyTargets: JSON.stringify({
      calories: { target: 1800, min: 1600, max: 2000 },
      protein: { min: 120 },
      carbs: { max: 80 },
      fat: { min: 60, max: 90 },
      fiber: { min: 25 },
    }),
    mealFlow: JSON.stringify({
      slots: [
        {
          id: 'breakfast',
          type: 'breakfast',
          name: 'Breakfast',
          order: 1,
          required: true,
          targetMacros: {
            protein: { min: 30 },
            carbs: { max: 20 },
          },
        },
        {
          id: 'lunch',
          type: 'lunch',
          name: 'Lunch',
          order: 2,
          required: true,
          targetMacros: {
            protein: { min: 35 },
            carbs: { max: 25 },
          },
        },
        {
          id: 'dinner',
          type: 'dinner',
          name: 'Dinner',
          order: 3,
          required: true,
          targetMacros: {
            protein: { min: 35 },
            carbs: { max: 25 },
          },
        },
        {
          id: 'snack',
          type: 'snack',
          name: 'Snack',
          order: 4,
          required: false,
          targetMacros: {
            protein: { min: 10 },
            carbs: { max: 10 },
          },
        },
      ],
      allowSkipping: false,
      allowReordering: false,
      minTimeBetweenMeals: 180,
    }),
    rules: JSON.stringify([
      {
        id: 'net_carbs',
        type: 'preferNetCarbs',
        name: 'Use Net Carbs',
        description: 'Fiber is subtracted from total carbs for daily tracking',
        severity: 'info',
        enabled: true,
      },
      {
        id: 'protein_per_meal',
        type: 'proteinPerMealMinimum',
        name: 'Protein Distribution',
        description:
          'Minimum 30g protein per main meal for optimal muscle synthesis',
        severity: 'warning',
        enabled: true,
        minGrams: 30,
      },
      {
        id: 'limit_processed',
        type: 'limitUltraProcessed',
        name: 'Limit Processed Foods',
        description: 'Ultra-processed foods should be less than 20% of calories',
        severity: 'warning',
        enabled: true,
        maxPercentage: 20,
      },
    ]),
    useNetCarbs: true,
    defaultServingMultiplier: 1,
    tips: JSON.stringify([
      'Focus on whole foods: vegetables, lean proteins, healthy fats',
      'Limit processed foods and added sugars',
      'Stay hydrated - aim for 2L water daily',
      'Include protein at every meal to maintain muscle mass',
      'Choose low-GI vegetables like leafy greens, broccoli, and cauliflower',
    ]),
  },
  {
    id: 'high_protein',
    name: 'High Protein',
    shortDescription:
      'Maximize protein intake for muscle building, recovery, and satiety',
    longDescription: `This high-protein plan is designed for those looking to build or maintain muscle mass, support workout recovery, or simply feel more satisfied throughout the day.

Key principles:
• 180g+ protein per day (approximately 1.6-2.2g per kg body weight)
• Protein at 35%+ of total calories
• Moderate carbohydrates for energy
• Strategic meal timing around workouts`,
    visibility: 'system',
    difficulty: 'intermediate',
    tags: JSON.stringify([
      'high-protein',
      'muscle-building',
      'fitness',
      'weight-training',
    ]),
    sourceAttribution: null,
    version: '1.0.0',
    isPremium: false,
    icon: '💪',
    accentColor: '#EF4444',
    dailyTargets: JSON.stringify({
      calories: { target: 2200, min: 2000, max: 2500 },
      protein: { min: 180 },
      carbs: { min: 150, max: 250 },
      fat: { min: 50, max: 80 },
    }),
    mealFlow: JSON.stringify({
      slots: [
        {
          id: 'breakfast',
          type: 'breakfast',
          name: 'Breakfast',
          order: 1,
          required: true,
          targetMacros: {
            protein: { min: 40 },
          },
        },
        {
          id: 'lunch',
          type: 'lunch',
          name: 'Lunch',
          order: 2,
          required: true,
          targetMacros: {
            protein: { min: 45 },
          },
        },
        {
          id: 'pre-workout',
          type: 'snack',
          name: 'Pre-Workout',
          order: 3,
          required: false,
          targetMacros: {
            protein: { min: 20 },
            carbs: { min: 30 },
          },
        },
        {
          id: 'dinner',
          type: 'dinner',
          name: 'Dinner',
          order: 4,
          required: true,
          targetMacros: {
            protein: { min: 45 },
          },
        },
        {
          id: 'post-workout',
          type: 'snack',
          name: 'Post-Workout / Evening Snack',
          order: 5,
          required: false,
          targetMacros: {
            protein: { min: 30 },
          },
        },
      ],
      allowSkipping: true,
      allowReordering: true,
      minTimeBetweenMeals: 120,
    }),
    rules: JSON.stringify([
      {
        id: 'protein_ratio',
        type: 'macroRatio',
        name: 'Protein Target',
        description: 'Protein should be at least 35% of total calories',
        severity: 'warning',
        enabled: true,
        macro: 'protein',
        percentage: { min: 35 },
      },
      {
        id: 'protein_per_meal',
        type: 'proteinPerMealMinimum',
        name: 'Protein Per Meal',
        description: 'Each main meal should have at least 40g protein',
        severity: 'warning',
        enabled: true,
        minGrams: 40,
      },
    ]),
    useNetCarbs: false,
    defaultServingMultiplier: 1,
    tips: JSON.stringify([
      'Aim for 1.6-2.2g protein per kg of body weight',
      'Spread protein intake evenly across meals for optimal absorption',
      'Include protein within 2 hours post-workout',
      'Choose lean protein sources: chicken, fish, eggs, Greek yogurt',
      'Consider a protein supplement if struggling to meet targets through food',
    ]),
  },
  {
    id: 'balanced_mediterranean',
    name: 'Balanced (Mediterranean)',
    shortDescription:
      'A flexible, sustainable approach based on Mediterranean diet principles',
    longDescription: `The Balanced plan follows Mediterranean diet principles, emphasizing whole foods, healthy fats, and moderate portions. It's designed for long-term sustainability rather than rapid weight loss.

Key principles:
• Balanced macronutrient distribution
• Emphasis on olive oil, fish, and vegetables
• Whole grains in moderation
• Limited red meat and processed foods
• Enjoyment of food as part of a healthy lifestyle`,
    visibility: 'system',
    difficulty: 'beginner',
    tags: JSON.stringify([
      'balanced',
      'mediterranean',
      'sustainable',
      'heart-healthy',
      'beginner-friendly',
    ]),
    sourceAttribution: 'Based on Mediterranean diet research',
    version: '1.0.0',
    isPremium: false,
    icon: '🫒',
    accentColor: '#F59E0B',
    dailyTargets: JSON.stringify({
      calories: { target: 2000, min: 1800, max: 2200 },
      protein: { min: 75, max: 120 },
      carbs: { min: 200, max: 275 },
      fat: { min: 65, max: 90 },
      fiber: { min: 30 },
    }),
    mealFlow: JSON.stringify({
      slots: [
        {
          id: 'breakfast',
          type: 'breakfast',
          name: 'Breakfast',
          order: 1,
          required: true,
        },
        {
          id: 'lunch',
          type: 'lunch',
          name: 'Lunch',
          order: 2,
          required: true,
        },
        {
          id: 'dinner',
          type: 'dinner',
          name: 'Dinner',
          order: 3,
          required: true,
        },
        {
          id: 'snack-1',
          type: 'snack',
          name: 'Morning Snack',
          order: 4,
          required: false,
        },
        {
          id: 'snack-2',
          type: 'snack',
          name: 'Afternoon Snack',
          order: 5,
          required: false,
        },
      ],
      allowSkipping: true,
      allowReordering: true,
      minTimeBetweenMeals: 120,
    }),
    rules: JSON.stringify([
      {
        id: 'healthy_fats',
        type: 'macroRatio',
        name: 'Healthy Fat Balance',
        description:
          'Fats should be 30-35% of calories, primarily from olive oil and fish',
        severity: 'info',
        enabled: true,
        macro: 'fat',
        percentage: { min: 30, max: 35 },
      },
      {
        id: 'fiber_focus',
        type: 'proteinPerMealMinimum', // Re-purposing as a general minimum check
        name: 'Fiber Intake',
        description: 'Aim for high-fiber meals with vegetables and whole grains',
        severity: 'info',
        enabled: true,
        minGrams: 8, // Per meal fiber target
      },
    ]),
    useNetCarbs: false,
    defaultServingMultiplier: 1,
    tips: JSON.stringify([
      'Make olive oil your primary cooking fat',
      'Eat fish at least twice per week',
      'Fill half your plate with vegetables at each meal',
      'Choose whole grains over refined grains',
      'Enjoy meals mindfully - Mediterranean eating is about the experience',
      'Red wine in moderation is optional but traditional',
    ]),
  },
];

/**
 * Dietician-created plan for Ayan.
 * This is a private plan assigned by a dietician to a specific client.
 * Created by: ayan.m.sasmal@gmail.com (admin/dietician)
 * Assigned to: ayandelhi@gmail.com (client)
 */
const dieticianPlanForAyan = {
  id: 'dietician_ayan_weight_loss_2026',
  name: 'Weight Loss Plan for Ayan',
  shortDescription:
    'Personalized high-protein, calorie-deficit plan for sustainable weight loss',
  longDescription: `A customized nutrition plan designed for Ayan by a registered dietician.

**Client Profile:**
- Current Weight: 113 kg
- Height: 165 cm
- Waist: 112 cm
- Age: 38 years
- TDEE: ~2570 kcal/day

**Plan Goals:**
- Target Calories: 1800 kcal/day (770 kcal deficit)
- Target Protein: 130g/day (1.15g/kg body weight)
- Focus on lean protein sources (80%+ from lean sources)

**Key Principles:**
1. High protein to preserve muscle during weight loss
2. Per-meal protein distribution for optimal absorption
3. Light dinner to improve sleep and digestion
4. Quality fats only (ghee, coconut oil, olive oil - no refined oils)
5. Flexible meal timing - rearrange as needed

**Protein Sources Guide (per 100g):**
- Lean: Chicken breast (31g), Low-fat paneer (25g), Greek yogurt (10g), Egg whites (3.5g/egg)
- Moderate: Chicken with bone (18g), Tofu (10g), Fish (varies)
- Calorie-dense (limit): Mutton (25g), Cheese, Peanuts (25g)`,
  visibility: 'private',
  difficulty: 'intermediate',
  tags: JSON.stringify([
    'weight-loss',
    'high-protein',
    'calorie-deficit',
    'dietician-prescribed',
    'personalized',
  ]),
  sourceAttribution: 'Prescribed by registered dietician',
  version: '1.0.0',
  isPremium: false,
  icon: '🎯',
  accentColor: '#8B5CF6',
  dailyTargets: JSON.stringify({
    calories: { target: 1800, min: 1700, max: 1900 },
    protein: { min: 130 },
    carbs: { max: 150 }, // Estimated based on remaining calories
    fat: { min: 50, max: 70 },
    fiber: { min: 25 },
  }),
  mealFlow: JSON.stringify({
    slots: [
      {
        id: 'meal-1-breakfast',
        type: 'breakfast',
        name: 'Meal 1 (Breakfast)',
        order: 1,
        required: true,
        targetMacros: {
          protein: { min: 55, target: 58 },
        },
        notes:
          'Eggs (2 whole + 4 whites) + Whey protein + Low-fat milk. Add veggies. Use 1 tsp oil/ghee.',
        suggestedFoods: [
          '2 whole eggs (12g protein)',
          '4 egg whites (14g protein)',
          '1 scoop whey (25g protein)',
          '200ml low-fat milk (7g protein)',
          'Veggies: carrot, capsicum',
        ],
      },
      {
        id: 'meal-2-lunch',
        type: 'lunch',
        name: 'Meal 2 (Lunch)',
        order: 2,
        required: true,
        targetMacros: {
          protein: { min: 45, target: 50 },
          carbs: { max: 60 },
        },
        notes:
          'Main protein + small carbs (200g rice OR 2 roti). Vegetable stir-fry/sabzi. Use 2 tbsp oil/ghee. ACV before meal.',
        suggestedFoods: [
          '160g chicken breast OR',
          '265g chicken with bone OR',
          '250g fish OR',
          '200g mutton (max 2x/week) OR',
          '190g low-fat paneer OR',
          '90g soy chunks',
          'Plus: 200g rice OR 2 roti',
          'Plus: Vegetable stir-fry or salad',
        ],
      },
      {
        id: 'meal-3-dinner',
        type: 'dinner',
        name: 'Meal 3 (Light Dinner)',
        order: 3,
        required: true,
        targetMacros: {
          protein: { min: 20, target: 24 },
          carbs: { max: 30 },
        },
        notes:
          'Keep dinner light. Greek yogurt/Skyr with fruit. Add psyllium husk for fiber.',
        suggestedFoods: [
          '150g low-fat Greek yogurt/Skyr (12g protein)',
          '1/2 scoop whey (12g protein)',
          'Fruit: 1 kiwi OR 1 apple OR 1 guava OR 200g papaya OR 1/2 pomegranate',
          'Add: berries, chia seeds, 1 tsp psyllium husk',
        ],
      },
    ],
    allowSkipping: false,
    allowReordering: true, // "Feel free to rearrange the meal structure"
    minTimeBetweenMeals: 240, // 4 hours suggested
  }),
  rules: JSON.stringify([
    {
      id: 'lean_protein_priority',
      type: 'foodCategoryRestriction',
      name: 'Prioritize Lean Proteins',
      description:
        '80%+ of protein should come from lean sources (chicken breast, fish, egg whites, low-fat paneer)',
      severity: 'warning',
      enabled: true,
      categories: ['calorie-dense-protein'],
      action: 'warn',
    },
    {
      id: 'mutton_limit',
      type: 'foodCategoryRestriction',
      name: 'Limit Red Meat',
      description: 'Mutton/red meat maximum twice per week',
      severity: 'warning',
      enabled: true,
      categories: ['red-meat'],
      action: 'limit',
      maxPerWeek: 2,
    },
    {
      id: 'protein_per_meal',
      type: 'proteinPerMealMinimum',
      name: 'Protein Per Meal',
      description: 'Each meal has specific protein targets for optimal distribution',
      severity: 'warning',
      enabled: true,
      minGrams: 20, // Minimum for any meal (dinner)
    },
    {
      id: 'quality_fats_only',
      type: 'foodCategoryRestriction',
      name: 'Quality Fats Only',
      description:
        'Use only ghee, coconut oil, cold-pressed oils, EVOO, butter. Avoid refined oils.',
      severity: 'error',
      enabled: true,
      categories: ['refined-oil'],
      action: 'block',
    },
    {
      id: 'light_dinner',
      type: 'mealTiming',
      name: 'Light Dinner',
      description: 'Keep dinner light - yogurt and fruit based',
      severity: 'info',
      enabled: true,
      mealType: 'dinner',
      constraint: 'light',
    },
  ]),
  useNetCarbs: false,
  defaultServingMultiplier: 1,
  tips: JSON.stringify([
    'Have Apple Cider Vinegar diluted in water before Meal 2 (lunch)',
    'Get 80%+ of protein from lean sources (chicken breast, fish, egg whites)',
    'Mutton is allowed but limit to twice per week maximum',
    'Use quality fats only: ghee, coconut oil, olive oil, butter - NO refined oils',
    'Add psyllium husk to dinner yogurt for fiber',
    'Feel free to swap meal timings (e.g., Meal 2 for dinner, Meal 3 for breakfast)',
    'Make sure to have a good amount of veggies at lunch',
  ]),
  // EXTENSIONS - Dietician-specific custom fields (completely optional)
  extensions: JSON.stringify({
    // Client context - who this plan was designed for
    clientContext: {
      weight: 113,
      height: 165,
      waist: 112,
      age: 38,
      tdee: 2570,
      targetCalorieDeficit: 770,
    },
    // Cooking fat budget per meal
    cookingFatBudget: {
      breakfast: { amount: '1 tsp', allowed: ['ghee', 'coconut oil'] },
      lunch: { amount: '2 tbsp', allowed: ['ghee', 'coconut oil', 'olive oil', 'butter'] },
      dinner: { amount: 'none', note: 'Light meal, no cooking required' },
    },
    // Pre-meal protocols
    preMealProtocols: {
      lunch: 'Apple cider vinegar diluted in water',
    },
    // Supplement schedule
    supplements: [
      { name: 'Whey Protein', timing: 'breakfast', amount: '1 scoop (25g protein)' },
      { name: 'Whey Protein', timing: 'dinner', amount: '0.5 scoop (12g protein)', optional: true },
      { name: 'Psyllium Husk', timing: 'dinner', amount: '1 tsp', note: 'Add to yogurt' },
    ],
    // Weekly limits
    weeklyLimits: {
      redMeat: { max: 2, unit: 'servings', note: 'Mutton max twice per week' },
    },
    // Protein source guide (informational)
    proteinSourceGuide: {
      lean: [
        { name: 'Chicken Breast', proteinPer100g: 31 },
        { name: 'Low Fat Paneer', proteinPer100g: 25 },
        { name: 'Fish (average)', proteinPer100g: 20 },
        { name: 'Egg White', proteinPerUnit: 3.5 },
        { name: 'Greek Yogurt', proteinPer100g: 10 },
        { name: 'Tofu (firm)', proteinPer100g: 10 },
      ],
      calorieDense: [
        { name: 'Mutton', proteinPer100g: 25, note: 'Limit to 2x/week' },
        { name: 'Whole Egg', proteinPerUnit: 6 },
        { name: 'Peanuts', proteinPer100g: 25, note: 'High calorie' },
        { name: 'Cheese', proteinPer100g: 18, note: 'High calorie' },
      ],
    },
    // Recommended servings for target protein
    proteinServingSuggestions: {
      'Chicken Breast': '160g raw',
      'Chicken with Bone': '265g raw',
      'Fish': '250g raw',
      'Mutton': '200g raw',
      'Low Fat Paneer': '190g',
      'Soy Chunks': '90g dry',
      'Tempeh': '260g',
    },
  }),
};

/**
 * Plan data type for seed operations.
 */
interface SeedPlanData {
  id: string;
  name: string;
  shortDescription: string;
  longDescription?: string | null;
  visibility: string;
  difficulty: string;
  tags: string;
  sourceAttribution?: string | null;
  version: string;
  isPremium: boolean;
  icon?: string | null;
  accentColor?: string | null;
  dailyTargets: string;
  mealFlow: string;
  rules: string;
  useNetCarbs: boolean;
  defaultServingMultiplier: number;
  tips?: string | null;
  extensions?: string | null;
}

/**
 * Upsert a nutrition plan with all fields.
 */
async function upsertPlan(plan: SeedPlanData, createdById?: string) {
  return prisma.nutritionPlan.upsert({
    where: { id: plan.id },
    update: {
      name: plan.name,
      shortDescription: plan.shortDescription,
      longDescription: plan.longDescription,
      visibility: plan.visibility,
      difficulty: plan.difficulty,
      tags: plan.tags,
      sourceAttribution: plan.sourceAttribution,
      version: plan.version,
      isPremium: plan.isPremium,
      icon: plan.icon,
      accentColor: plan.accentColor,
      dailyTargets: plan.dailyTargets,
      mealFlow: plan.mealFlow,
      rules: plan.rules,
      useNetCarbs: plan.useNetCarbs,
      defaultServingMultiplier: plan.defaultServingMultiplier,
      tips: plan.tips,
      extensions: plan.extensions || null,
      createdById: createdById || null,
    },
    create: {
      ...plan,
      extensions: plan.extensions || null,
      createdById: createdById || null,
    },
  });
}

/**
 * Serving data type for seed operations.
 */
interface SeedServingData {
  servingName: string;
  servingSize: number;
  servingUnit: string;
  isDefault: boolean;
  isUnitServing: boolean;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  saturatedFat?: number;
  sodium?: number;
  cholesterol?: number;
  potassium?: number;
  glycemicIndex?: number;
  glycemicLoad?: number;
}

/**
 * Food data type for seed operations.
 */
interface SeedFoodData {
  id: string;
  name: string;
  categoryId: string;
  isVerified: boolean;
  isPublic: boolean;
  tags: string[];
  servings: SeedServingData[];
}

/**
 * Food categories for the food database.
 * Based on standard nutrition categories and unit system.
 */
const foodCategories = [
  {
    id: 'cat_protein',
    name: 'Protein',
    slug: 'protein',
    description: 'Meat, fish, eggs, dairy, legumes, and plant proteins',
    icon: '🥩',
    color: '#EF4444',
    sortOrder: 1,
    unitName: 'protein unit',
    unitDescription: 'Approximately 7g of protein',
  },
  {
    id: 'cat_carbs',
    name: 'Carbohydrates',
    slug: 'carbs',
    description: 'Grains, bread, rice, pasta, and starchy foods',
    icon: '🍞',
    color: '#F59E0B',
    sortOrder: 2,
    unitName: 'carb serve',
    unitDescription: 'Approximately 15g of carbohydrates',
  },
  {
    id: 'cat_vegetables',
    name: 'Vegetables',
    slug: 'vegetables',
    description: 'Non-starchy vegetables and salads',
    icon: '🥦',
    color: '#10B981',
    sortOrder: 3,
    unitName: 'vegetable serve',
    unitDescription: 'Approximately 1 cup raw or 1/2 cup cooked',
  },
  {
    id: 'cat_fats',
    name: 'Fats & Oils',
    slug: 'fats',
    description: 'Cooking oils, butter, nuts, and seeds',
    icon: '🥑',
    color: '#84CC16',
    sortOrder: 4,
    unitName: 'fat unit',
    unitDescription: 'Approximately 5g of fat',
  },
  {
    id: 'cat_dairy',
    name: 'Dairy',
    slug: 'dairy',
    description: 'Milk, yogurt, cheese, and dairy alternatives',
    icon: '🥛',
    color: '#06B6D4',
    sortOrder: 5,
    unitName: 'dairy serve',
    unitDescription: 'Approximately 250ml milk or equivalent',
  },
  {
    id: 'cat_fruit',
    name: 'Fruit',
    slug: 'fruit',
    description: 'Fresh, frozen, and dried fruits',
    icon: '🍎',
    color: '#EC4899',
    sortOrder: 6,
    unitName: 'fruit serve',
    unitDescription: 'Approximately 1 medium piece or 1/2 cup',
  },
  {
    id: 'cat_condiments',
    name: 'Condiments & Sauces',
    slug: 'condiments',
    description: 'Sauces, dressings, and flavor enhancers',
    icon: '🧂',
    color: '#8B5CF6',
    sortOrder: 7,
  },
  {
    id: 'cat_beverages',
    name: 'Beverages',
    slug: 'beverages',
    description: 'Drinks including water, tea, coffee, and juices',
    icon: '☕',
    color: '#6366F1',
    sortOrder: 8,
  },
];

/**
 * Sample foods with nutrition data.
 * These are verified system foods available to all users.
 */
const sampleFoods: SeedFoodData[] = [
  // PROTEIN
  {
    id: 'food_chicken_breast',
    name: 'Chicken Breast (Skinless)',
    categoryId: 'cat_protein',
    isVerified: true,
    isPublic: true,
    tags: ['high-protein', 'low-carb', 'lean', 'whole-food'],
    servings: [
      {
        servingName: '100g',
        servingSize: 100,
        servingUnit: 'g',
        isDefault: true,
        isUnitServing: false,
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
        sodium: 74,
        cholesterol: 85,
      },
      {
        servingName: '1 breast (150g)',
        servingSize: 150,
        servingUnit: 'g',
        isDefault: false,
        isUnitServing: false,
        calories: 248,
        protein: 46.5,
        carbs: 0,
        fat: 5.4,
        fiber: 0,
        sodium: 111,
        cholesterol: 128,
      },
    ],
  },
  {
    id: 'food_egg_whole',
    name: 'Egg (Whole, Large)',
    categoryId: 'cat_protein',
    isVerified: true,
    isPublic: true,
    tags: ['high-protein', 'low-carb', 'whole-food', 'breakfast'],
    servings: [
      {
        servingName: '1 large egg (50g)',
        servingSize: 50,
        servingUnit: 'g',
        isDefault: true,
        isUnitServing: true,
        calories: 72,
        protein: 6,
        carbs: 0.4,
        fat: 5,
        fiber: 0,
        saturatedFat: 1.6,
        sodium: 71,
        cholesterol: 186,
      },
      {
        servingName: '100g',
        servingSize: 100,
        servingUnit: 'g',
        isDefault: false,
        isUnitServing: false,
        calories: 144,
        protein: 12,
        carbs: 0.8,
        fat: 10,
        fiber: 0,
        saturatedFat: 3.2,
        sodium: 142,
        cholesterol: 372,
      },
    ],
  },
  {
    id: 'food_paneer_lowfat',
    name: 'Paneer (Low Fat)',
    categoryId: 'cat_protein',
    isVerified: true,
    isPublic: true,
    tags: ['high-protein', 'vegetarian', 'indian'],
    servings: [
      {
        servingName: '100g',
        servingSize: 100,
        servingUnit: 'g',
        isDefault: true,
        isUnitServing: false,
        calories: 180,
        protein: 25,
        carbs: 3,
        fat: 8,
        fiber: 0,
        saturatedFat: 5,
        sodium: 20,
        cholesterol: 30,
      },
    ],
  },
  {
    id: 'food_greek_yogurt',
    name: 'Greek Yogurt (Low Fat)',
    categoryId: 'cat_dairy',
    isVerified: true,
    isPublic: true,
    tags: ['high-protein', 'low-carb', 'probiotic', 'breakfast'],
    servings: [
      {
        servingName: '150g (1 cup)',
        servingSize: 150,
        servingUnit: 'g',
        isDefault: true,
        isUnitServing: true,
        calories: 100,
        protein: 17,
        carbs: 6,
        fat: 0.7,
        fiber: 0,
        sugar: 4,
        sodium: 65,
        cholesterol: 10,
      },
      {
        servingName: '100g',
        servingSize: 100,
        servingUnit: 'g',
        isDefault: false,
        isUnitServing: false,
        calories: 67,
        protein: 11.3,
        carbs: 4,
        fat: 0.5,
        fiber: 0,
        sugar: 2.7,
        sodium: 43,
        cholesterol: 7,
      },
    ],
  },
  // CARBS
  {
    id: 'food_brown_rice',
    name: 'Brown Rice (Cooked)',
    categoryId: 'cat_carbs',
    isVerified: true,
    isPublic: true,
    tags: ['whole-grain', 'fiber', 'gluten-free'],
    servings: [
      {
        servingName: '1 cup cooked (195g)',
        servingSize: 195,
        servingUnit: 'g',
        isDefault: true,
        isUnitServing: true,
        calories: 216,
        protein: 5,
        carbs: 45,
        fat: 1.8,
        fiber: 3.5,
        sodium: 10,
        glycemicIndex: 50,
      },
      {
        servingName: '100g',
        servingSize: 100,
        servingUnit: 'g',
        isDefault: false,
        isUnitServing: false,
        calories: 111,
        protein: 2.6,
        carbs: 23,
        fat: 0.9,
        fiber: 1.8,
        sodium: 5,
        glycemicIndex: 50,
      },
    ],
  },
  {
    id: 'food_whole_wheat_roti',
    name: 'Whole Wheat Roti/Chapati',
    categoryId: 'cat_carbs',
    isVerified: true,
    isPublic: true,
    tags: ['whole-grain', 'fiber', 'indian'],
    servings: [
      {
        servingName: '1 roti (35g)',
        servingSize: 35,
        servingUnit: 'g',
        isDefault: true,
        isUnitServing: true,
        calories: 104,
        protein: 3,
        carbs: 20,
        fat: 2,
        fiber: 3,
        sodium: 120,
        glycemicIndex: 62,
      },
    ],
  },
  // VEGETABLES
  {
    id: 'food_broccoli',
    name: 'Broccoli',
    categoryId: 'cat_vegetables',
    isVerified: true,
    isPublic: true,
    tags: ['low-carb', 'fiber', 'cruciferous', 'keto-friendly'],
    servings: [
      {
        servingName: '1 cup chopped (91g)',
        servingSize: 91,
        servingUnit: 'g',
        isDefault: true,
        isUnitServing: true,
        calories: 31,
        protein: 2.5,
        carbs: 6,
        fat: 0.3,
        fiber: 2.4,
        sugar: 1.5,
        sodium: 30,
        potassium: 288,
        glycemicIndex: 10,
      },
      {
        servingName: '100g',
        servingSize: 100,
        servingUnit: 'g',
        isDefault: false,
        isUnitServing: false,
        calories: 34,
        protein: 2.8,
        carbs: 6.6,
        fat: 0.4,
        fiber: 2.6,
        sugar: 1.7,
        sodium: 33,
        potassium: 316,
        glycemicIndex: 10,
      },
    ],
  },
  {
    id: 'food_spinach',
    name: 'Spinach (Raw)',
    categoryId: 'cat_vegetables',
    isVerified: true,
    isPublic: true,
    tags: ['low-carb', 'leafy-green', 'iron', 'keto-friendly'],
    servings: [
      {
        servingName: '1 cup (30g)',
        servingSize: 30,
        servingUnit: 'g',
        isDefault: true,
        isUnitServing: true,
        calories: 7,
        protein: 0.9,
        carbs: 1.1,
        fat: 0.1,
        fiber: 0.7,
        sugar: 0.1,
        sodium: 24,
        potassium: 167,
        glycemicIndex: 15,
      },
      {
        servingName: '100g',
        servingSize: 100,
        servingUnit: 'g',
        isDefault: false,
        isUnitServing: false,
        calories: 23,
        protein: 2.9,
        carbs: 3.6,
        fat: 0.4,
        fiber: 2.2,
        sugar: 0.4,
        sodium: 79,
        potassium: 558,
        glycemicIndex: 15,
      },
    ],
  },
  // FATS
  {
    id: 'food_olive_oil',
    name: 'Olive Oil (Extra Virgin)',
    categoryId: 'cat_fats',
    isVerified: true,
    isPublic: true,
    tags: ['healthy-fat', 'mediterranean', 'keto-friendly', 'whole30'],
    servings: [
      {
        servingName: '1 tbsp (14g)',
        servingSize: 14,
        servingUnit: 'g',
        isDefault: true,
        isUnitServing: true,
        calories: 119,
        protein: 0,
        carbs: 0,
        fat: 13.5,
        fiber: 0,
        saturatedFat: 1.9,
        sodium: 0,
      },
      {
        servingName: '1 tsp (5g)',
        servingSize: 5,
        servingUnit: 'g',
        isDefault: false,
        isUnitServing: false,
        calories: 43,
        protein: 0,
        carbs: 0,
        fat: 4.8,
        fiber: 0,
        saturatedFat: 0.7,
        sodium: 0,
      },
    ],
  },
  {
    id: 'food_ghee',
    name: 'Ghee (Clarified Butter)',
    categoryId: 'cat_fats',
    isVerified: true,
    isPublic: true,
    tags: ['healthy-fat', 'indian', 'keto-friendly', 'whole30'],
    servings: [
      {
        servingName: '1 tsp (5g)',
        servingSize: 5,
        servingUnit: 'g',
        isDefault: true,
        isUnitServing: true,
        calories: 45,
        protein: 0,
        carbs: 0,
        fat: 5,
        fiber: 0,
        saturatedFat: 3.1,
        sodium: 0,
        cholesterol: 15,
      },
      {
        servingName: '1 tbsp (14g)',
        servingSize: 14,
        servingUnit: 'g',
        isDefault: false,
        isUnitServing: false,
        calories: 126,
        protein: 0,
        carbs: 0,
        fat: 14,
        fiber: 0,
        saturatedFat: 8.7,
        sodium: 0,
        cholesterol: 42,
      },
    ],
  },
  // FRUIT
  {
    id: 'food_apple',
    name: 'Apple (Medium)',
    categoryId: 'cat_fruit',
    isVerified: true,
    isPublic: true,
    tags: ['fiber', 'low-calorie', 'snack'],
    servings: [
      {
        servingName: '1 medium (182g)',
        servingSize: 182,
        servingUnit: 'g',
        isDefault: true,
        isUnitServing: true,
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        fiber: 4.4,
        sugar: 19,
        sodium: 2,
        potassium: 195,
        glycemicIndex: 36,
      },
      {
        servingName: '100g',
        servingSize: 100,
        servingUnit: 'g',
        isDefault: false,
        isUnitServing: false,
        calories: 52,
        protein: 0.3,
        carbs: 14,
        fat: 0.2,
        fiber: 2.4,
        sugar: 10,
        sodium: 1,
        potassium: 107,
        glycemicIndex: 36,
      },
    ],
  },
  {
    id: 'food_blueberries',
    name: 'Blueberries',
    categoryId: 'cat_fruit',
    isVerified: true,
    isPublic: true,
    tags: ['antioxidant', 'low-calorie', 'fiber'],
    servings: [
      {
        servingName: '1 cup (148g)',
        servingSize: 148,
        servingUnit: 'g',
        isDefault: true,
        isUnitServing: true,
        calories: 84,
        protein: 1.1,
        carbs: 21,
        fat: 0.5,
        fiber: 3.6,
        sugar: 15,
        sodium: 1,
        potassium: 114,
        glycemicIndex: 53,
      },
      {
        servingName: '100g',
        servingSize: 100,
        servingUnit: 'g',
        isDefault: false,
        isUnitServing: false,
        calories: 57,
        protein: 0.7,
        carbs: 14,
        fat: 0.3,
        fiber: 2.4,
        sugar: 10,
        sodium: 1,
        potassium: 77,
        glycemicIndex: 53,
      },
    ],
  },
];

/**
 * Seed food categories and sample foods.
 */
async function seedFoods() {
  console.log('\n🍽️  Seeding food database...');

  // Seed categories
  console.log('   📁 Seeding food categories...');
  for (const category of foodCategories) {
    await prisma.foodCategory.upsert({
      where: { id: category.id },
      update: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        color: category.color,
        sortOrder: category.sortOrder,
        unitName: category.unitName,
        unitDescription: category.unitDescription,
      },
      create: category,
    });
    console.log(`      ✅ ${category.name} (${category.slug})`);
  }

  // Seed foods with servings
  console.log('   🥗 Seeding sample foods...');
  for (const food of sampleFoods) {
    // First, upsert the food (without servings)
    await prisma.foodItem.upsert({
      where: { id: food.id },
      update: {
        name: food.name,
        categoryId: food.categoryId,
        isVerified: food.isVerified,
        isPublic: food.isPublic,
        tags: JSON.stringify(food.tags),
        searchTerms: [food.name, ...food.tags].join(',').toLowerCase(),
      },
      create: {
        id: food.id,
        name: food.name,
        categoryId: food.categoryId,
        isVerified: food.isVerified,
        isPublic: food.isPublic,
        tags: JSON.stringify(food.tags),
        searchTerms: [food.name, ...food.tags].join(',').toLowerCase(),
      },
    });

    // Then, upsert servings
    for (const serving of food.servings) {
      // Create a deterministic ID based on food and serving name
      const servingId = `${food.id}_${serving.servingName.replace(/[^a-zA-Z0-9]/g, '_')}`;

      await prisma.foodServing.upsert({
        where: { id: servingId },
        update: {
          foodId: food.id,
          servingName: serving.servingName,
          servingSize: serving.servingSize,
          servingUnit: serving.servingUnit,
          isDefault: serving.isDefault,
          isUnitServing: serving.isUnitServing,
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
        },
        create: {
          id: servingId,
          foodId: food.id,
          servingName: serving.servingName,
          servingSize: serving.servingSize,
          servingUnit: serving.servingUnit,
          isDefault: serving.isDefault,
          isUnitServing: serving.isUnitServing,
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
        },
      });
    }
    console.log(`      ✅ ${food.name} (${food.servings.length} servings)`);
  }

  console.log(`   📊 Food database: ${foodCategories.length} categories, ${sampleFoods.length} foods`);
}

/**
 * Main seed function - upserts all system nutrition plans and dietician plans.
 * Uses upsert to allow re-running without duplicates.
 */
async function main() {
  console.log('🌱 Seeding database...\n');

  // 1. Seed system plans (no creator)
  console.log('📋 Seeding system plans...');
  for (const plan of systemPlans) {
    const result = await upsertPlan(plan);
    console.log(`   ✅ ${result.name} (${result.id})`);
  }

  // 2. Check if dietician (admin) exists
  console.log('\n👨‍⚕️ Setting up dietician plan...');
  const dietician = await prisma.user.findUnique({
    where: { email: DIETICIAN_EMAIL },
  });

  if (!dietician) {
    console.log(
      `   ⚠️  Dietician (${DIETICIAN_EMAIL}) not found - skipping dietician plan.`,
    );
    console.log('   ℹ️  The dietician must log in first to create their account.');
  } else {
    // Create the dietician plan with creator reference
    const dieticianPlanResult = await upsertPlan(
      dieticianPlanForAyan as typeof systemPlans[0],
      dietician.id,
    );
    console.log(
      `   ✅ Created plan: ${dieticianPlanResult.name} (by ${dietician.name || dietician.email})`,
    );

    // 3. Check if client exists and assign the plan
    const client = await prisma.user.findUnique({
      where: { email: CLIENT_EMAIL },
    });

    if (!client) {
      console.log(
        `   ⚠️  Client (${CLIENT_EMAIL}) not found - skipping plan assignment.`,
      );
      console.log('   ℹ️  The client must log in first to receive the plan.');
    } else {
      // First, create the dietician-client relationship
      const relationship = await prisma.dieticianClient.upsert({
        where: {
          dieticianId_clientId: {
            dieticianId: dietician.id,
            clientId: client.id,
          },
        },
        update: {
          status: 'active',
          canViewHistory: false, // Privacy: Don't auto-share history
          canViewWeight: true,
          canViewGlucose: true,
        },
        create: {
          dieticianId: dietician.id,
          clientId: client.id,
          status: 'active',
          canViewHistory: false,
          canViewWeight: true,
          canViewGlucose: true,
          privateNotes: 'Weight loss program - targeting 15-20kg loss over 5 months',
        },
      });
      console.log(
        `   ✅ Created dietician-client relationship (${relationship.status})`,
      );

      // Deactivate any existing active plans for this client
      await prisma.userPlanAssignment.updateMany({
        where: { userId: client.id, isActive: true },
        data: { isActive: false },
      });

      // Assign the plan to the client with privacy attribution
      const assignment = await prisma.userPlanAssignment.upsert({
        where: {
          userId_planId: {
            userId: client.id,
            planId: dieticianPlanResult.id,
          },
        },
        update: {
          isActive: true,
          assignedById: dietician.id, // Track who assigned it
          sharedWith: JSON.stringify([dietician.id]), // Only this dietician can see
          notes: 'Assigned by dietician for weight loss program',
        },
        create: {
          userId: client.id,
          planId: dieticianPlanResult.id,
          isActive: true,
          assignedById: dietician.id,
          sharedWith: JSON.stringify([dietician.id]),
          notes: 'Assigned by dietician for weight loss program - January 2026',
          targetDate: new Date('2026-06-01'), // ~5 months target
        },
      });
      console.log(
        `   ✅ Assigned plan to ${client.name || client.email} (active: ${assignment.isActive})`,
      );
      console.log(`   🔒 Privacy: Only ${dietician.email} can view this assignment`);
    }
  }

  // 4. Seed food database
  await seedFoods();

  console.log('\n🎉 Seeding completed successfully!');
  console.log(`   System plans: ${systemPlans.length}`);
  console.log(`   Dietician plans: ${dietician ? 1 : 0}`);
  console.log(`   Food categories: ${foodCategories.length}`);
  console.log(`   Sample foods: ${sampleFoods.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
