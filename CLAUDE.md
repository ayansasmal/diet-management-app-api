# Claude AI Integration Guide - Backend API

This document provides context for working with Claude AI on the Diet Management API.

## Project Overview

NestJS backend for personalized diet management with PostgreSQL database.

## Tech Stack

- **Framework**: NestJS 11 with TypeScript strict mode
- **ORM**: Prisma 7 with `@prisma/adapter-pg`
- **Database**: PostgreSQL 16 (via Docker)
- **Auth**: Google OAuth + JWT
- **Docs**: Swagger/OpenAPI

## Common Commands

```bash
# Development
npm run start:dev              # Start with hot reload (port 3000)
npm run build                  # Production build

# Database
docker-compose up -d           # Start PostgreSQL
npx prisma db push             # Sync schema
npx prisma generate            # Regenerate client
npm run db:seed                # Seed initial data

# Testing
npm run test:api               # Newman API tests
npm run test:api:report        # Tests with HTML reports
```

## Code Patterns

### NestJS Controller Pattern
```typescript
@Controller('foods')
@UseGuards(JwtAuthGuard)
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get()
  @ApiOperation({ summary: 'Search foods' })
  search(@Query() query: FoodSearchQueryDto, @GetUser() user: JwtPayload) {
    return this.foodsService.searchFoods(query, user.sub);
  }
}
```

### Prisma Service Pattern
```typescript
@Injectable()
export class FoodsService {
  constructor(private prisma: PrismaService) {}

  async searchFoods(query: FoodSearchQueryDto, userId?: string) {
    return this.prisma.foodItem.findMany({
      where: { ... },
      include: { category: true, servings: true },
    });
  }
}
```

### JSON Fields in Prisma
```typescript
// Complex config stored as JSON strings, parsed in service
const plan = await this.prisma.nutritionPlan.findUnique({ where: { id } });
const rules = JSON.parse(plan.rules) as NutritionRule[];
```

## API Response Patterns

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {}
  }
}
```

## Module Structure

| Module | Prefix | Purpose |
|--------|--------|---------|
| Auth | `/api/auth` | Google OAuth + JWT |
| Users | `/api/users` | Profile CRUD |
| Tracking | `/api/tracking` | Weight & glucose |
| Meals | `/api/meals` | Meal logging |
| Calculator | `/api/calculator` | BMR/BMI |
| Plans | `/api/plans` | Nutrition plans |
| Foods | `/api/foods` | Food database |
| Health | `/api/health` | Health checks |

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection
- `GOOGLE_CLIENT_ID` - OAuth client ID
- `JWT_SECRET` - Token signing secret
- `NODE_ENV` - Environment mode

## Documentation

All project documentation is in the `docs/` folder:
- Architecture diagrams, business requirements, security docs
- API guides: Google Auth, Postman/Newman testing
- Delivery plan, nutrition engine design

## Related Repository

- [Frontend UI](https://github.com/ayansasmal/diet-management-app-ui)

## Debugging Tips

1. **Prisma schema changes not reflecting**: Run `npx prisma db push && npx prisma generate`
2. **400 Bad Request**: Check DTOs for required vs optional fields
3. **Auth failures**: Verify Google OAuth credentials match environment
4. **Database connection**: Ensure Docker container is running

---

_Last Updated: January 31, 2026_
