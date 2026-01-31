import { Module } from '@nestjs/common';
import { CalculatorController } from './calculator.controller';
import { CalculatorService } from './calculator.service';
import { PrismaModule } from '../../database/prisma.module';

/**
 * Calculator module providing BMR, BMI, and diet level calculations.
 * Used by the Users module to compute health metrics during profile creation.
 * Also exposes HTTP endpoints for retrieving calculated metrics.
 */
@Module({
  imports: [PrismaModule],
  controllers: [CalculatorController],
  providers: [CalculatorService],
  exports: [CalculatorService],
})
export class CalculatorModule {}
