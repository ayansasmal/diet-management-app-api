# Diet Management API - Multi-stage Dockerfile
# Optimized for ARM64 (AWS t4g instances) with production NestJS build

# =============================================================================
# Stage 1: Dependencies
# =============================================================================
FROM node:22-alpine AS deps

WORKDIR /app

# Copy package files for caching
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# =============================================================================
# Stage 2: Builder
# =============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copy source code
COPY . .

# Build the NestJS application
RUN npm run build

# Remove devDependencies but keep ones needed for Prisma migrations
# Keep typescript and ts-node for prisma.config.ts support
RUN npm prune --production && \
    npm install --no-save typescript ts-node @types/node

# =============================================================================
# Stage 3: Production Runner
# =============================================================================
FROM node:22-alpine AS runner

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Limit Node.js memory for t4g.micro (1GB RAM)
ENV NODE_OPTIONS="--max-old-space-size=512"

# Copy production dependencies and built application
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/prisma.config.ts ./prisma.config.ts

# Copy and set up entrypoint script
COPY --chown=nestjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check for Docker and orchestrators
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health/live || exit 1

# Start the application via entrypoint (handles DB migrations)
ENTRYPOINT ["./docker-entrypoint.sh"]
