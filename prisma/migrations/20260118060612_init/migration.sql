-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "height_cm" REAL NOT NULL,
    "weight_kg" REAL NOT NULL,
    "age" INTEGER NOT NULL,
    "sex" TEXT NOT NULL,
    "activity_level" TEXT NOT NULL,
    "target_weight_kg" REAL NOT NULL,
    "diet_level" INTEGER NOT NULL,
    "bmr" REAL NOT NULL,
    "bmi" REAL NOT NULL,
    "target_bmi" REAL NOT NULL,
    "daily_calorie_target" REAL NOT NULL,
    "estimated_weeks_to_target" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "weight_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "log_date" DATETIME NOT NULL,
    "weight_kg" REAL NOT NULL,
    "logged_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "weight_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "glucose_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "log_date" DATETIME NOT NULL,
    "reading_time" DATETIME NOT NULL,
    "glucose_mmol_l" REAL NOT NULL,
    "reading_type" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "glucose_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "weight_logs_user_id_log_date_idx" ON "weight_logs"("user_id", "log_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "weight_logs_user_id_log_date_key" ON "weight_logs"("user_id", "log_date");

-- CreateIndex
CREATE INDEX "glucose_logs_user_id_log_date_idx" ON "glucose_logs"("user_id", "log_date" DESC);
