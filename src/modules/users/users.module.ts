import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CalculatorModule } from '../calculator/calculator.module';

/**
 * Users module for profile management.
 *
 * Features:
 * - Profile creation and updates
 * - Automatic BMR/BMI calculations
 * - CSIRO diet level recommendations
 */
@Module({
  imports: [CalculatorModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
