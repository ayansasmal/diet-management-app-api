import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import appConfig from './config/app.config';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { HealthModule } from './modules/health/health.module';
import { CalculatorModule } from './modules/calculator/calculator.module';
import { PlansModule } from './modules/plans/plans.module';
import { FoodsModule } from './modules/foods/foods.module';
import { MealsModule } from './modules/meals/meals.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

/**
 * Root application module.
 *
 * Features:
 * - Configuration management (environment variables)
 * - Global authentication guard (JWT)
 * - Global exception handling
 * - Response formatting
 * - Request logging
 */
@Module({
  imports: [
    // Configuration module - loads environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: '.env',
    }),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    CalculatorModule,
    TrackingModule,
    PlansModule,
    FoodsModule,
    MealsModule,
    HealthModule,
  ],
  providers: [
    // Global JWT authentication guard
    // All routes require authentication by default
    // Use @Public() decorator to make routes public
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Global exception filter - formats all errors consistently
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    // Global response interceptor - wraps all responses
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },

    // Global logging interceptor - logs request/response times
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
