import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaHealthIndicator } from '@nestjs/terminus';
import { HealthController } from './health.controller';

/**
 * Health module providing liveness and readiness probes.
 *
 * Endpoints:
 * - GET /health - Full health check (database connectivity)
 * - GET /health/live - Liveness probe (app running)
 * - GET /health/ready - Readiness probe (app ready for traffic)
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator],
})
export class HealthModule {}
