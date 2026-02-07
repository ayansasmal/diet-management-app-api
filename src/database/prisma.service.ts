import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';

/**
 * Builds SSL configuration for PostgreSQL connections.
 * AWS RDS requires SSL; local Docker Postgres does not.
 *
 * In production, DATABASE_SSL_CA must point to a valid CA cert file
 * (e.g., global-bundle.pem). The app will fail to start if the cert is missing.
 *
 * @returns SSL config object for production, undefined for local development
 * @throws Error if DATABASE_SSL_CA is missing or invalid in production
 */
function buildSslConfig():
  | { rejectUnauthorized: boolean; ca: string }
  | undefined {
  if (process.env.NODE_ENV !== 'production') {
    return undefined;
  }

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

  return {
    rejectUnauthorized: true,
    ca: fs.readFileSync(caPath, 'utf-8'),
  };
}

/**
 * Prisma service that manages database connections.
 * Uses PostgreSQL via the Prisma PG adapter (Prisma 7+).
 * Configures SSL automatically for production (AWS RDS).
 *
 * @example
 * ```typescript
 * constructor(private prisma: PrismaService) {}
 *
 * async findUser(id: string) {
 *   return this.prisma.user.findUnique({ where: { id } });
 * }
 * ```
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString = process.env.DATABASE_URL!;
    const ssl = buildSslConfig();
    const adapter = new PrismaPg({ connectionString, ssl });
    super({ adapter });
  }

  /**
   * Connect to database when module initializes.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Disconnect from database when module destroys.
   * Important for graceful shutdown.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
