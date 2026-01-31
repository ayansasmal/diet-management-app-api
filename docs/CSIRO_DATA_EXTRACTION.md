# CSIRO Low-Carb Diabetes Diet: Data Extraction Checklist

**Status**: 🔴 NOT STARTED
**Priority**: CRITICAL - Must complete before writing any code
**Estimated Time**: 1-2 days
**Last Updated**: 2026-01-09

---

## Purpose

This document serves as a checklist and reference for extracting all necessary data from the CSIRO Low-Carb Diabetes Diet book. This data is the **foundation** for all calculations, validations, and food recommendations in the app.

**⚠️ DO NOT START CODING UNTIL THIS DOCUMENT IS COMPLETE**

---

## 1. Diet Levels System

### 1.1 Number of Levels
**Question**: How many diet levels does the CSIRO plan define?

**Answer**: _[FILL IN]_
- [ ] Level 1
- [ ] Level 2
- [ ] Level 3
- [ ] Level 4
- [ ] More levels?

### 1.2 Level Assignment Criteria
**Question**: What determines which diet level a person should follow?

| Diet Level | BMI Range | Weight Loss Goal | Activity Level | Other Criteria |
|------------|-----------|------------------|----------------|----------------|
| Level 1    | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 2    | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 3    | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 4    | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |

### 1.3 Daily Unit Allocations Per Level
**Question**: How many units of each food category are allowed per day at each level?

| Diet Level | Bread Units | Protein Units | Vegetable Units | Fat Units | Dairy Units | Fruit Units |
|------------|-------------|---------------|-----------------|-----------|-------------|-------------|
| Level 1    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 2    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 3    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 4    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |

### 1.4 Level Descriptions
**Question**: What is the purpose/description of each level?

**Level 1**: _[FILL IN - e.g., "Most restrictive, rapid weight loss for BMI > 35"]_

**Level 2**: _[FILL IN]_

**Level 3**: _[FILL IN]_

**Level 4**: _[FILL IN]_

---

## 2. Food Unit System

### 2.1 Bread/Carbohydrate Units
**Question**: What equals 1 bread unit?

| Food Item | Serving Size = 1 Unit | Calories | Carbs (g) | Protein (g) | Fat (g) | Notes |
|-----------|----------------------|----------|-----------|-------------|---------|-------|
| White bread | _[e.g., 1 slice (30g)]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Wholemeal bread | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Brown rice (cooked) | _[e.g., 1/2 cup (90g)]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| White rice (cooked) | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Pasta (cooked) | _[e.g., 1/3 cup]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Quinoa (cooked) | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Oats (dry) | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Sweet potato | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Potato | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| _[ADD MORE]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |

### 2.2 Protein Units
**Question**: What equals 1 protein unit?

| Food Item | Serving Size = 1 Unit | Calories | Carbs (g) | Protein (g) | Fat (g) | Notes |
|-----------|----------------------|----------|-----------|-------------|---------|-------|
| Chicken breast | _[e.g., 100g]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Lean beef | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Fish (white) | _[e.g., 150g]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Salmon | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Eggs | _[e.g., 2 large]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Tofu | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Legumes (cooked) | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Greek yogurt | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| _[ADD MORE]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |

### 2.3 Vegetable Units
**Question**: What equals 1 vegetable unit?

| Food Item | Serving Size = 1 Unit | Calories | Carbs (g) | Fiber (g) | Notes |
|-----------|----------------------|----------|-----------|-----------|-------|
| Broccoli | _[e.g., 1 cup]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Spinach | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Carrots | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Tomatoes | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Lettuce | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Capsicum | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Zucchini | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| _[ADD MORE]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |

### 2.4 Fat Units
**Question**: What equals 1 fat unit?

| Food Item | Serving Size = 1 Unit | Calories | Fat (g) | Saturated Fat (g) | Notes |
|-----------|----------------------|----------|---------|-------------------|-------|
| Olive oil | _[e.g., 1 tsp]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Avocado | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Nuts (almonds) | _[e.g., 10 nuts]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Butter | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Cheese | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| _[ADD MORE]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |

### 2.5 Dairy Units
**Question**: What equals 1 dairy unit?

| Food Item | Serving Size = 1 Unit | Calories | Carbs (g) | Protein (g) | Fat (g) | Notes |
|-----------|----------------------|----------|-----------|-------------|---------|-------|
| Milk (skim) | _[e.g., 250ml]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Milk (full cream) | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Yogurt (plain) | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Cheese | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| _[ADD MORE]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |

### 2.6 Fruit Units (if applicable)
**Question**: Does the plan include fruit? If yes, what equals 1 fruit unit?

| Food Item | Serving Size = 1 Unit | Calories | Carbs (g) | Fiber (g) | Notes |
|-----------|----------------------|----------|-----------|-----------|-------|
| Apple | _[e.g., 1 medium]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Banana | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| Berries | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |
| _[ADD MORE]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ | |

---

## 3. Meal Distribution Rules

### 3.1 Units Per Meal Type
**Question**: How should daily units be distributed across meals?

#### Breakfast
| Diet Level | Bread Units | Protein Units | Vegetable Units | Fat Units | Dairy Units | Fruit Units |
|------------|-------------|---------------|-----------------|-----------|-------------|-------------|
| Level 1    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 2    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 3    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 4    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |

#### Lunch
| Diet Level | Bread Units | Protein Units | Vegetable Units | Fat Units | Dairy Units | Fruit Units |
|------------|-------------|---------------|-----------------|-----------|-------------|-------------|
| Level 1    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 2    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 3    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 4    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |

#### Dinner
| Diet Level | Bread Units | Protein Units | Vegetable Units | Fat Units | Dairy Units | Fruit Units |
|------------|-------------|---------------|-----------------|-----------|-------------|-------------|
| Level 1    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 2    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 3    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 4    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |

#### Snacks (if allowed)
| Diet Level | Bread Units | Protein Units | Vegetable Units | Fat Units | Dairy Units | Fruit Units |
|------------|-------------|---------------|-----------------|-----------|-------------|-------------|
| Level 1    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 2    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 3    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |
| Level 4    | _[FILL IN]_ | _[FILL IN]_   | _[FILL IN]_     | _[FILL IN]_ | _[FILL IN]_ | _[FILL IN]_ |

### 3.2 Meal Flexibility
**Question**: Can users redistribute units across meals, or are the allocations fixed?

**Answer**: _[FILL IN - e.g., "Units must be distributed as specified" OR "Users can adjust distribution within daily limits"]_

---

## 4. BMR & Calorie Calculations

### 4.1 BMR Formula
**Question**: Does CSIRO specify a particular BMR calculation formula?

**Formula Used**: _[FILL IN]_

- [ ] Mifflin-St Jeor equation (standard)
  - Men: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
  - Women: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161

- [ ] Harris-Benedict equation (revised)
  - Men: BMR = 88.362 + (13.397 × weight_kg) + (4.799 × height_cm) - (5.677 × age)
  - Women: BMR = 447.593 + (9.247 × weight_kg) + (3.098 × height_cm) - (4.330 × age)

- [ ] CSIRO-specific formula:
  - _[FILL IN IF DIFFERENT]_

### 4.2 Activity Level Multipliers
**Question**: What multipliers should be applied to BMR based on activity level?

| Activity Level | Multiplier | Description |
|----------------|------------|-------------|
| Sedentary | _[FILL IN, typically 1.2]_ | _[FILL IN - e.g., "Little or no exercise"]_ |
| Lightly Active | _[FILL IN, typically 1.375]_ | _[FILL IN - e.g., "Light exercise 1-3 days/week"]_ |
| Moderately Active | _[FILL IN, typically 1.55]_ | _[FILL IN - e.g., "Moderate exercise 3-5 days/week"]_ |
| Very Active | _[FILL IN, typically 1.725]_ | _[FILL IN - e.g., "Hard exercise 6-7 days/week"]_ |
| Extremely Active | _[FILL IN, typically 1.9]_ | _[FILL IN - e.g., "Very hard exercise, physical job"]_ |

### 4.3 BMI Calculation
**Question**: Is standard BMI calculation used?

**Formula**: BMI = weight_kg / (height_m)²

- [ ] Yes, standard BMI formula
- [ ] No, modified formula: _[FILL IN]_

### 4.4 BMI Categories
**Question**: What are the BMI thresholds for different categories?

| Category | BMI Range | CSIRO Recommendation |
|----------|-----------|----------------------|
| Underweight | _[FILL IN, typically < 18.5]_ | _[FILL IN]_ |
| Normal weight | _[FILL IN, typically 18.5-24.9]_ | _[FILL IN]_ |
| Overweight | _[FILL IN, typically 25-29.9]_ | _[FILL IN]_ |
| Obese Class I | _[FILL IN, typically 30-34.9]_ | _[FILL IN]_ |
| Obese Class II | _[FILL IN, typically 35-39.9]_ | _[FILL IN]_ |
| Obese Class III | _[FILL IN, typically ≥ 40]_ | _[FILL IN]_ |

---

## 5. Weight Loss Timeline Projections

### 5.1 Safe Weight Loss Rate
**Question**: What does CSIRO recommend as a safe weekly weight loss rate?

**Rate**: _[FILL IN, typically 0.5-1.0 kg/week]_

**Variations by BMI**:
- BMI < 30: _[FILL IN]_ kg/week
- BMI 30-35: _[FILL IN]_ kg/week
- BMI > 35: _[FILL IN]_ kg/week

### 5.2 Caloric Deficit for Weight Loss
**Question**: What daily caloric deficit should be applied?

**Deficit**: _[FILL IN, typically 500-750 kcal/day]_

**Calculation**:
- Daily Calorie Target = (BMR × Activity Multiplier) - Deficit
- OR: _[FILL IN if different formula]_

### 5.3 Timeline Calculation
**Question**: How should we calculate estimated weeks to reach target weight?

**Formula**: _[FILL IN]_

Example:
- Current Weight: 90 kg
- Target Weight: 75 kg
- Weight to Lose: 15 kg
- Weekly Loss Rate: 0.5 kg/week
- Estimated Weeks: 30 weeks (~7 months)

**CSIRO Adjustments**: _[FILL IN any factors that adjust this timeline]_

---

## 6. Blood Glucose Targets

### 6.1 Normal Glucose Ranges
**Question**: What are the healthy target ranges for blood glucose?

| Reading Type | Target Range (mmol/L) | Notes |
|--------------|----------------------|-------|
| Fasting | _[FILL IN, typically 4.0-5.5]_ | _[FILL IN]_ |
| Post-meal (2 hours) | _[FILL IN, typically < 7.8]_ | _[FILL IN]_ |
| Random | _[FILL IN]_ | _[FILL IN]_ |

### 6.2 Pre-Diabetes Ranges
**Question**: What ranges indicate pre-diabetes?

| Reading Type | Pre-Diabetes Range (mmol/L) | Notes |
|--------------|----------------------------|-------|
| Fasting | _[FILL IN, typically 5.6-6.9]_ | _[FILL IN]_ |
| Post-meal (2 hours) | _[FILL IN, typically 7.8-11.0]_ | _[FILL IN]_ |

### 6.3 Diabetes Ranges
**Question**: What ranges indicate diabetes?

| Reading Type | Diabetes Range (mmol/L) | Notes |
|--------------|------------------------|-------|
| Fasting | _[FILL IN, typically ≥ 7.0]_ | _[FILL IN]_ |
| Post-meal (2 hours) | _[FILL IN, typically ≥ 11.1]_ | _[FILL IN]_ |

---

## 7. Additional Program Rules

### 7.1 Forbidden Foods
**Question**: Are there specific foods that should never be consumed on the CSIRO plan?

**List**:
- _[FILL IN]_
- _[FILL IN]_
- _[FILL IN]_

### 7.2 Recommended Foods
**Question**: Are there foods that are particularly recommended?

**List**:
- _[FILL IN]_
- _[FILL IN]_
- _[FILL IN]_

### 7.3 Meal Timing
**Question**: Are there specific recommendations for meal timing?

**Breakfast**: _[FILL IN - e.g., "Within 1 hour of waking"]_
**Lunch**: _[FILL IN]_
**Dinner**: _[FILL IN - e.g., "At least 2 hours before bed"]_
**Snacks**: _[FILL IN]_

### 7.4 Hydration
**Question**: How much water/fluid is recommended daily?

**Daily Target**: _[FILL IN, typically 8-10 glasses or 2-2.5L]_

**Notes**: _[FILL IN any specific hydration rules]_

### 7.5 Exercise Recommendations
**Question**: What exercise recommendations does the CSIRO plan include?

**Frequency**: _[FILL IN - e.g., "5 days per week"]_
**Duration**: _[FILL IN - e.g., "30-60 minutes"]_
**Type**: _[FILL IN - e.g., "Mix of cardio and strength"]_

**Notes**: _[FILL IN]_

---

## 8. Program Phases

### 8.1 Does the plan have phases?
**Question**: Is the plan structured in phases (e.g., induction, weight loss, maintenance)?

- [ ] No phases - single continuous plan
- [ ] Yes, phases exist:

**Phase 1**: _[FILL IN - Name, Duration, Rules]_

**Phase 2**: _[FILL IN]_

**Phase 3**: _[FILL IN]_

**Notes**: _[FILL IN how phases affect diet levels and unit allocations]_

---

## 9. Special Considerations

### 9.1 Diabetes Medications
**Question**: Are there considerations for people on diabetes medications?

**Answer**: _[FILL IN]_

### 9.2 Vegetarian/Vegan Options
**Question**: Does the plan provide vegetarian or vegan alternatives?

**Answer**: _[FILL IN]_

**Protein Substitutions**: _[FILL IN]_

### 9.3 Food Allergies/Intolerances
**Question**: How should the plan be adapted for common allergies (gluten, dairy, nuts)?

**Answer**: _[FILL IN]_

---

## 10. Completion Checklist

### Essential Data (Must Complete)
- [ ] Diet levels defined (number, criteria, descriptions)
- [ ] Daily unit allocations per diet level documented
- [ ] Bread unit equivalents (at least 10 foods)
- [ ] Protein unit equivalents (at least 10 foods)
- [ ] Vegetable unit equivalents (at least 10 foods)
- [ ] Fat unit equivalents (at least 5 foods)
- [ ] Dairy unit equivalents (at least 5 foods)
- [ ] BMR calculation formula confirmed
- [ ] Activity multipliers documented
- [ ] Safe weight loss rate defined
- [ ] Caloric deficit approach confirmed
- [ ] Blood glucose target ranges documented

### Nice-to-Have Data (Can Add Later)
- [ ] Meal distribution rules per meal type
- [ ] Full food database (50+ items per category)
- [ ] Forbidden foods list
- [ ] Meal timing recommendations
- [ ] Exercise recommendations
- [ ] Program phases (if applicable)
- [ ] Special dietary considerations

---

## 11. Next Steps After Completion

Once this document is complete:

1. ✅ Create `backend/database/seed-data/diet-levels.json` with extracted data
2. ✅ Create `backend/database/seed-data/food-items-*.json` files for each category
3. ✅ Create `backend/services/calculator.service.js` with BMR/BMI formulas
4. ✅ Begin backend implementation (Week 1, Day 1)

---

## Notes & Observations

Use this section to record any insights, observations, or questions that arise during data extraction:

**Date**: _[Date]_
**Notes**: _[Your observations]_

---

**Last Updated**: 2026-01-09
**Status**: 🔴 Awaiting data extraction
