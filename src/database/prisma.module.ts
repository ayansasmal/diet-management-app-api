import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global Prisma module - makes PrismaService available everywhere
 * without needing to import in each module.
 *
 * The @Global() decorator ensures this is a singleton across the app.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
