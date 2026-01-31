# Nutrition Plan Engine - Architecture & Implementation Guide

> **Version:** 1.0.0
> **Created:** January 24, 2026
> **Status:** Schema Complete, Implementation Pending

---

## Table of Contents

1. [Directive](#directive)
2. [Problem Statement](#problem-statement)
3. [Solution Architecture](#solution-architecture)
4. [Plan Schema v1](#plan-schema-v1)
5. [Database Design](#database-design)
6. [Rule Evaluation Engine](#rule-evaluation-engine)
7. [Implementation Tasks](#implementation-tasks)
8. [Example Plans](#example-plans)
9. [Future Roadmap](#future-roadmap)

---

## Directive

Refactor the existing meal-planning concept into a **plan-agnostic, rule-driven nutrition engine** that supports multiple diet plans (including CSIRO-inspired) without being tightly coupled to any single methodology.

The system must allow new plans to be introduced via configuration rather than code changes.

### Design Principles

1. **Plans as Configuration** - Diet plans are data, not code
2. **Rule-Driven Evaluation** - Constraints are expressed as composable rules
3. **Separation of Concerns** - UI, rules, and plan logic are decoupled
4. **Extensibility First** - Adding new plans requires zero code changes
5. **User Empowerment** - Users can customize and create their own plans

---

## Problem Statement

The current mental model assumes:
- A single diet philosophy (CSIRO Low Carb)
- Hardcoded rules for calories, macros, and meal eligibility
- UI logic that implicitly encodes the diet constraints

### Limitations

| Issue | Impact |
|-------|--------|
| Legal/branding risk | Tight alignment to CSIRO could create IP concerns |
| Poor extensibility | Adding new plans requires code changes |
| Tight coupling | UI, rules, and plan logic are intertwined |
| Limited scalability | Hard to monetize or personalize |

---

## Solution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Nutrition Plan Engine                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │   Plan Store     │    │  Rule Evaluation │                   │
│  │   (Database)     │───▶│     Engine       │                   │
│  └──────────────────┘    └────────┬─────────┘                   │
│                                   │                              │
│                                   ▼                              │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  User Assignment │◀───│  Meal Selection  │                   │
│  │  (Customizations)│    │     Flow         │                   │
│  └──────────────────┘    └──────────────────┘                   │
│                                   │                              │
│                                   ▼                              │
│                          ┌──────────────────┐                   │
│                          │   UI Components  │                   │
│                          │  (Consumes API)  │                   │
│                          └──────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Core Concepts

#### 1. Plan as Configuration

Each nutrition plan is defined as a data object stored in the database:
- Daily macro targets (calories, protein, carbs, fat)
- Per-meal constraints (min/max, warnings)
- Rule flags (e.g., low-carb, net carbs preferred)
- Meal sequencing rules (number of meals, snacks allowed)

#### 2. Rule Evaluation Engine

A pure-function-based engine that:
- Accepts a selected plan
- Tracks remaining macro budget
- Evaluates whether a meal is: Allowed, Allowed with warning, or Blocked
- **Returns reasons, not just booleans**

#### 3. Meal Selection Flow

- Meal selection is sequential (Meal 1 → Meal 2 → Meal 3)
- Each selection updates remaining macro budget
- Available meals are filtered dynamically using the rule engine
- UI reflects constraints visually (enabled, warning, disabled)

---

## Plan Schema v1

The complete TypeScript schema is defined in:
```
frontend/src/types/nutrition-plan.ts
```

### Key Interfaces

#### MacroTargets
```typescript
interface MacroTargets {
  calories: NumericConstraint;
  protein: NumericConstraint;
  carbs: NumericConstraint;
  fat: NumericConstraint;
  fiber?: NumericConstraint;
  sugar?: NumericConstraint;
  sodium?: NumericConstraint;
}
```

#### NumericConstraint
```typescript
interface NumericConstraint {
  target?: number;  // Exact value
  min?: number;     // Minimum allowed
  max?: number;     // Maximum allowed
}
```

#### MealFlowConfig
```typescript
interface MealFlowConfig {
  slots: MealSlot[];
  allowSkipping: boolean;
  allowReordering: boolean;
  minTimeBetweenMeals?: number;
}
```

#### NutritionRule (Discriminated Union)
```typescript
type NutritionRule =
  | NetCarbsRule
  | ProteinPerMealRule
  | LimitProcessedRule
  | MealTimingRule
  | FoodCategoryRule
  | MacroRatioRule
  | GlycemicRule;
```

### Rule Types

| Rule Type | Purpose | Example |
|-----------|---------|---------|
| `preferNetCarbs` | Use net carbs (total - fiber) | Low-carb plans |
| `proteinPerMealMinimum` | Ensure protein distribution | Min 30g per meal |
| `limitUltraProcessed` | Cap processed foods | Max 20% of calories |
| `mealTiming` | Time-based constraints | No carbs after 6pm |
| `foodCategoryRestriction` | Block/warn categories | No grains, no dairy |
| `macroRatio` | Percentage constraints | Protein = 30% of calories |
| `glycemicControl` | GI/GL limits | Max GI of 55 per meal |

---

## Database Design

The Prisma schema is defined in:
```
backend/prisma/schema.prisma
```

### Tables

#### NutritionPlan
Stores plan definitions with complex config as JSON:

| Column | Type | Description |
|--------|------|-------------|
| `id` | String | Unique identifier |
| `name` | String | Display name |
| `visibility` | String | system, public, private |
| `dailyTargets` | JSON | MacroTargets config |
| `mealFlow` | JSON | MealFlowConfig |
| `rules` | JSON | Array of NutritionRule |
| `isPremium` | Boolean | Monetization flag |
| `tags` | JSON | Array of strings |

#### UserPlanAssignment
Tracks user's active plan with customizations:

| Column | Type | Description |
|--------|------|-------------|
| `userId` | String | User reference |
| `planId` | String | Plan reference |
| `customTargets` | JSON | User's macro overrides |
| `disabledRules` | JSON | Rules user has disabled |
| `isActive` | Boolean | Current active plan |

### Design Decisions

1. **JSON columns for nested config** - Flexibility without migrations
2. **Indexed visibility/tags** - Fast filtering for plan discovery
3. **Separate assignment table** - Users customize without modifying originals
4. **SQLite → PostgreSQL path** - JSON functions work in both

---

## Rule Evaluation Engine

### Evaluation Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Select    │────▶│  Evaluate   │────▶│   Update    │
│    Meal     │     │   Rules     │     │   Budget    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Return    │
                    │   Result    │
                    └─────────────┘
```

### Evaluation Result Structure

```typescript
interface MealEvaluationResult {
  status: 'pass' | 'warning' | 'fail';
  rules: RuleEvaluationResult[];
  remainingBudget: MacroTargets;
  summaryReason?: string;
}

interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  status: 'pass' | 'warning' | 'fail';
  reason: string;  // Human-readable explanation
  severity: 'info' | 'warning' | 'error';
  details?: {
    actual: number;
    expected: number | NumericConstraint;
    unit: string;
  };
}
```

### Key Principle: Reasons, Not Booleans

The engine always returns **why** a meal is allowed/blocked:

```typescript
// Bad: Just a boolean
{ allowed: false }

// Good: Reason included
{
  status: 'warning',
  reason: 'High fat – dinner must be light to stay within plan',
  details: { actual: 45, expected: { max: 30 }, unit: 'g fat' }
}
```

---

## Implementation Tasks

### Phase 1: Foundation (Current)
- [x] Define Plan schema (TypeScript interfaces)
- [x] Create Prisma schema for storage
- [ ] Build rule evaluation as stateless functions
- [ ] Create seed data for system plans

### Phase 2: API Layer
- [ ] `GET /plans` - List available plans
- [ ] `GET /plans/:id` - Get plan details
- [ ] `POST /plans` - Create plan (admin/premium)
- [ ] `GET /users/plan` - Get user's active plan
- [ ] `POST /users/plan` - Assign plan to user
- [ ] `PATCH /users/plan` - Customize user's plan

### Phase 3: Evaluation Engine
- [ ] Implement `evaluateMeal(plan, meal, currentBudget)`
- [ ] Implement `filterAvailableMeals(plan, meals, currentBudget)`
- [ ] Add rule-specific evaluation functions
- [ ] Create remaining budget calculator

### Phase 4: UI Integration
- [ ] Plan selection page
- [ ] Meal selection with rule feedback
- [ ] Budget tracker component
- [ ] Plan customization modal

### Phase 5: Advanced Features
- [ ] User-created plans
- [ ] Plan templates
- [ ] Premium plan marketplace
- [ ] Dietitian/coach plans

---

## Example Plans

### Low Carb (CSIRO-inspired)

```json
{
  "id": "low_carb_csiro_inspired",
  "name": "Low Carb",
  "shortDescription": "A science-backed low-carb approach for blood sugar management",
  "visibility": "system",
  "difficulty": "intermediate",
  "tags": ["low-carb", "diabetes-friendly", "weight-loss"],
  "sourceAttribution": "Inspired by CSIRO research on low-carbohydrate diets",
  "isPremium": false,
  "icon": "🥗",
  "accentColor": "#10B981",
  "dailyTargets": {
    "calories": { "target": 1800, "min": 1600, "max": 2000 },
    "protein": { "min": 120 },
    "carbs": { "max": 80 },
    "fat": { "min": 60, "max": 90 },
    "fiber": { "min": 25 }
  },
  "mealFlow": {
    "slots": [
      { "id": "breakfast", "type": "breakfast", "name": "Breakfast", "order": 1, "required": true },
      { "id": "lunch", "type": "lunch", "name": "Lunch", "order": 2, "required": true },
      { "id": "dinner", "type": "dinner", "name": "Dinner", "order": 3, "required": true }
    ],
    "allowSkipping": false,
    "allowReordering": false
  },
  "rules": [
    {
      "id": "net_carbs",
      "type": "preferNetCarbs",
      "name": "Use Net Carbs",
      "description": "Fiber is subtracted from total carbs",
      "severity": "info",
      "enabled": true
    },
    {
      "id": "protein_per_meal",
      "type": "proteinPerMealMinimum",
      "name": "Protein Distribution",
      "description": "Minimum 30g protein per meal for optimal muscle synthesis",
      "severity": "warning",
      "enabled": true,
      "minGrams": 30
    }
  ],
  "useNetCarbs": true,
  "tips": [
    "Focus on whole foods: vegetables, lean proteins, healthy fats",
    "Limit processed foods and added sugars",
    "Stay hydrated - aim for 2L water daily"
  ]
}
```

### High Protein

```json
{
  "id": "high_protein",
  "name": "High Protein",
  "shortDescription": "Maximize protein intake for muscle building and recovery",
  "visibility": "system",
  "difficulty": "intermediate",
  "tags": ["high-protein", "muscle-building", "fitness"],
  "isPremium": false,
  "icon": "💪",
  "accentColor": "#EF4444",
  "dailyTargets": {
    "calories": { "target": 2200 },
    "protein": { "min": 180 },
    "carbs": { "min": 150, "max": 250 },
    "fat": { "min": 50, "max": 80 }
  },
  "rules": [
    {
      "id": "protein_ratio",
      "type": "macroRatio",
      "name": "Protein Target",
      "description": "Protein should be at least 35% of calories",
      "severity": "warning",
      "enabled": true,
      "macro": "protein",
      "percentage": { "min": 35 }
    }
  ]
}
```

### Custom Plan Template

```json
{
  "id": "custom_template",
  "name": "Custom Plan",
  "shortDescription": "Build your own nutrition plan from scratch",
  "visibility": "private",
  "difficulty": "beginner",
  "tags": ["custom"],
  "isPremium": false,
  "icon": "✏️",
  "dailyTargets": {
    "calories": { "target": 2000 },
    "protein": { "min": 50 },
    "carbs": {},
    "fat": {}
  },
  "rules": []
}
```

---

## Future Roadmap

### Short-term (MVP-1)
- System plans (Low Carb, High Protein, Balanced)
- Basic plan selection
- Rule evaluation for meal eligibility

### Medium-term (MVP-2+)
- User plan customization
- Plan templates
- Meal planning with rule feedback

### Long-term
- User-created plans
- Premium plan marketplace
- Dietitian/coach portal
- AI-assisted plan recommendations
- Plan sharing and community features

---

## Outcome

After this refactor:
- ✅ The app supports multiple nutrition plans without code rewrites
- ✅ CSIRO becomes a preset, not a dependency
- ✅ New plans can be added via configuration only
- ✅ UI remains unchanged while behaviour adapts dynamically
- ✅ Legal, product, and scaling risks are significantly reduced

The foundation is laid for:
- User-created plans
- Dietitian/coach plans
- Paid plan libraries
- AI-powered recommendations

**This refactor transforms the app from a single-purpose tool into a nutrition planning platform.**

---

*Last Updated: January 24, 2026*
