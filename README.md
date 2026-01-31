# Diet Management API

NestJS backend for the Diet Management App - a digital companion for personalized diet management.

## Features

- **Authentication**: Google OAuth with JWT session management
- **User Profiles**: Health metrics calculation (BMR, BMI, TDEE)
- **Tracking**: Weight and glucose logging with daily summaries
- **Nutrition Plans**: Plan-agnostic nutrition engine with rule evaluation
- **Food Database**: Comprehensive food items with categories and servings
- **Meal Logging**: Track meals with food items and nutrition totals
- **API Documentation**: Swagger/OpenAPI at `/api/docs`

## Tech Stack

- **Framework**: NestJS 11 with TypeScript strict mode
- **ORM**: Prisma 7 with PostgreSQL
- **Auth**: Google Identity Services + JWT
- **Docs**: Swagger/OpenAPI auto-generated
- **Testing**: Postman collection with Newman CLI

## Quick Start

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)
- Google OAuth credentials

### Setup

1. **Clone and install dependencies**:
   ```bash
   git clone https://github.com/ayansasmal/diet-management-app-api.git
   cd diet-management-app-api
   npm install
   ```

2. **Start PostgreSQL**:
   ```bash
   docker-compose up -d
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Google OAuth credentials and JWT secret
   ```

4. **Initialize database**:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

5. **Start development server**:
   ```bash
   npm run start:dev
   ```

6. **View API docs**: Open http://localhost:3000/api/docs

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (development/production) | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |

## NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start development server with hot reload |
| `npm run start:prod` | Start production server |
| `npm run build` | Build for production |
| `npm run db:push` | Push Prisma schema to database |
| `npm run db:seed` | Seed database with initial data |
| `npm run test:api` | Run API tests with Newman |
| `npm run test:api:report` | Run tests with HTML/JUnit reports |

## API Modules

| Module | Prefix | Description |
|--------|--------|-------------|
| Auth | `/api/auth` | Google OAuth + JWT authentication |
| Users | `/api/users` | Profile CRUD, plan assignments |
| Tracking | `/api/tracking` | Weight & glucose logging |
| Meals | `/api/meals` | Meal logging with food items |
| Calculator | `/api/calculator` | BMR, TDEE, BMI calculations |
| Plans | `/api/plans` | Nutrition plans CRUD |
| Foods | `/api/foods` | Food database with categories |
| Health | `/api/health` | Liveness & readiness probes |

## Project Structure

```
src/
├── main.ts                     # App entry, Swagger setup
├── app.module.ts               # Root module
├── common/                     # Guards, decorators, filters
├── config/                     # App configuration
├── database/                   # Prisma service
└── modules/
    ├── auth/                   # Google OAuth + JWT
    ├── users/                  # Profile management
    ├── tracking/               # Weight & glucose logging
    ├── calculator/             # Health metrics
    ├── plans/                  # Nutrition plans
    ├── foods/                  # Food database
    ├── meals/                  # Meal logging
    └── health/                 # Health checks
```

## Related Repositories

- [Frontend UI](https://github.com/ayansasmal/diet-management-app-ui) - Next.js frontend
- [Documentation](https://github.com/ayansasmal/low-carb-diet-app) - Architecture & design docs

## License

Private - All rights reserved
