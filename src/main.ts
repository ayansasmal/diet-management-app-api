import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Bootstrap the NestJS application with Swagger/OpenAPI documentation.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe - transforms and validates all incoming DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if extra properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert types automatically
      },
    }),
  );

  // Enable CORS for frontend development
  app.enableCors();

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Swagger/OpenAPI setup
  const config = new DocumentBuilder()
    .setTitle('Diet Management API')
    .setDescription(
      'API for tracking weight, glucose, and meals with personalized diet management. ' +
        'This API provides endpoints for user authentication, profile management with BMR/BMI calculations, ' +
        'and daily health tracking.',
    )
    .setVersion('1.0.0')
    .addTag('auth', 'Authentication endpoints (register, login)')
    .addTag('users', 'User profile management with health metrics')
    .addTag('tracking', 'Weight and glucose logging')
    .addTag('health', 'Health check endpoints for monitoring')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Serve Swagger UI at /api/docs
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Keep token between page refreshes
    },
  });

  // Serve raw OpenAPI JSON at /api/openapi.json
  app.getHttpAdapter().get('/api/openapi.json', (req, res) => {
    res.json(document);
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
  console.log(`📄 OpenAPI JSON at http://localhost:${port}/api/openapi.json`);
}
bootstrap();
