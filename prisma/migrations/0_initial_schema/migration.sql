-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "google_id" TEXT NOT NULL,
    "name" TEXT,
    "picture" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" TEXT NOT NULL,
    "height_cm" DOUBLE PRECISION NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "age" INTEGER NOT NULL,
    "sex" TEXT NOT NULL,
    "activity_level" TEXT NOT NULL,
    "target_weight_kg" DOUBLE PRECISION NOT NULL,
    "diet_level" INTEGER NOT NULL,
    "bmr" DOUBLE PRECISION NOT NULL,
    "bmi" DOUBLE PRECISION NOT NULL,
    "target_bmi" DOUBLE PRECISION NOT NULL,
    "daily_calorie_target" DOUBLE PRECISION NOT NULL,
    "estimated_weeks_to_target" INTEGER,
    "theme_preference" TEXT NOT NULL DEFAULT 'system',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "weight_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "log_date" TIMESTAMP(3) NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weight_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "glucose_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "log_date" TIMESTAMP(3) NOT NULL,
    "reading_time" TIMESTAMP(3) NOT NULL,
    "glucose_mmol_l" DOUBLE PRECISION NOT NULL,
    "reading_type" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "glucose_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nutrition_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_description" TEXT NOT NULL,
    "long_description" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'system',
    "created_by_id" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'intermediate',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "source_attribution" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "icon" TEXT,
    "accent_color" TEXT,
    "daily_targets" TEXT NOT NULL,
    "meal_flow" TEXT NOT NULL,
    "rules" TEXT NOT NULL DEFAULT '[]',
    "use_net_carbs" BOOLEAN NOT NULL DEFAULT false,
    "default_serving_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "tips" TEXT,
    "extensions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutrition_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_plan_assignments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "custom_targets" TEXT,
    "disabled_rules" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "target_date" TIMESTAMP(3),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "extensions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "assigned_by_id" TEXT,
    "shared_with" TEXT,

    CONSTRAINT "user_plan_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dietician_clients" (
    "id" TEXT NOT NULL,
    "dietician_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "private_notes" TEXT,
    "can_view_history" BOOLEAN NOT NULL DEFAULT false,
    "can_view_weight" BOOLEAN NOT NULL DEFAULT true,
    "can_view_glucose" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dietician_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "unit_name" TEXT,
    "unit_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand_name" TEXT,
    "description" TEXT,
    "category_id" TEXT NOT NULL,
    "created_by_id" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "search_terms" TEXT,
    "image_url" TEXT,
    "nutrition_label_url" TEXT,
    "barcode" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_servings" (
    "id" TEXT NOT NULL,
    "food_id" TEXT NOT NULL,
    "serving_name" TEXT NOT NULL,
    "serving_size" DOUBLE PRECISION NOT NULL,
    "serving_unit" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_unit_serving" BOOLEAN NOT NULL DEFAULT false,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "fiber" DOUBLE PRECISION,
    "sugar" DOUBLE PRECISION,
    "saturated_fat" DOUBLE PRECISION,
    "sodium" DOUBLE PRECISION,
    "cholesterol" DOUBLE PRECISION,
    "potassium" DOUBLE PRECISION,
    "glycemic_index" INTEGER,
    "glycemic_load" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "food_servings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "meal_date" TIMESTAMP(3) NOT NULL,
    "meal_type" TEXT NOT NULL,
    "meal_time" TIMESTAMP(3),
    "total_calories" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_protein" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_carbs" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_fat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_fiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "photo_url" TEXT,
    "rating" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_food_items" (
    "id" TEXT NOT NULL,
    "meal_id" TEXT NOT NULL,
    "food_id" TEXT,
    "serving_id" TEXT,
    "food_name" TEXT NOT NULL,
    "serving_name" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "fiber" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "is_custom_entry" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meal_food_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "weight_logs_user_id_log_date_idx" ON "weight_logs"("user_id", "log_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "weight_logs_user_id_log_date_key" ON "weight_logs"("user_id", "log_date");

-- CreateIndex
CREATE INDEX "glucose_logs_user_id_log_date_idx" ON "glucose_logs"("user_id", "log_date" DESC);

-- CreateIndex
CREATE INDEX "nutrition_plans_visibility_idx" ON "nutrition_plans"("visibility");

-- CreateIndex
CREATE INDEX "nutrition_plans_is_premium_idx" ON "nutrition_plans"("is_premium");

-- CreateIndex
CREATE INDEX "nutrition_plans_created_by_id_idx" ON "nutrition_plans"("created_by_id");

-- CreateIndex
CREATE INDEX "user_plan_assignments_user_id_is_active_idx" ON "user_plan_assignments"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "user_plan_assignments_assigned_by_id_idx" ON "user_plan_assignments"("assigned_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_plan_assignments_user_id_plan_id_key" ON "user_plan_assignments"("user_id", "plan_id");

-- CreateIndex
CREATE INDEX "dietician_clients_dietician_id_status_idx" ON "dietician_clients"("dietician_id", "status");

-- CreateIndex
CREATE INDEX "dietician_clients_client_id_status_idx" ON "dietician_clients"("client_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "dietician_clients_dietician_id_client_id_key" ON "dietician_clients"("dietician_id", "client_id");

-- CreateIndex
CREATE UNIQUE INDEX "food_categories_name_key" ON "food_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "food_categories_slug_key" ON "food_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "food_items_barcode_key" ON "food_items"("barcode");

-- CreateIndex
CREATE INDEX "food_items_category_id_idx" ON "food_items"("category_id");

-- CreateIndex
CREATE INDEX "food_items_name_idx" ON "food_items"("name");

-- CreateIndex
CREATE INDEX "food_items_is_public_is_verified_idx" ON "food_items"("is_public", "is_verified");

-- CreateIndex
CREATE INDEX "food_items_barcode_idx" ON "food_items"("barcode");

-- CreateIndex
CREATE INDEX "food_servings_food_id_idx" ON "food_servings"("food_id");

-- CreateIndex
CREATE INDEX "food_servings_is_default_idx" ON "food_servings"("is_default");

-- CreateIndex
CREATE INDEX "meal_logs_user_id_meal_date_idx" ON "meal_logs"("user_id", "meal_date" DESC);

-- CreateIndex
CREATE INDEX "meal_logs_user_id_meal_type_idx" ON "meal_logs"("user_id", "meal_type");

-- CreateIndex
CREATE INDEX "meal_food_items_meal_id_idx" ON "meal_food_items"("meal_id");

-- CreateIndex
CREATE INDEX "meal_food_items_food_id_idx" ON "meal_food_items"("food_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weight_logs" ADD CONSTRAINT "weight_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "glucose_logs" ADD CONSTRAINT "glucose_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nutrition_plans" ADD CONSTRAINT "nutrition_plans_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plan_assignments" ADD CONSTRAINT "user_plan_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plan_assignments" ADD CONSTRAINT "user_plan_assignments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "nutrition_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plan_assignments" ADD CONSTRAINT "user_plan_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dietician_clients" ADD CONSTRAINT "dietician_clients_dietician_id_fkey" FOREIGN KEY ("dietician_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dietician_clients" ADD CONSTRAINT "dietician_clients_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_items" ADD CONSTRAINT "food_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "food_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "food_servings" ADD CONSTRAINT "food_servings_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "food_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_logs" ADD CONSTRAINT "meal_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_food_items" ADD CONSTRAINT "meal_food_items_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meal_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_food_items" ADD CONSTRAINT "meal_food_items_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "food_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

