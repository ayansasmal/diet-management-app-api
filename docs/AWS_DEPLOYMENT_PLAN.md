# AWS Backend Deployment Plan

## Summary

Deploy the Diet Management App Backend (NestJS API + PostgreSQL Database) to AWS using the $200 free credits. The API will be tested independently with Newman/Postman before connecting the Vercel-hosted frontend.

**Strategy:** GitHub Actions for CI/CD (simpler than AWS CodePipeline), EC2 for API, RDS PostgreSQL for database

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         VPC (10.0.0.0/16)                           │    │
│  │  ┌─────────────────────────┐    ┌─────────────────────────────┐    │    │
│  │  │    Public Subnet        │    │    Private Subnet            │    │    │
│  │  │    (10.0.1.0/24)        │    │    (10.0.2.0/24)            │    │    │
│  │  │  ┌─────────────────┐    │    │  ┌─────────────────────┐    │    │    │
│  │  │  │   EC2 (t3.micro)│◄───┼────┼──│  RDS PostgreSQL     │    │    │    │
│  │  │  │   NestJS API    │    │    │  │  (db.t3.micro)      │    │    │    │
│  │  │  │   Port 3000     │    │    │  │  Port 5432          │    │    │    │
│  │  │  └────────┬────────┘    │    │  └─────────────────────┘    │    │    │
│  │  │           │              │    │                              │    │    │
│  │  └───────────┼──────────────┘    └──────────────────────────────┘    │    │
│  │              │                                                        │    │
│  │  ┌───────────▼──────────────────────────────────────────────────┐    │    │
│  │  │                 Application Load Balancer                     │    │    │
│  │  │                 (HTTPS termination, SSL cert)                 │    │    │
│  │  └───────────────────────────────────────────────────────────────┘    │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │   S3 Bucket     │  │   CloudWatch    │  │   Secrets Mgr   │              │
│  │   (Future:     │  │   (Logs)        │  │   (Credentials) │              │
│  │   meal photos) │  │                 │  │                 │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
           │
           │ HTTPS (api.yourdomain.com)
           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  External                                                                    │
│  ┌─────────────────┐         ┌─────────────────┐                            │
│  │   Vercel        │         │   Newman/       │                            │
│  │   (Frontend)    │         │   Postman       │                            │
│  │   NEXT_PUBLIC_  │         │   (API Testing) │                            │
│  │   API_URL=...   │         │                 │                            │
│  └─────────────────┘         └─────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CI/CD Decision: GitHub Actions vs AWS CodePipeline

| Aspect | GitHub Actions | AWS CodePipeline |
|--------|---------------|------------------|
| **Complexity** | Simple YAML config | Multiple AWS services (CodeBuild, CodeDeploy) |
| **Learning Curve** | Low (familiar syntax) | High (AWS-specific concepts) |
| **Cost** | Free for public repos, 2000 min/mo for private | ~$1/pipeline/month + CodeBuild costs |
| **Setup Time** | 30 minutes | 2-4 hours |
| **Integration** | Native GitHub, easy secrets | Better AWS integration |
| **Debugging** | Clear logs in GitHub | Scattered across services |

**Recommendation:** GitHub Actions

- You already have code on GitHub
- Simpler to set up and maintain
- Free tier is generous
- Can still deploy to AWS (EC2, ECS, Lambda)

---

## Phase 1: AWS Infrastructure Setup

### Step 1.1: Create VPC and Networking

```bash
# Using AWS CLI (or Console)
# VPC with public + private subnets
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=diet-app-vpc}]'
```

**Required Resources:**
- 1 VPC (10.0.0.0/16)
- 2 Subnets (public: 10.0.1.0/24, private: 10.0.2.0/24)
- 1 Internet Gateway
- 1 NAT Gateway (for private subnet outbound)
- Route tables

### Step 1.2: Create RDS PostgreSQL

```bash
aws rds create-db-instance \
  --db-instance-identifier diet-app-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username dietapp \
  --master-user-password <secure-password> \
  --allocated-storage 20 \
  --vpc-security-group-ids <sg-id> \
  --db-subnet-group-name diet-app-db-subnet \
  --no-publicly-accessible
```

**Free Tier Eligible:**
- db.t3.micro: 750 hours/month free for 12 months
- 20 GB storage included

### Step 1.3: Create EC2 Instance

```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \  # Amazon Linux 2023
  --instance-type t3.micro \
  --key-name diet-app-key \
  --security-group-ids <sg-id> \
  --subnet-id <public-subnet-id> \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=diet-app-api}]'
```

**Free Tier Eligible:**
- t3.micro: 750 hours/month free for 12 months

### Step 1.4: Security Groups

**API Security Group (diet-app-api-sg):**
```
Inbound:
- Port 22 (SSH) from your IP only
- Port 3000 from ALB security group
- Port 443 from ALB security group

Outbound:
- All traffic (for npm, etc.)
```

**RDS Security Group (diet-app-db-sg):**
```
Inbound:
- Port 5432 from API security group only

Outbound:
- None needed
```

---

## Phase 2: Application Deployment

### Step 2.1: EC2 Setup Script

SSH into EC2 and run:

```bash
#!/bin/bash
# Install Node.js 20 LTS
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs git

# Install PM2 globally
sudo npm install -g pm2

# Clone repository
git clone https://github.com/yourusername/low-carb-diet-app.git
cd low-carb-diet-app/backend

# Install dependencies
npm ci --production

# Create .env file
cat > .env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://dietapp:<password>@<rds-endpoint>:5432/diet_management
JWT_SECRET=<secure-jwt-secret>
GOOGLE_CLIENT_ID=<your-google-client-id>
EOF

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# Seed database (first time only)
npm run db:seed

# Start with PM2
pm2 start dist/main.js --name diet-app-api
pm2 save
pm2 startup
```

### Step 2.2: GitHub Actions Workflow

Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to AWS

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - '.github/workflows/deploy-backend.yml'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Run linting
        working-directory: backend
        run: npm run lint

      - name: Build
        working-directory: backend
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd ~/low-carb-diet-app
            git pull origin main
            cd backend
            npm ci --production
            npx prisma generate
            npm run build
            pm2 restart diet-app-api
```

### Step 2.3: GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `EC2_HOST` | EC2 public IP or DNS |
| `EC2_SSH_KEY` | Private SSH key (PEM content) |
| `DATABASE_URL` | RDS connection string |
| `JWT_SECRET` | JWT signing secret |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |

---

## Phase 3: Testing with Newman

### Step 3.1: Update Postman Collection

Update environment variables in `backend/postman/`:

```json
{
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://api.yourdomain.com"
    }
  ]
}
```

### Step 3.2: Run Newman Tests

```bash
# Local testing against AWS
newman run backend/postman/diet-app-api.postman_collection.json \
  --env-var "baseUrl=https://api.yourdomain.com" \
  --reporters cli,json \
  --reporter-json-export newman-results.json
```

### Step 3.3: Add Newman to CI/CD

```yaml
# Add to .github/workflows/deploy-backend.yml
  integration-test:
    needs: deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Newman
        run: npm install -g newman

      - name: Run API tests
        run: |
          newman run backend/postman/diet-app-api.postman_collection.json \
            --env-var "baseUrl=${{ secrets.API_URL }}" \
            --reporters cli
```

---

## Phase 4: Domain & SSL Setup

### Step 4.1: Register/Configure Domain

Options:
1. **Route 53** - Register new domain (~$12/year for .com)
2. **Use existing domain** - Point A record to EC2/ALB

### Step 4.2: SSL Certificate (ACM)

```bash
# Request certificate (free)
aws acm request-certificate \
  --domain-name api.yourdomain.com \
  --validation-method DNS
```

### Step 4.3: Application Load Balancer (Optional but Recommended)

Benefits:
- HTTPS termination
- Health checks
- Easy scaling later

```bash
aws elbv2 create-load-balancer \
  --name diet-app-alb \
  --subnets <public-subnet-1> <public-subnet-2> \
  --security-groups <alb-sg-id>
```

---

## Phase 5: Connect Vercel Frontend

### Step 5.1: Update Frontend Environment

In Vercel dashboard, add environment variable:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

### Step 5.2: Update CORS in Backend

```typescript
// backend/src/main.ts
app.enableCors({
  origin: [
    'http://localhost:3001',
    'https://your-app.vercel.app',
    'https://yourdomain.com',
  ],
  credentials: true,
});
```

### Step 5.3: Update Google OAuth

Add to Google Cloud Console authorized origins:
- `https://your-app.vercel.app`
- `https://yourdomain.com`

---

## Cost Estimate (First 12 Months)

| Service | Free Tier | After Free Tier |
|---------|-----------|-----------------|
| EC2 (t3.micro) | 750 hrs/mo | ~$8.50/mo |
| RDS (db.t3.micro) | 750 hrs/mo | ~$14/mo |
| ALB | 750 hrs/mo | ~$16/mo |
| Data Transfer | 100 GB/mo | ~$0.09/GB |
| S3 (future) | 5 GB | ~$0.023/GB |
| **Total (Free Tier)** | **$0** | - |
| **Total (After)** | - | **~$40/mo** |

With $200 credits: **~5 months of runway** after free tier expires.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `.github/workflows/deploy-backend.yml` | Create | CI/CD pipeline |
| `backend/src/main.ts` | Modify | Update CORS origins |
| `backend/ecosystem.config.js` | Create | PM2 configuration |
| `backend/.env.production.example` | Create | Production env template |
| `docs/AWS_DEPLOYMENT.md` | Create | Deployment documentation |
| `CLAUDE.md` | Update | Add AWS deployment section |

---

## Implementation Sequence

1. **Create AWS Infrastructure** (Manual, ~2 hours)
   - VPC, subnets, security groups
   - RDS PostgreSQL instance
   - EC2 instance

2. **Configure EC2** (Manual, ~1 hour)
   - Install Node.js, PM2
   - Clone repo, set up app
   - Test locally

3. **Set Up GitHub Actions** (~30 minutes)
   - Create workflow file
   - Add secrets to GitHub
   - Test deployment

4. **Configure Domain & SSL** (~1 hour)
   - ACM certificate
   - Optional: ALB setup
   - DNS configuration

5. **Run Newman Tests** (~30 minutes)
   - Update collection
   - Run against AWS
   - Verify all endpoints

6. **Connect Vercel Frontend** (~30 minutes)
   - Update env variables
   - Update CORS
   - End-to-end test

---

## Verification Steps

1. **Infrastructure Health**
   ```bash
   # Check EC2 status
   curl http://<ec2-ip>:3000/api/health

   # Check RDS connectivity (from EC2)
   psql -h <rds-endpoint> -U dietapp -d diet_management -c "SELECT 1"
   ```

2. **API Tests**
   ```bash
   newman run backend/postman/diet-app-api.postman_collection.json \
     --env-var "baseUrl=https://api.yourdomain.com"
   ```

3. **End-to-End**
   - Open Vercel frontend
   - Log in with Google
   - Create/view profile
   - Log weight and glucose readings

---

*Plan created: January 27, 2026*
