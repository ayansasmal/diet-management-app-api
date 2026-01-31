import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';

/**
 * Health check controller for monitoring and Kubernetes probes.
 * All endpoints are public (no authentication required).
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  /**
   * Full health check including database connectivity.
   */
  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Full health check',
    description: 'Check application and database health status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
    schema: {
      example: {
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      },
    },
  })
  @ApiResponse({
    status: 503,
    description: 'Service unavailable',
  })
  check() {
    return this.health.check([
      () =>
        this.prismaHealth.pingCheck('database', this.prisma, {
          timeout: 3000,
        }),
    ]);
  }

  /**
   * Liveness probe - is the application running?
   */
  @Public()
  @Get('live')
  @ApiOperation({
    summary: 'Liveness probe',
    description:
      'Simple check to verify the application is running. Used by Kubernetes liveness probes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is alive',
    schema: {
      example: { status: 'ok' },
    },
  })
  live() {
    return { status: 'ok' };
  }

  /**
   * Readiness probe - is the application ready to receive traffic?
   */
  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness probe',
    description:
      'Check if the application is ready to serve requests. Used by Kubernetes readiness probes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is ready',
  })
  @ApiResponse({
    status: 503,
    description: 'Application is not ready',
  })
  ready() {
    return this.health.check([
      () =>
        this.prismaHealth.pingCheck('database', this.prisma, {
          timeout: 1000,
        }),
    ]);
  }
}
