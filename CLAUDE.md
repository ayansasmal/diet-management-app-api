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

# Deployment (Local K8s)
./scripts/deploy-local.sh setup   # Full local K8s setup
./scripts/deploy-local.sh status  # Check deployment status
./scripts/deploy-local.sh clean   # Tear down local env

# Deployment (AWS via Crossplane)
./scripts/deploy-aws.sh setup-creds    # Configure AWS credentials
./scripts/deploy-aws.sh infra          # Provision AWS resources
./scripts/deploy-aws.sh update         # Detect changes and apply
./scripts/deploy-aws.sh upload-scripts # Upload deploy scripts to S3
./scripts/deploy-aws.sh restart-app    # Restart app on EC2 via SSM
./scripts/deploy-aws.sh status         # Check AWS resources

# Docker Image (GitHub Container Registry)
./scripts/build-push-ghcr.sh all    # Build ARM64 and push to GHCR
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
- **AWS Deployment Guide** (`docs/aws-deployment-guide.md`)

## AWS Deployment

Infrastructure managed via **Crossplane** (Kubernetes-native IaC):

| Resource | Spec | Cost |
|----------|------|------|
| EC2 | Spot t4g.micro (ARM) | ~$2.50/mo |
| RDS | db.t4g.micro (ARM) | FREE (Year 1) |
| S3 | Meal photos bucket | ~$0.12/mo |
| Route 53 | DNS | ~$1/mo |

```
k8s/
├── local/          # Docker Desktop K8s manifests
│   ├── namespace.yaml
│   ├── postgres-deployment.yaml
│   ├── app-deployment.yaml
│   └── ...
└── crossplane/     # AWS Crossplane manifests
    ├── vpc.yaml
    ├── rds.yaml
    ├── spot-instance.yaml
    └── ...
```

## Related Repository

- [Frontend UI](https://github.com/ayansasmal/diet-management-app-ui)

## S3 Bootstrap Pattern

EC2 setup uses an S3 bootstrap pattern to avoid EC2 rebuilds for script changes:

```
scripts/ec2-userdata.sh     → Tiny bootstrap (base64 in spot-instance.yaml)
scripts/deploy/ec2-setup.sh → Infrastructure setup (uploaded to S3)
scripts/deploy/start.sh     → App start script (uploaded to S3, re-downloaded on every restart)
```

| What changed | Action | EC2 rebuild? |
|---|---|---|
| `start.sh` (env var, Docker flags) | `upload-scripts` + `restart-app` | No |
| `ec2-setup.sh` (Docker, packages) | `upload-scripts` + EC2 rebuild | Yes |
| EC2 config (AMI, instance type) | Edit `spot-instance.yaml` + rebuild | Yes |

## Debugging Tips

1. **Prisma schema changes not reflecting**: Run `npx prisma db push && npx prisma generate`
2. **400 Bad Request**: Check DTOs for required vs optional fields
3. **Auth failures**: Verify Google OAuth credentials match environment
4. **Database connection**: Ensure Docker container is running
5. **Crossplane resource stuck**: Check `kubectl describe <resource>` for events
6. **EC2 spot interrupted**: Instance auto-stops; run `aws ec2 start-instances`

---

_Last Updated: January 31, 2026_
