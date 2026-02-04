#!/bin/sh
# Docker entrypoint script for Diet Management API
# Runs database migrations before starting the application

set -e

echo "=== Diet Management API Startup ==="

# Wait for database to be available using Prisma 7 adapter pattern
echo "Waiting for database connection..."
MAX_RETRIES=30
RETRY_COUNT=0

until node -e "
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
prisma.\$connect().then(() => {
  console.log('Database connected');
  prisma.\$disconnect();
  process.exit(0);
}).catch((e) => {
  console.error('Connection failed:', e.message);
  process.exit(1);
});
" 2>&1; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "ERROR: Could not connect to database after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "Database not ready, retrying in 2s... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

# Run Prisma migrations
# Uses prisma migrate deploy which only applies pending migrations
# This is safe to run on every startup - it's idempotent
if [ "$SKIP_MIGRATIONS" = "true" ]; then
  echo "Skipping migrations (SKIP_MIGRATIONS=true)"
else
  echo "Running database migrations..."
  npx prisma migrate deploy 2>&1 || {
    echo "WARNING: Prisma migrate deploy failed, attempting to continue..."
  }
fi

echo "Database setup complete!"

# Start the application
echo "Starting NestJS application..."
exec node dist/src/main.js
