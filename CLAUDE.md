# Backend — Claude Guide

NestJS API for diet management with PostgreSQL.

## Commands

```bash
npm run start:dev              # Dev server (port 3000)
docker-compose up -d           # Start PostgreSQL
npx prisma db push             # Sync schema
npx prisma generate            # Regenerate client
npm run db:seed                # Seed data
npm run test:api               # Newman API tests
./scripts/build-push-ghcr.sh all    # Build + push Docker image
./scripts/deploy-aws.sh update      # Deploy changes to AWS
./scripts/deploy-aws.sh restart-app # Restart app on EC2
```

## Code Patterns

### Controllers: JwtAuthGuard + @GetUser

```typescript
@Controller('foods')
@UseGuards(JwtAuthGuard)
export class FoodsController {
  @Get()
  search(@Query() query: FoodSearchQueryDto, @GetUser() user: JwtPayload) {
    return this.foodsService.searchFoods(query, user.sub);
  }
}
```

### Services: Inject PrismaService

```typescript
@Injectable()
export class FoodsService {
  constructor(private prisma: PrismaService) {}
}
```

### JSON fields: Stored as strings, parsed in service

```typescript
const rules = JSON.parse(plan.rules) as NutritionRule[];
```

## Modules

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

## Environment

- `DATABASE_URL` — PostgreSQL connection string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth
- `JWT_SECRET` — Token signing
- API docs: http://localhost:3000/api/docs (Swagger)

## AWS

EC2 Spot t4g.micro + RDS db.t4g.micro. S3 bootstrap pattern — see `scripts/README.md`.
