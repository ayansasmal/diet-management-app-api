# CSIRO Low-Carb Diet App: Complete Delivery Plan

## Project Overview

**Goal**: Transform the CSIRO Low-Carb Diabetes Diet book into a digital companion for pre-diabetic users, with personal tracking, food alternatives, meal experiences, admin management, and mobile access.

**Current State**: Greenfield project - zero code written, only documentation exists.

**Approach**: Local-first development (SQLite + file storage), backend-first implementation, then migrate to AWS when ready for production.

---

## MVP Roadmap

### MVP-0: Foundation & Calculations (Weeks 1-2)
User profile, BMR/BMI calculations, diet level suggestions, daily weight/glucose logging.

### MVP-1: Food Alternative Search (Weeks 3-4)
CSIRO-based food search with unit-matched alternatives per diet level and meal type.

### MVP-2: Meal Experience Tracking (Weeks 5-6)
Multi-image meal logging with ratings, notes, and unit tracking.

### MVP-3: Admin Portal (Weeks 7-14, 8 weeks)
Separate web app for recipe management, food alternatives, and user administration.

### MVP-4: Mobile App (Weeks 15-26, 12 weeks)
React Native app with camera integration, push notifications, and quick logging.

**Total Timeline**: 26 weeks (~6 months for all MVPs)

---

## Technology Stack

### Backend
- **Runtime**: Node.js 18+ with Express.js
- **Database**: SQLite (local-first) → PostgreSQL RDS (future)
- **Authentication**: JWT-based (simple) → Google OAuth (future)
- **Image Storage**: Local filesystem → S3 (future)
- **Notifications**: Firebase Cloud Messaging (FCM) for mobile

### Frontend
- **User App**: React + Next.js 14+ (App Router) + Tailwind CSS
- **Admin Portal**: React + Next.js 14+ (separate app) + Tailwind CSS
- **Mobile App**: React Native (Expo or bare) + React Navigation

### Cloud Infrastructure (Future)
- **Hosting**: Vercel (web apps) + AWS (backend)
- **Database**: RDS PostgreSQL
- **Storage**: S3 + CloudFront CDN
- **Functions**: Lambda for image processing

---

## Critical Pre-Implementation Tasks

### CSIRO Data Extraction (DO THIS FIRST - 1-2 days)

Before writing any code, extract from the CSIRO Low-Carb Diabetes Diet book:

1. **Diet Levels**:
   - How many levels? (e.g., Level 1, 2, 3, 4)
   - Criteria for each level (BMI ranges, weight loss goals, activity level)
   - Daily unit allocations per level (bread, protein, vegetables, fat, dairy)

2. **Food Unit System**:
   - What is 1 unit of bread? (e.g., 1 slice = 1/2 cup rice = 1/3 cup pasta)
   - What is 1 unit of protein? (e.g., 100g chicken = 2 eggs = 150g fish)
   - Full equivalency table for all categories

3. **BMR Calculation**:
   - Does CSIRO specify a particular formula?
   - If not, use Mifflin-St Jeor:
     - Men: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
     - Women: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161

4. **Activity Multipliers**:
   - Standard: Sedentary (1.2), Lightly Active (1.375), Moderately Active (1.55), Very Active (1.725), Extremely Active (1.9)

5. **Weight Loss Timeline**:
   - Safe weekly loss rate per CSIRO guidance (typically 0.5-0.75 kg/week)
   - Daily caloric deficit (typically 500-750 kcal/day)

**Action**: Create a spreadsheet or document with all extracted CSIRO data before coding begins.

---

## Complete Database Schema

### MVP-0 Tables

```sql
-- Users
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Profiles
CREATE TABLE user_profiles (
  user_id INTEGER PRIMARY KEY,
  height_cm REAL NOT NULL,
  weight_kg REAL NOT NULL,
  age INTEGER NOT NULL,
  sex TEXT NOT NULL CHECK(sex IN ('male', 'female')),
  activity_level TEXT NOT NULL,
  target_weight_kg REAL NOT NULL,
  diet_level INTEGER NOT NULL,
  bmr REAL NOT NULL,
  bmi REAL NOT NULL,
  target_bmi REAL NOT NULL,
  daily_calorie_target REAL NOT NULL,
  estimated_weeks_to_target INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Daily Weight Logs
CREATE TABLE daily_weight_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  log_date DATE NOT NULL,
  weight_kg REAL NOT NULL,
  logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, log_date)
);

-- Blood Glucose Logs
CREATE TABLE glucose_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  log_date DATE NOT NULL,
  reading_time DATETIME NOT NULL,
  glucose_mmol_l REAL NOT NULL,
  reading_type TEXT CHECK(reading_type IN ('fasting', 'post_meal', 'random')),
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_weight_logs_user_date ON daily_weight_logs(user_id, log_date DESC);
CREATE INDEX idx_glucose_logs_user_date ON glucose_logs(user_id, log_date DESC);
```

### MVP-1 Tables

```sql
-- Food Categories
CREATE TABLE food_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Food Items
CREATE TABLE food_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  serving_size TEXT NOT NULL,
  units_per_serving REAL NOT NULL DEFAULT 1.0,
  calories REAL,
  carbs_g REAL,
  protein_g REAL,
  fat_g REAL,
  fiber_g REAL,
  notes TEXT,
  FOREIGN KEY (category_id) REFERENCES food_categories(id)
);

-- Diet Levels
CREATE TABLE diet_levels (
  level INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  bread_units REAL NOT NULL,
  protein_units REAL NOT NULL,
  vegetable_units REAL NOT NULL,
  fat_units REAL NOT NULL,
  dairy_units REAL NOT NULL,
  fruit_units REAL DEFAULT 0
);

-- Meal Types
CREATE TABLE meal_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

-- Meal Food Constraints (CSIRO rules)
CREATE TABLE meal_food_constraints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diet_level INTEGER NOT NULL,
  meal_type_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  max_units REAL NOT NULL,
  FOREIGN KEY (diet_level) REFERENCES diet_levels(level),
  FOREIGN KEY (meal_type_id) REFERENCES meal_types(id),
  FOREIGN KEY (category_id) REFERENCES food_categories(id),
  UNIQUE(diet_level, meal_type_id, category_id)
);

CREATE INDEX idx_food_items_category ON food_items(category_id);
CREATE INDEX idx_food_items_name ON food_items(name);
```

### MVP-2 Tables

```sql
-- Meal Logs
CREATE TABLE meal_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  log_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  rating INTEGER CHECK(rating BETWEEN 1 AND 5),
  notes TEXT,
  total_calories REAL,
  logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Meal Food Items
CREATE TABLE meal_food_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meal_log_id INTEGER NOT NULL,
  food_item_id INTEGER NOT NULL,
  units_consumed REAL NOT NULL,
  servings_consumed REAL NOT NULL,
  calories REAL NOT NULL,
  FOREIGN KEY (meal_log_id) REFERENCES meal_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (food_item_id) REFERENCES food_items(id)
);

-- Meal Images
CREATE TABLE meal_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meal_log_id INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size_kb INTEGER,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meal_log_id) REFERENCES meal_logs(id) ON DELETE CASCADE
);

CREATE INDEX idx_meal_logs_user_date ON meal_logs(user_id, log_date DESC);
CREATE INDEX idx_meal_images_meal ON meal_images(meal_log_id);
```

### MVP-3 Tables (Admin Portal)

```sql
-- Admin Users
CREATE TABLE admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES admin_users(id),
  last_login_at DATETIME
);

-- Admin Audit Log
CREATE TABLE admin_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL REFERENCES admin_users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Recipes
CREATE TABLE recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT NOT NULL,
  servings INTEGER NOT NULL DEFAULT 1,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'draft',
  is_csiro_approved BOOLEAN NOT NULL DEFAULT FALSE,
  source TEXT NOT NULL DEFAULT 'community',
  created_by INTEGER NOT NULL REFERENCES admin_users(id),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Recipe Categories
CREATE TABLE recipe_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Recipe Tags
CREATE TABLE recipe_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  tag_type TEXT NOT NULL DEFAULT 'dietary'
);

-- Recipe Category Junction
CREATE TABLE recipe_category_junction (
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES recipe_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, category_id)
);

-- Recipe Tag Junction
CREATE TABLE recipe_tag_junction (
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES recipe_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

-- Recipe Ingredients
CREATE TABLE recipe_ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  food_id INTEGER NOT NULL REFERENCES food_items(id),
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT
);

-- Recipe Images
CREATE TABLE recipe_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_key TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  uploaded_by INTEGER NOT NULL REFERENCES admin_users(id),
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Recipe Nutrition
CREATE TABLE recipe_nutrition (
  recipe_id INTEGER PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  calories_per_serving REAL,
  carbs_grams_per_serving REAL,
  protein_grams_per_serving REAL,
  fat_grams_per_serving REAL,
  fiber_grams_per_serving REAL,
  carb_units_per_serving REAL,
  protein_units_per_serving REAL,
  fat_units_per_serving REAL,
  calculated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Food Verification
CREATE TABLE food_verification (
  food_id INTEGER PRIMARY KEY REFERENCES food_items(id) ON DELETE CASCADE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by INTEGER REFERENCES admin_users(id),
  verified_at DATETIME,
  verification_notes TEXT
);

-- User Activity Summary
CREATE TABLE user_activity_summary (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_login_at DATETIME,
  total_logins INTEGER NOT NULL DEFAULT 0,
  total_meals_logged INTEGER NOT NULL DEFAULT 0,
  total_weight_entries INTEGER NOT NULL DEFAULT 0,
  total_glucose_entries INTEGER NOT NULL DEFAULT 0,
  account_status TEXT NOT NULL DEFAULT 'active',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipes_status ON recipes(status);
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_audit_admin_id ON admin_audit_log(admin_id);
```

### MVP-4 Tables (Mobile App)

```sql
-- User Devices (for push notifications)
CREATE TABLE user_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL UNIQUE,
  device_type TEXT NOT NULL,
  device_name TEXT,
  app_version TEXT,
  os_version TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  registered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Notification Preferences
CREATE TABLE notification_preferences (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  enable_weight_reminder BOOLEAN NOT NULL DEFAULT TRUE,
  weight_reminder_time TEXT DEFAULT '07:00',
  enable_glucose_reminder BOOLEAN NOT NULL DEFAULT TRUE,
  glucose_reminder_times TEXT DEFAULT '07:00,12:00,18:00',
  enable_meal_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  breakfast_reminder_time TEXT DEFAULT '08:00',
  lunch_reminder_time TEXT DEFAULT '12:30',
  dinner_reminder_time TEXT DEFAULT '18:30',
  enable_weekly_summary BOOLEAN NOT NULL DEFAULT TRUE,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Notification History
CREATE TABLE notification_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  device_id INTEGER REFERENCES user_devices(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivered_at DATETIME,
  clicked_at DATETIME,
  error_message TEXT
);

CREATE INDEX idx_user_devices_user ON user_devices(user_id);
CREATE INDEX idx_notifications_user ON notification_history(user_id);
```

---

## Project Structure

```
low-carb-diet-app/
├── backend/                          # Shared API for all frontends
│   ├── package.json
│   ├── server.js
│   ├── .env.example
│   ├── database/
│   │   ├── schema.sql               # Complete schema (all MVPs)
│   │   ├── db.js                    # SQLite connection
│   │   ├── seed-data/
│   │   │   ├── food-categories.json
│   │   │   ├── food-items-bread.json
│   │   │   ├── diet-levels.json
│   │   │   └── meal-types.json
│   │   └── seed.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── profile.routes.js
│   │   ├── tracking.routes.js
│   │   ├── food.routes.js
│   │   ├── meals.routes.js
│   │   ├── recipes.routes.js         # Public recipe endpoints
│   │   ├── admin/                    # MVP-3
│   │   │   ├── auth.routes.js
│   │   │   ├── recipes.routes.js
│   │   │   ├── foods.routes.js
│   │   │   ├── users.routes.js
│   │   │   └── dashboard.routes.js
│   │   └── mobile/                   # MVP-4
│   │       ├── devices.routes.js
│   │       ├── notifications.routes.js
│   │       └── quickLog.routes.js
│   ├── controllers/
│   ├── services/
│   │   ├── calculator.service.js     # BMR, BMI, diet level
│   │   ├── auth.service.js
│   │   ├── food.service.js
│   │   ├── meal.service.js
│   │   ├── recipe.service.js         # MVP-3
│   │   ├── notification.service.js   # MVP-4
│   │   └── image.service.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── admin.middleware.js       # MVP-3
│   │   └── validation.middleware.js
│   ├── jobs/                         # MVP-4
│   │   └── notificationScheduler.js
│   └── uploads/                      # Local image storage
│       └── users/
│           └── {userId}/
│               └── meals/
│
├── frontend/                         # User-facing web app (MVP-0/1/2)
│   ├── package.json
│   ├── next.config.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   ├── login/
│   │   │   ├── onboarding/
│   │   │   ├── dashboard/
│   │   │   ├── tracking/
│   │   │   ├── foods/
│   │   │   └── meals/
│   │   ├── components/
│   │   └── lib/
│   └── public/
│
├── admin-portal/                     # Admin web app (MVP-3)
│   ├── package.json
│   ├── next.config.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Dashboard
│   │   │   ├── login/
│   │   │   ├── recipes/
│   │   │   ├── foods/
│   │   │   ├── users/
│   │   │   └── audit-log/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── recipes/
│   │   │   ├── foods/
│   │   │   └── users/
│   │   └── lib/
│   └── public/
│
├── mobile-app/                       # React Native app (MVP-4)
│   ├── package.json
│   ├── app.json
│   ├── src/
│   │   ├── navigation/
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   ├── home/
│   │   │   ├── logging/
│   │   │   ├── camera/
│   │   │   └── settings/
│   │   ├── components/
│   │   ├── services/
│   │   │   ├── api/
│   │   │   ├── storage/
│   │   │   ├── notifications/
│   │   │   └── camera/
│   │   └── store/
│   ├── android/
│   └── ios/
│
├── shared/                           # (Optional) Shared code
│   ├── types/
│   └── utils/
│
├── CLAUDE.md
├── README.md
└── Business_requirements.md
```

---

## Implementation Sequence

### Phase 1: MVP-0 Backend (Weeks 1-2)

**Week 1: Setup & Authentication**
1. Initialize backend project
   ```bash
   cd backend
   npm init -y
   npm install express sqlite3 better-sqlite3 bcrypt jsonwebtoken cors dotenv express-validator helmet winston
   npm install --save-dev nodemon jest supertest
   ```
2. Create database schema (all tables at once)
3. Set up Express server with middleware
4. Implement user registration and login
5. Create JWT auth middleware
6. Test authentication with Postman

**Week 2: Profile & Tracking**
1. Extract CSIRO data (diet levels, BMR formulas)
2. Implement calculator service (BMR, BMI, diet level suggestion)
3. Build profile onboarding endpoint
4. Implement weight logging endpoints
5. Implement glucose logging endpoints
6. Write unit tests
7. Document API endpoints

**Deliverables**:
- Working backend API with authentication
- Profile management with calculations
- Daily weight/glucose tracking
- API documentation (Postman collection)

### Phase 2: MVP-1 Backend (Weeks 3-4)

**Week 3: Food Database**
1. Seed food categories (bread, protein, vegetable, fat, dairy)
2. Seed food items with nutritional info and unit values
3. Seed diet levels with unit allocations
4. Seed meal types and constraints
5. Test data integrity

**Week 4: Food Search API**
1. Implement food search endpoint
2. Build food alternatives logic
3. Create meal options search (filtered by diet level, meal type, category)
4. Test constraint validation
5. Write integration tests

**Deliverables**:
- Complete food reference database
- Food search API with CSIRO constraints
- Unit-based alternative suggestions

### Phase 3: MVP-2 Backend (Weeks 5-6)

**Week 5: Meal Logging**
1. Implement meal CRUD endpoints
2. Build meal-food association logic
3. Add image upload with Sharp compression
4. Create local file storage structure
5. Calculate total calories per meal

**Week 6: Meal History & Polish**
1. Implement meal history with pagination
2. Build similar meals algorithm
3. Add comprehensive error handling
4. Performance testing and optimization
5. Write integration tests

**Deliverables**:
- Meal logging with multi-image support
- Meal history and similar meals feature
- Optimized backend ready for frontend

### Phase 4: Frontend (Weeks 7-10)

**Week 7: Setup & Authentication UI**
1. Initialize Next.js project
2. Set up Tailwind CSS
3. Build login/register pages
4. Implement JWT token storage
5. Create protected route wrapper

**Week 8: MVP-0 Frontend**
1. Build onboarding flow
2. Create dashboard with profile display
3. Implement weight/glucose logging forms
4. Add basic charts (Chart.js or Recharts)

**Week 9: MVP-1 Frontend**
1. Build food search interface
2. Create meal options selector
3. Implement filters and search
4. Build food alternatives view

**Week 10: MVP-2 Frontend**
1. Build meal logging interface
2. Implement image upload with preview
3. Create meal history view with images
4. Build meal detail view with rating/notes
5. End-to-end testing

**Deliverables**:
- Complete user-facing web app
- All MVP-0/1/2 features functional
- Ready for personal use (first user!)

### Phase 5: MVP-3 Admin Portal (Weeks 11-18, 8 weeks)

**Week 11-12: Foundation**
1. Initialize separate Next.js admin project
2. Configure admin theme (Tailwind + custom colors)
3. Create admin authentication flow
4. Build AdminLayout with sidebar
5. Implement admin middleware in backend
6. Set up audit logging

**Week 13-14: Recipe Management**
1. Build recipe CRUD endpoints
2. Implement recipe list page with search/filter
3. Create recipe form (multi-step)
4. Build ingredient selector
5. Add recipe image upload
6. Implement nutrition calculation

**Week 15: Food Management**
1. Build food verification UI
2. Implement CSV bulk import
3. Create food CRUD forms
4. Add verification workflow

**Week 16: User Management**
1. Build user list page
2. Create user detail view
3. Implement user activity metrics
4. Add account activation/deactivation
5. Build data export functionality

**Week 17: Dashboard & Polish**
1. Build admin dashboard with stats
2. Create audit log viewer
3. Add error handling and notifications
4. Implement loading states
5. Write admin documentation

**Week 18: Testing & Deployment**
1. Unit and integration tests
2. User acceptance testing
3. Deploy to Vercel (admin subdomain)
4. Set up monitoring

**Deliverables**:
- Fully functional admin portal
- Recipe management system
- Food and user administration
- Deployed to admin.csiro-diet.app

### Phase 6: MVP-4 Mobile App (Weeks 19-30, 12 weeks)

**Week 19-20: Foundation**
1. Initialize React Native project (Expo recommended)
2. Set up navigation (React Navigation)
3. Implement authentication flow
4. Create AsyncStorage service
5. Build basic UI components
6. Set up state management (Redux/Zustand)

**Week 21-22: Core Logging**
1. Create device registration endpoints
2. Build HomeScreen with quick log buttons
3. Implement WeightLogScreen
4. Create GlucoseLogScreen
5. Build MealLogScreen
6. Add offline draft storage

**Week 23: Camera Integration**
1. Set up camera permissions
2. Implement CameraScreen
3. Add gallery picker
4. Integrate image compression
5. Test on iOS and Android devices

**Week 24-25: Push Notifications**
1. Set up Firebase Cloud Messaging
2. Implement device registration
3. Build notification preferences UI
4. Create backend notification scheduler
5. Test notifications on both platforms
6. Implement deep linking

**Week 26: Offline Support**
1. Implement draft log sync mechanism
2. Add network status detection
3. Create offline indicators
4. Test offline functionality

**Week 27-28: Polish & Testing**
1. Add app icon and splash screen
2. Create onboarding tutorial
3. Write unit tests
4. Device testing (multiple iOS/Android versions)
5. Performance optimization
6. Add analytics (optional)

**Week 29-30: Deployment**
1. Build iOS app (TestFlight)
2. Build Android app (Google Play Beta)
3. Beta testing with users
4. Fix bugs and gather feedback
5. Submit to App Store and Google Play
6. Release to production

**Deliverables**:
- iOS and Android mobile apps
- Camera-based meal logging
- Push notification reminders
- Published on App Store and Google Play

---

## Critical Files to Create

### Backend (MVP-0/1/2)

1. **backend/database/schema.sql** - Complete database schema (all MVPs)
2. **backend/database/db.js** - SQLite connection and query helpers
3. **backend/server.js** - Express app entry point
4. **backend/services/calculator.service.js** - BMR, BMI, diet level calculations
5. **backend/middleware/auth.middleware.js** - JWT authentication
6. **backend/routes/profile.routes.js** - Profile onboarding and management
7. **backend/routes/tracking.routes.js** - Weight and glucose logging
8. **backend/database/seed.js** - Seed script for food reference data
9. **backend/services/food.service.js** - Food search and alternatives
10. **backend/services/meal.service.js** - Meal logging and history

### Frontend (MVP-0/1/2)

1. **frontend/src/app/layout.tsx** - Root layout with auth protection
2. **frontend/src/lib/api/client.ts** - Axios instance with JWT
3. **frontend/src/app/onboarding/page.tsx** - User onboarding flow
4. **frontend/src/app/dashboard/page.tsx** - Main dashboard
5. **frontend/src/components/tracking/WeightLogForm.tsx** - Weight logging
6. **frontend/src/app/foods/search/page.tsx** - Food search interface
7. **frontend/src/app/meals/log/page.tsx** - Meal logging with images

### Admin Portal (MVP-3)

1. **admin-portal/src/app/layout.tsx** - Admin layout with auth
2. **admin-portal/src/middleware/admin.middleware.ts** - Admin auth check
3. **admin-portal/src/app/recipes/page.tsx** - Recipe list
4. **admin-portal/src/components/recipes/RecipeForm.tsx** - Recipe creation
5. **admin-portal/src/app/foods/page.tsx** - Food management
6. **admin-portal/src/app/users/page.tsx** - User administration

### Mobile App (MVP-4)

1. **mobile-app/src/navigation/AppNavigator.tsx** - Main navigation
2. **mobile-app/src/services/api/client.ts** - API client
3. **mobile-app/src/services/storage/AsyncStorageService.ts** - Local storage
4. **mobile-app/src/services/notifications/NotificationService.ts** - Push notifications
5. **mobile-app/src/screens/camera/CameraScreen.tsx** - Camera integration
6. **mobile-app/src/screens/logging/MealLogScreen.tsx** - Meal logging

---

## Verification & Testing

### MVP-0 Verification
- [ ] User can register and login
- [ ] User can complete onboarding (enter profile data)
- [ ] BMR, BMI, target BMI calculated correctly
- [ ] Diet level suggested based on profile
- [ ] Timeline projection displayed (weeks to target weight)
- [ ] User can log daily weight (one entry per day)
- [ ] User can log glucose readings (2-3 per day)
- [ ] Daily summary shows weight + all glucose readings
- [ ] Weight history chart displays correctly
- [ ] Glucose trend chart displays correctly

### MVP-1 Verification
- [ ] Food database seeded with categories and items
- [ ] Diet levels configured with unit allocations
- [ ] User can search for foods by name
- [ ] User can filter by category
- [ ] User can search meal options (diet level + meal type + category)
- [ ] Alternatives show correct unit equivalents
- [ ] Constraint validation works (can't exceed max units)
- [ ] Food alternatives display properly

### MVP-2 Verification
- [ ] User can create meal log with photos
- [ ] Multiple images upload successfully
- [ ] Images compressed and stored correctly
- [ ] User can rate meals (1-5 stars)
- [ ] User can add notes to meals
- [ ] User can log units of food consumed
- [ ] Total calories calculated automatically
- [ ] Meal history displays with pagination
- [ ] Similar meals algorithm works
- [ ] User can delete meal logs and images

### MVP-3 Verification
- [ ] Admin can login to admin portal
- [ ] Admin dashboard shows stats (users, recipes, foods)
- [ ] Admin can create/edit/delete recipes
- [ ] Recipe form validates required fields
- [ ] Ingredient selector searches food database
- [ ] Recipe images upload successfully
- [ ] Nutrition auto-calculated from ingredients
- [ ] Admin can verify foods
- [ ] Admin can bulk import foods via CSV
- [ ] Admin can view user list with activity metrics
- [ ] Admin can activate/deactivate user accounts
- [ ] Admin can export user data
- [ ] Audit log records all admin actions
- [ ] Public recipe endpoints work for user app

### MVP-4 Verification
- [ ] Mobile app authenticates with backend
- [ ] User can register device for push notifications
- [ ] User can take photos with camera
- [ ] User can select multiple photos from gallery
- [ ] User can log weight quickly
- [ ] User can log glucose quickly
- [ ] User can log meals with photos
- [ ] Images compressed before upload
- [ ] Offline drafts stored in AsyncStorage
- [ ] Drafts sync when app comes online
- [ ] Push notifications arrive on schedule
- [ ] User can customize notification preferences
- [ ] Notification tap navigates to correct screen
- [ ] App works on both iOS and Android
- [ ] App icon and splash screen display correctly

---

## Migration Path to Production (AWS)

When ready to scale beyond personal use:

### Database Migration
1. Export SQLite data to SQL dump
2. Create PostgreSQL RDS instance
3. Modify schema for PostgreSQL (AUTO_INCREMENT → SERIAL)
4. Import data into RDS
5. Update backend connection string

### Image Storage Migration
1. Create S3 bucket (csiro-diet-images)
2. Write migration script to upload existing images
3. Update image service to use AWS SDK
4. Configure CloudFront CDN
5. Update database file_path references

### Authentication Upgrade
1. Set up Google OAuth credentials
2. Add OAuth endpoints to backend
3. Implement OAuth flow in frontend
4. Migrate users gradually (keep JWT fallback)

### Deployment
1. Deploy backend to AWS Elastic Beanstalk or ECS
2. Deploy frontend and admin portal to Vercel
3. Configure custom domains (app.csiro-diet.app, admin.csiro-diet.app)
4. Set up SSL certificates (automatic with Vercel)
5. Configure environment variables for production

---

## Success Criteria

### MVP-0 Success
- You can track your weight and glucose daily
- System accurately calculates your BMR, BMI, and target timeline
- You understand which CSIRO diet level you're on

### MVP-1 Success
- You can find food alternatives that match your meal requirements
- You can plan meals within your diet level constraints
- You discover new food options you didn't know about

### MVP-2 Success
- You log meals with photos regularly
- You can look back at past meals and remember what worked
- You rate meals and use that data to repeat successful choices

### MVP-3 Success
- You (as admin) can add new recipes and foods
- You can manage user accounts if friends join
- Recipe database grows with your discoveries

### MVP-4 Success
- You log meals more frequently (camera is convenient)
- Push notifications remind you to track consistently
- Mobile app becomes your primary interface

### Overall Success
- Your blood sugar levels improve
- You lose weight at a healthy pace toward target
- You feel in control of your pre-diabetes management
- The app eliminates the overwhelm you felt when reading the book

---

## Risk Mitigation

### Risk: CSIRO data extraction is ambiguous
**Mitigation**: Start with best-guess logic based on standard nutritional formulas. Document assumptions. Refine as you use the app and gain clarity.

### Risk: Backend-first means no visual feedback early
**Mitigation**: Test extensively with Postman/Thunder Client. Create comprehensive API tests. Once backend is solid, frontend will move quickly.

### Risk: Scope creep during implementation
**Mitigation**: Stick to the MVP boundaries. Don't add features until current MVP is complete and tested. Use todo lists to track progress.

### Risk: SQLite performance degrades with data growth
**Mitigation**: Use proper indexes. Paginate large result sets. Plan AWS migration when dataset grows beyond 100MB.

### Risk: Time estimates are optimistic
**Mitigation**: Focus on one MVP at a time. Complete backend-first approach ensures solid foundation. You're building for yourself, so perfect is enemy of good.

---

## Next Actions (Week 1 - Day 1)

1. **Extract CSIRO Data** (1-2 hours)
   - Read relevant sections of the book
   - Document diet levels, unit system, BMR formula
   - Create spreadsheet with food unit equivalents

2. **Initialize Backend Project** (2 hours)
   ```bash
   mkdir backend
   cd backend
   npm init -y
   npm install express sqlite3 better-sqlite3 bcrypt jsonwebtoken cors dotenv express-validator helmet winston
   npm install --save-dev nodemon jest supertest
   ```

3. **Create Database Schema** (2-3 hours)
   - Create `backend/database/schema.sql` with all tables
   - Create `backend/database/db.js` for connection
   - Run schema to create database file

4. **Set Up Express Server** (2 hours)
   - Create `backend/server.js`
   - Configure middleware (CORS, helmet, JSON parsing)
   - Set up basic error handling
   - Test with simple health check endpoint

5. **Implement User Registration** (3 hours)
   - Create `backend/routes/auth.routes.js`
   - Implement bcrypt password hashing
   - Create user in database
   - Test with Postman

**End of Day 1**: You should have a running backend that accepts user registration.

---

## Questions & Clarifications

Before starting implementation, confirm:

1. **CSIRO Diet Levels**: How many levels exist? What are the criteria?
2. **Unit System**: Confirmed definitions of 1 bread unit, 1 protein unit, etc.?
3. **Glucose Targets**: What are healthy fasting and post-meal ranges?
4. **Timeline**: Is 26 weeks (6 months) for all MVPs acceptable?
5. **Budget**: Any constraints on AWS costs when migrating to production?

---

## Summary

This plan provides a complete roadmap from zero to production-ready app across all five MVPs. The local-first, backend-first approach ensures you can start using the app quickly for personal benefit, then scale when ready.

**Key Success Factors**:
- Extract CSIRO data accurately before coding
- Complete each MVP fully before moving to next
- Test extensively with yourself as first user
- Document learnings and adjust future MVPs based on real usage
- Maintain focus on solving the overwhelm problem

**Total Timeline**: 26 weeks (~6 months) to complete all MVPs
**First Usable Version**: 10 weeks (MVP-0/1/2 complete with frontend)

Good luck building! 🚀
