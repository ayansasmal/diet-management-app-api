import { registerAs } from '@nestjs/config';

/**
 * Application configuration loaded from environment variables.
 * Uses NestJS ConfigModule for type-safe configuration.
 */
export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
}));
