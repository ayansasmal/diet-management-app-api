import { Module } from '@nestjs/common';
import { WeightController } from './weight/weight.controller';
import { WeightService } from './weight/weight.service';
import { GlucoseController } from './glucose/glucose.controller';
import { GlucoseService } from './glucose/glucose.service';

/**
 * Tracking module for health metrics logging.
 *
 * Features:
 * - Weight tracking (one entry per day)
 * - Glucose tracking (multiple entries per day)
 * - Historical data retrieval with statistics
 */
@Module({
  controllers: [WeightController, GlucoseController],
  providers: [WeightService, GlucoseService],
  exports: [WeightService, GlucoseService],
})
export class TrackingModule {}
