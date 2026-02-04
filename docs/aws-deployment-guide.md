# AWS Deployment Guide - Diet Management App

This guide covers deploying the Diet Management API to AWS using Docker Desktop Kubernetes + Crossplane for infrastructure as code.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Cost Summary](#cost-summary)
3. [Prerequisites](#prerequisites)
4. [Phase 1: Local Development Setup](#phase-1-local-development-setup)
5. [Phase 2: AWS Account Setup](#phase-2-aws-account-setup)
6. [Phase 3: Provision AWS Infrastructure](#phase-3-provision-aws-infrastructure)
7. [Phase 4: Deploy Application](#phase-4-deploy-application)
8. [Phase 5: Domain & SSL Setup](#phase-5-domain--ssl-setup)
9. [Phase 6: Connect Frontend](#phase-6-connect-frontend)
10. [Operations & Monitoring](#operations--monitoring)
11. [Troubleshooting](#troubleshooting)
12. [Cost Management](#cost-management)

---

## Architecture Overview

```mermaid
flowchart TB
    subgraph internet["Internet"]
        Users["Users"]
        Vercel["Vercel<br/>(Next.js Frontend)"]
    end

    subgraph aws["AWS (ap-southeast-2)"]
        subgraph vpc["VPC (10.0.0.0/16)"]
            subgraph public["Public Subnet"]
                EC2["Spot EC2 t4g.micro<br/>Docker + NestJS<br/>+ Caddy (HTTPS)<br/>~$2.50/mo"]
            end
            subgraph private["Private Subnet"]
                RDS["RDS db.t4g.micro<br/>PostgreSQL 16<br/>FREE (12 months)"]
            end
        end

        R53["Route 53<br/>api.yourdomain.com"]
        EIP["Elastic IP"]
        S3["S3<br/>Meal photos"]
        CW["CloudWatch<br/>Logs & Alarms"]
        SM["Secrets Manager<br/>Credentials"]
    end

    subgraph github["GitHub (FREE)"]
        GHCR["Container Registry<br/>ghcr.io/ayansasmal/diet-api"]
    end

    Users --> Vercel
    Vercel -->|"API calls"| R53
    R53 --> EIP --> EC2
    EC2 -->|"Prisma"| RDS
    EC2 -.->|"logs"| CW
    EC2 -.->|"secrets"| SM
    EC2 -.->|"docker pull"| GHCR

    style aws fill:#fff3e0
    style github fill:#f0f0f0
    style vpc fill:#e3f2fd
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Spot EC2 (ARM)** | 70-90% cheaper than on-demand (~$2.50/mo vs ~$10/mo) |
| **Caddy over ALB** | Free SSL via Let's Encrypt (saves ~$16/mo) |
| **Single EC2** | Sufficient for personal use, avoids orchestration complexity |
| **RDS over managed DB** | 12 months free tier, no code changes needed |
| **GHCR over ECR** | Free unlimited storage vs ECR's 500MB free tier |
| **Crossplane** | Kubernetes-native IaC, same YAML for local and prod |

---

## Cost Summary

### Year 1 (Free Tier Active)

| Resource | Monthly Cost |
|----------|--------------|
| Spot EC2 t4g.micro | ~$2.50 |
| RDS db.t4g.micro | **$0** (750 hrs/mo free) |
| S3 (5GB) | ~$0.12 |
| Route 53 domain | ~$1 (~$12/year) |
| Elastic IP | **$0** (when attached) |
| **Total** | **~$3-4/mo** |

### Year 2+ (Free Tier Expired)

| Resource | Monthly Cost |
|----------|--------------|
| Spot EC2 t4g.micro | ~$2.50 |
| RDS db.t4g.micro | ~$12 |
| S3 (5GB) | ~$0.12 |
| Route 53 | ~$1 |
| **Total** | **~$15-16/mo** |

---

## Prerequisites

### Local Machine Requirements

1. **Docker Desktop** with Kubernetes enabled
   - Settings → Kubernetes → Enable Kubernetes
   - Allocate at least 4GB RAM to Docker

2. **CLI Tools**
   ```bash
   # Install kubectl (if not included with Docker Desktop)
   brew install kubectl

   # Install Helm
   brew install helm

   # Install AWS CLI
   brew install awscli

   # Verify installations
   kubectl version --client
   helm version
   aws --version
   ```

3. **AWS Account**
   - New account recommended (12-month free tier)
   - Admin IAM user with programmatic access

4. **GitHub Personal Access Token (PAT)**
   - Required for pushing/pulling from GitHub Container Registry (GHCR)
   - Create at: https://github.com/settings/tokens
   - Required scopes: `read:packages`, `write:packages`, `delete:packages`
   - Store securely - you'll add this to AWS Secrets Manager

---

## Phase 1: Local Development Setup

### 1.1 Enable Kubernetes in Docker Desktop

1. Open Docker Desktop
2. Go to Settings → Kubernetes
3. Check "Enable Kubernetes"
4. Click "Apply & Restart"
5. Wait for Kubernetes to start (green indicator)

### 1.2 Verify Kubernetes

```bash
kubectl cluster-info
# Should show: Kubernetes control plane is running at...

kubectl get nodes
# Should show: docker-desktop   Ready   control-plane   ...
```

### 1.3 Run Local Setup Script

```bash
cd backend

# Full local setup (Crossplane, LocalStack, PostgreSQL, app)
./scripts/deploy-local.sh setup

# Or step by step:
./scripts/deploy-local.sh setup   # Install everything
./scripts/deploy-local.sh status  # Check status
./scripts/deploy-local.sh app     # Redeploy app only
./scripts/deploy-local.sh clean   # Tear down
```

### 1.4 Verify Local Deployment

```bash
# Check all pods are running
kubectl get pods -n diet-app

# Test the API
curl http://localhost:30300/api/health
curl http://localhost:30300/api/health/live

# Open Swagger docs
open http://localhost:30300/api/docs
```

---

## Phase 2: AWS Account Setup

### 2.1 Configure AWS CLI

```bash
# Run AWS configure
aws configure

# Enter:
# - AWS Access Key ID: YOUR_ACCESS_KEY
# - AWS Secret Access Key: YOUR_SECRET_KEY
# - Default region: ap-southeast-2
# - Default output format: json

# Verify
aws sts get-caller-identity
```

### 2.2 Create IAM Policy for Crossplane

Crossplane needs permissions to manage AWS resources. Create a policy with these permissions:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:*",
                "rds:*",
                "s3:*",
                "secretsmanager:*",
                "route53:*",
                "iam:*",
                "logs:*"
            ],
            "Resource": "*"
        }
    ]
}
```

**Note:** For production, use more restrictive permissions.

### 2.3 Generate SSH Key for EC2

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "diet-app-aws" -f ~/.ssh/diet-app-aws

# Display public key (you'll need this later)
cat ~/.ssh/diet-app-aws.pub
```

---

## Phase 3: Provision AWS Infrastructure

### 3.1 Setup AWS Credentials for Crossplane

```bash
cd backend

# Configure Crossplane with your AWS credentials
./scripts/deploy-aws.sh setup-creds
```

### 3.2 Update Configuration Files

Before provisioning, update these files with your values:

1. **SSH Public Key** (`k8s/crossplane/spot-instance.yaml`):
   ```yaml
   publicKey: ssh-ed25519 AAAA... your-email@example.com
   ```

2. **S3 Bucket Name** (`k8s/crossplane/s3.yaml`):
   ```yaml
   bucket: diet-app-uploads-ap-southeast-2-YOUR_ACCOUNT_ID
   ```

### 3.3 Provision Infrastructure

```bash
# Provision all AWS resources
./scripts/deploy-aws.sh infra

# This creates:
# - VPC with public/private subnets
# - Security groups
# - RDS PostgreSQL (takes 10-15 minutes)
# - Spot EC2 instance
# - Elastic IP
# - S3 bucket
# - Secrets Manager

# Monitor progress
./scripts/deploy-aws.sh status

# Or watch Crossplane resources
kubectl get managed -w
```

### 3.4 Wait for RDS

RDS takes the longest to provision (~10-15 minutes).

```bash
# Watch RDS status
kubectl get instance.rds diet-app-db -w

# When ready, you'll see:
# NAME          READY   SYNCED   AGE
# diet-app-db   True    True     15m
```

---

## Phase 4: Deploy Application

### 4.1 Build and Push Docker Image

```bash
cd backend

# Build ARM64 image and push to GHCR
./scripts/build-push-ghcr.sh all

# Note the image URL output
```

### 4.2 Get Connection Details

```bash
# Get EC2 IP
kubectl get eip diet-app-eip -o jsonpath='{.status.atProvider.publicIp}'

# Get RDS endpoint
kubectl get instance.rds diet-app-db -o jsonpath='{.status.atProvider.endpoint}'

# Get secrets (from Secrets Manager)
aws secretsmanager get-secret-value \
  --secret-id diet-app/production/secrets \
  --region ap-southeast-2 \
  --query SecretString --output text | jq .
```

### 4.3 SSH to EC2 and Deploy

```bash
# SSH to EC2
EC2_IP=$(kubectl get eip diet-app-eip -o jsonpath='{.status.atProvider.publicIp}')
ssh -i ~/.ssh/diet-app-aws ec2-user@${EC2_IP}

# On EC2: Pull Docker image
# Get GitHub token from secrets
GITHUB_TOKEN=$(aws secretsmanager get-secret-value \
  --secret-id diet-app/production/secrets \
  --region ap-southeast-2 \
  --query SecretString --output text | jq -r '.GITHUB_TOKEN')

# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u ayansasmal --password-stdin

docker pull ghcr.io/ayansasmal/diet-api:latest

# Run container
docker run -d \
  --name diet-api \
  --restart unless-stopped \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://dietapp:PASSWORD@RDS_ENDPOINT:5432/diet_management" \
  -e JWT_SECRET="YOUR_JWT_SECRET" \
  -e GOOGLE_CLIENT_ID="YOUR_CLIENT_ID" \
  -e GOOGLE_CLIENT_SECRET="YOUR_CLIENT_SECRET" \
  -e NODE_ENV=production \
  ghcr.io/ayansasmal/diet-api:latest

# Run database migrations
docker exec diet-api npx prisma db push

# Seed database (optional)
docker exec diet-api npm run db:seed
```

### 4.4 Configure Caddy

```bash
# On EC2: Setup Caddy

# Create Caddyfile
sudo mkdir -p /etc/caddy
sudo tee /etc/caddy/Caddyfile << 'EOF'
api.yourdomain.com {
    reverse_proxy localhost:3000
}
EOF

# Enable and start Caddy
sudo systemctl enable caddy
sudo systemctl start caddy

# Verify Caddy is running
sudo systemctl status caddy
```

### 4.5 Verify Deployment

```bash
# Test HTTP (should redirect to HTTPS)
curl -I http://api.yourdomain.com

# Test HTTPS
curl https://api.yourdomain.com/api/health

# Test with Newman
cd backend
newman run postman/diet-management-api.postman_collection.json \
  --env-var "baseUrl=https://api.yourdomain.com"
```

---

## Phase 5: Domain & SSL Setup

### 5.1 Register Domain (Optional)

If you don't have a domain:

1. Go to AWS Console → Route 53 → Registered domains
2. Register a new domain (e.g., `yourapp.com` ~$12/year)
3. Wait for registration (~15 minutes)

### 5.2 Create DNS Record

```bash
# Get your hosted zone ID from Route 53 Console
# Update k8s/crossplane/route53.yaml with:
# - YOUR_HOSTED_ZONE_ID
# - YOUR_ELASTIC_IP (or get from kubectl)
# - Your domain name

# Apply Route 53 configuration
kubectl apply -f k8s/crossplane/route53.yaml
```

### 5.3 Wait for SSL Certificate

Caddy automatically provisions SSL certificates from Let's Encrypt. This happens when you first access the domain via HTTPS.

```bash
# Monitor Caddy logs for certificate provisioning
sudo journalctl -u caddy -f
```

---

## Phase 6: Connect Frontend

### 6.1 Update Frontend Environment

In your Vercel project settings or `.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
```

### 6.2 Update CORS Settings

In `backend/src/main.ts`, configure CORS for your Vercel domain:

```typescript
app.enableCors({
  origin: [
    'https://your-app.vercel.app',
    'http://localhost:3001',  // Local development
  ],
  credentials: true,
});
```

### 6.3 Redeploy Backend

```bash
# Rebuild and push
./scripts/build-push-ghcr.sh all

# On EC2: Pull and restart
docker pull ghcr.io/ayansasmal/diet-api:latest
docker stop diet-api
docker rm diet-api
docker run -d ... # (same command as before)
```

---

## Operations & Monitoring

### Health Checks

```bash
# API health
curl https://api.yourdomain.com/api/health

# Liveness probe
curl https://api.yourdomain.com/api/health/live

# Readiness probe
curl https://api.yourdomain.com/api/health/ready
```

### View Logs

```bash
# On EC2
docker logs diet-api -f

# Caddy logs
sudo journalctl -u caddy -f
```

### Database Access

```bash
# Connect to RDS from EC2
psql "postgresql://dietapp:PASSWORD@RDS_ENDPOINT:5432/diet_management"

# Or use Prisma Studio (locally with SSH tunnel)
ssh -L 5432:RDS_ENDPOINT:5432 -i ~/.ssh/diet-app-aws ec2-user@EC2_IP
# Then: npx prisma studio
```

### Resource Status

```bash
# Check Crossplane managed resources
kubectl get managed

# Check specific resources
kubectl get vpc,subnet,securitygroup,instance.rds,bucket,eip
```

---

## Troubleshooting

### EC2 Spot Interruption

Spot instances can be interrupted with 2-minute notice. The instance is configured to stop (not terminate) on interruption.

**Auto-recovery:**
```bash
# Check if instance is running
aws ec2 describe-spot-instance-requests \
  --region ap-southeast-2 \
  --query 'SpotInstanceRequests[*].{ID:SpotInstanceRequestId,State:State}'

# Start instance if stopped
aws ec2 start-instances --instance-ids i-xxxxxxxx --region ap-southeast-2
```

### RDS Connection Failed

1. Check security group allows traffic from EC2
2. Verify RDS endpoint is correct
3. Test connectivity:
   ```bash
   nc -zv RDS_ENDPOINT 5432
   ```

### Docker Container Won't Start

```bash
# Check container logs
docker logs diet-api

# Check memory usage (t4g.micro has 1GB)
free -m
docker stats diet-api

# If OOM, increase swap or use smaller instance
```

### SSL Certificate Issues

```bash
# Check Caddy status
sudo systemctl status caddy

# View Caddy logs
sudo journalctl -u caddy -n 100

# Force certificate renewal
sudo caddy reload --config /etc/caddy/Caddyfile
```

### Crossplane Resource Stuck

```bash
# Check resource events
kubectl describe vpc diet-app-vpc

# Check Crossplane provider logs
kubectl logs -n crossplane-system -l pkg.crossplane.io/provider=provider-aws-ec2
```

---

## Cost Management

### Monitor Spending

```bash
# AWS Cost Explorer (CLI)
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-02-01 \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --region us-east-1
```

### Set Budget Alert

1. AWS Console → Billing → Budgets
2. Create budget: $10/month
3. Set alert at 80% threshold

### Reduce Costs Further

1. **Stop RDS when not in use**
   ```bash
   aws rds stop-db-instance --db-instance-identifier diet-app-db
   # Auto-restarts after 7 days
   ```

2. **Use smaller EC2 during testing**
   - t4g.nano (~$1.25/mo) for minimal testing

3. **Delete unused Elastic IPs**
   - Charged ~$0.005/hr when not attached

---

## Quick Reference

### Useful Commands

```bash
# Local K8s
./scripts/deploy-local.sh setup   # Full local setup
./scripts/deploy-local.sh status  # Check status
./scripts/deploy-local.sh clean   # Tear down

# AWS Infrastructure
./scripts/deploy-aws.sh setup-creds    # Configure AWS credentials
./scripts/deploy-aws.sh all            # Full automated deployment (infra + secrets + app)
./scripts/deploy-aws.sh infra          # Provision infrastructure only
./scripts/deploy-aws.sh update         # Detect changes and update (auto Elastic IP association)
./scripts/deploy-aws.sh update-secrets # Update Secrets Manager with RDS endpoint
./scripts/deploy-aws.sh ec2            # Provision/rebuild EC2 only
./scripts/deploy-aws.sh deploy         # Deploy app to EC2 via SSH
./scripts/deploy-aws.sh status         # Check resource status
./scripts/deploy-aws.sh destroy        # DESTROY ALL (dangerous!)

# Docker Image
./scripts/build-push-ghcr.sh all     # Build and push
./scripts/build-push-ghcr.sh info   # Show image info

# Crossplane Resources
kubectl get managed                  # All managed resources
kubectl get vpc,subnet,instance.rds  # Specific resources
kubectl describe instance.rds diet-app-db  # Resource details
```

### Important URLs

| Resource | URL |
|----------|-----|
| API | https://api.yourdomain.com |
| Swagger | https://api.yourdomain.com/api/docs |
| Health | https://api.yourdomain.com/api/health |
| AWS Console | https://ap-southeast-2.console.aws.amazon.com |

---

*Last Updated: February 1, 2026*
