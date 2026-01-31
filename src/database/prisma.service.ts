import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Prisma service that manages database connections.
 * Uses PostgreSQL via the Prisma PG adapter (Prisma 7+).
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
    const adapter = new PrismaPg({ connectionString });
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
