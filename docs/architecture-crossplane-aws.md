# Crossplane CRD to AWS Resource Architecture

This document explains how Kubernetes Custom Resource Definitions (CRDs) managed by Crossplane map to AWS resources and how they reference each other.

---

## Overview: How Crossplane Works

```mermaid
flowchart TB
    subgraph local["YOUR LOCAL MACHINE (Docker Desktop Kubernetes)"]
        subgraph crossplane["Crossplane Controller"]
            ec2p["AWS EC2<br/>Provider"]
            rdsp["AWS RDS<br/>Provider"]
            s3p["AWS S3<br/>Provider"]
            iamp["AWS IAM<br/>Provider"]
        end

        subgraph crds["Kubernetes CRDs (k8s/crossplane/*.yaml)"]
            vpc["vpc.yaml"]
            sg["security-groups.yaml"]
            rds["rds.yaml"]
            spot["spot-instance.yaml"]
            s3["s3.yaml"]
            secrets["secrets.yaml"]
        end

        crossplane --> crds
    end

    subgraph aws["AWS CLOUD (ap-southeast-2)"]
        awsres["Actual AWS Resources<br/>VPC, Subnets, RDS, EC2, S3, IAM, etc."]
    end

    crds -->|"AWS API Calls"| aws

    style local fill:#e1f5fe
    style aws fill:#fff3e0
    style crossplane fill:#c8e6c9
```

---

## CRD Dependency Graph

This diagram shows how Crossplane CRDs reference each other using **label selectors**.

```mermaid
flowchart TB
    subgraph networking["NETWORKING LAYER"]
        VPC["VPC<br/>Labels: app=diet-mgmt<br/>CIDR: 10.0.0.0/16"]

        VPC --> IGW["Internet Gateway"]
        VPC --> PubSub["Public Subnet<br/>10.0.1.0/24<br/>type=public"]
        VPC --> PrivSubA["Private Subnet A<br/>10.0.10.0/24<br/>type=private"]
        VPC --> PrivSubB["Private Subnet B<br/>10.0.11.0/24<br/>type=private"]

        IGW --> RT["Route Table"]
        RT --> Route["Route<br/>0.0.0.0/0 → IGW"]
        PubSub --> RTA["Route Table<br/>Association"]
        RT --> RTA
    end

    subgraph security["SECURITY LAYER"]
        VPC --> EC2SG["EC2 Security Group<br/>tier=web<br/>Ports: 22, 80, 443"]
        VPC --> RDSSG["RDS Security Group<br/>tier=database<br/>Port: 5432"]

        EC2SG -->|"sourceSecurityGroupId"| RDSSG
    end

    subgraph compute["COMPUTE LAYER"]
        KeyPair["Key Pair<br/>(SSH public key)"]

        IAMRole["IAM Role"] --> IAMProfile["Instance Profile"]
        IAMRole --> SSMPolicy["SSM Policy"]
        IAMRole --> SecretsPolicy["Secrets Read Policy"]
        IAMRole --> CWPolicy["CloudWatch Logs Policy"]

        KeyPair --> LT["Launch Template"]
        EC2SG --> LT
        IAMProfile --> LT

        LT --> SpotReq["Spot Instance Request"]
        PubSub --> SpotReq

        EIP["Elastic IP"]
        EIP -.->|"Associates with"| SpotReq
    end

    subgraph external["EXTERNAL SERVICES (Non-AWS)"]
        GHCR["GitHub Container Registry<br/>ghcr.io/ayansasmal/diet-api<br/>(FREE)"]
    end

    subgraph database["DATABASE LAYER"]
        PrivSubA --> DBSubnet["DB Subnet Group"]
        PrivSubB --> DBSubnet

        DBSubnet --> RDSInst["RDS Instance<br/>db.t4g.micro<br/>PostgreSQL 16"]
        RDSSG --> RDSInst

        RDSPwd["K8s Secret<br/>rds-master-password"] -->|"passwordSecretRef"| RDSInst
        RDSInst -->|"writeConnectionSecretToRef"| RDSConn["K8s Secret<br/>rds-connection-details"]
    end

    subgraph storage["STORAGE LAYER"]
        S3["S3 Bucket<br/>diet-app-uploads"]
        S3 --> S3Ver["Versioning Config"]
        S3 --> S3Enc["Encryption Config<br/>AES-256"]
        S3 --> S3Pub["Public Access Block"]
        S3 --> S3Life["Lifecycle Config<br/>IA after 90 days"]
    end

    subgraph secrets["SECRETS LAYER"]
        SM["Secrets Manager Secret<br/>JWT_SECRET<br/>GOOGLE_CLIENT_ID<br/>DATABASE_URL"]
        SecretsPolicy -.->|"Allows reading"| SM
    end

    subgraph dns["DNS LAYER"]
        R53["Route 53 Record<br/>api.yourdomain.com"]
        R53 --> EIP
        HC["Health Check<br/>/api/health/live"]
    end

    style networking fill:#e3f2fd
    style security fill:#fce4ec
    style compute fill:#e8f5e9
    style database fill:#fff3e0
    style storage fill:#f3e5f5
    style secrets fill:#e0f2f1
    style dns fill:#fafafa
```

---

## Resource Creation Order

Crossplane automatically determines the correct creation order based on dependencies:

```mermaid
flowchart LR
    subgraph phase1["Phase 1: Foundation"]
        P1A["VPC"]
        P1B["IAM Role"]
        P1C["Key Pair"]
        P1D["S3 Bucket"]
    end

    subgraph phase2["Phase 2: Networking"]
        P2A["Internet Gateway"]
        P2B["Subnets"]
        P2C["Route Tables"]
        P2D["Security Groups"]
    end

    subgraph phase3["Phase 3: Database"]
        P3A["DB Subnet Group"]
        P3B["RDS Instance"]
    end

    subgraph phase4["Phase 4: Compute"]
        P4A["IAM Instance Profile"]
        P4B["Launch Template"]
        P4C["Spot Instance"]
        P4D["Elastic IP"]
    end

    subgraph phase5["Phase 5: DNS"]
        P5A["Route 53 Record"]
        P5B["Health Check"]
    end

    phase1 --> phase2 --> phase3 --> phase4 --> phase5

    style phase1 fill:#c8e6c9
    style phase2 fill:#bbdefb
    style phase3 fill:#ffe0b2
    style phase4 fill:#e1bee7
    style phase5 fill:#f5f5f5
```

---

## Application Architecture (What Runs Where)

```mermaid
flowchart TB
    Internet((Internet))

    subgraph vercel["Vercel (Frontend)"]
        NextJS["Next.js App<br/>your-app.vercel.app"]
    end

    subgraph aws["AWS VPC (10.0.0.0/16)"]
        subgraph public["Public Subnet (10.0.1.0/24)"]
            subgraph ec2["EC2 Spot Instance (t4g.micro ARM)"]
                EIP2["Elastic IP"]
                Caddy["Caddy<br/>:443 HTTPS<br/>Auto SSL via Let's Encrypt"]
                subgraph docker["Docker Container"]
                    NestJS["NestJS API<br/>:3000<br/><br/>/api/auth/*<br/>/api/users/*<br/>/api/meals/*<br/>/api/tracking/*<br/>/api/foods/*<br/>/api/plans/*<br/>/api/health/*"]
                end
            end
        end

        subgraph private["Private Subnets (10.0.10.0/24, 10.0.11.0/24)"]
            subgraph rdsbox["RDS Instance (db.t4g.micro ARM)"]
                PG["PostgreSQL 16<br/>Database: diet_management<br/>User: dietapp<br/>Port: 5432"]
            end
        end

        R53["Route 53<br/>api.yourdomain.com"]
    end

    subgraph services["AWS Services"]
        S3B["S3 Bucket<br/>Meal photos"]
        SMgr["Secrets Manager<br/>App secrets + GITHUB_TOKEN"]
        CWLogs["CloudWatch Logs<br/>/diet-app/api"]
    end

    subgraph github["GitHub (External - FREE)"]
        GHCR2["Container Registry<br/>ghcr.io/ayansasmal/diet-api"]
    end

    Internet --> NextJS
    NextJS -->|"API calls"| R53
    R53 --> EIP2
    EIP2 --> Caddy
    Caddy -->|"reverse proxy"| NestJS
    NestJS -->|"Prisma ORM"| PG
    NestJS -.->|"reads secrets"| SMgr
    NestJS -.->|"uploads"| S3B
    docker -.->|"logs"| CWLogs
    ec2 -.->|"docker pull"| GHCR2

    style aws fill:#fff3e0
    style github fill:#f0f0f0
    style public fill:#e8f5e9
    style private fill:#fce4ec
    style vercel fill:#e3f2fd
    style services fill:#f5f5f5
```

---

## Data Flow: Request/Response

```mermaid
sequenceDiagram
    participant User as User (Browser)
    participant Vercel as Vercel CDN<br/>(Next.js Frontend)
    participant R53 as Route 53
    participant Caddy as Caddy<br/>(EC2)
    participant API as NestJS API<br/>(Docker)
    participant DB as PostgreSQL<br/>(RDS)

    User->>Vercel: 1. Visit app
    Vercel->>User: 2. Return React app

    User->>Vercel: 3. Click "Sign in with Google"
    Vercel->>User: 4. Get Google credential

    User->>Vercel: 5. Submit credential
    Vercel->>R53: 6. POST /api/auth/google
    R53->>Caddy: 7. DNS → Elastic IP
    Caddy->>API: 8. Reverse proxy (HTTPS → HTTP)

    API->>API: 9. Verify Google token
    API->>DB: 10. Find/create user
    DB->>API: 11. Return user data
    API->>API: 12. Generate JWT

    API->>Caddy: 13. Response
    Caddy->>R53: 14. Response
    R53->>Vercel: 15. Response
    Vercel->>User: 16. Store JWT, redirect

    Note over User,DB: Subsequent authenticated requests include JWT in Authorization header
```

---

## Security Group Rules Flow

```mermaid
flowchart LR
    subgraph internet["Internet"]
        Users["Users"]
    end

    subgraph ec2sg["EC2 Security Group"]
        direction TB
        In22["Inbound :22<br/>SSH"]
        In80["Inbound :80<br/>HTTP"]
        In443["Inbound :443<br/>HTTPS"]
        OutAll["Outbound: All"]
    end

    subgraph rdssg["RDS Security Group"]
        direction TB
        In5432["Inbound :5432<br/>PostgreSQL<br/>FROM EC2 SG only"]
    end

    Users -->|"HTTPS"| In443
    Users -->|"SSH"| In22
    In80 -->|"redirects"| In443

    ec2sg -->|"sourceSecurityGroupId"| In5432

    style internet fill:#ffebee
    style ec2sg fill:#e8f5e9
    style rdssg fill:#fff3e0
```

---

## Selector Reference Pattern

Crossplane uses **label selectors** to create references between resources:

```mermaid
flowchart LR
    subgraph sg["security-groups.yaml"]
        SGDef["SecurityGroup<br/>metadata:<br/>  labels:<br/>    app: diet-management<br/>    tier: database"]
    end

    subgraph rds["rds.yaml"]
        RDSDef["RDS Instance<br/>spec:<br/>  vpcSecurityGroupIdSelector:<br/>    matchLabels:<br/>      app: diet-management<br/>      tier: database"]
    end

    SGDef -->|"Crossplane resolves<br/>selector to AWS ID"| RDSDef

    style sg fill:#e8f5e9
    style rds fill:#fff3e0
```

---

## Provider Config Switching (Local vs Production)

```mermaid
flowchart TB
    subgraph manifests["Same CRD Manifests"]
        VPC2["VPC"]
        RDS2["RDS"]
        S32["S3"]
    end

    subgraph local["Local Development"]
        LocalConfig["ProviderConfig: localstack<br/>endpoint: localstack:4566"]
        LocalStack["LocalStack Container<br/>(Fake AWS)"]
    end

    subgraph prod["Production"]
        ProdConfig["ProviderConfig: aws-prod<br/>credentials: ~/.aws/credentials"]
        RealAWS["Real AWS<br/>(ap-southeast-2)"]
    end

    manifests -->|"providerConfigRef: localstack"| LocalConfig
    LocalConfig --> LocalStack

    manifests -->|"providerConfigRef: aws-prod"| ProdConfig
    ProdConfig --> RealAWS

    style manifests fill:#e3f2fd
    style local fill:#e8f5e9
    style prod fill:#fff3e0
```

---

## CRD to AWS Resource Mapping

```mermaid
flowchart LR
    subgraph k8s["Kubernetes CRDs"]
        direction TB
        CRD1["ec2.aws.upbound.io/VPC"]
        CRD2["ec2.aws.upbound.io/Subnet"]
        CRD3["ec2.aws.upbound.io/SecurityGroup"]
        CRD4["ec2.aws.upbound.io/SpotInstanceRequest"]
        CRD5["ec2.aws.upbound.io/EIP"]
        CRD6["rds.aws.upbound.io/Instance"]
        CRD7["s3.aws.upbound.io/Bucket"]
        CRD8["iam.aws.upbound.io/Role"]
        CRD9["secretsmanager.aws.upbound.io/Secret"]
        CRD10["route53.aws.upbound.io/Record"]
    end

    subgraph aws2["AWS Resources"]
        direction TB
        AWS1["AWS VPC"]
        AWS2["AWS VPC Subnet"]
        AWS3["AWS Security Group"]
        AWS4["AWS EC2 Spot Instance"]
        AWS5["AWS Elastic IP"]
        AWS6["AWS RDS Instance"]
        AWS7["AWS S3 Bucket"]
        AWS8["AWS IAM Role"]
        AWS9["AWS Secrets Manager"]
        AWS10["AWS Route 53 Record"]
    end

    CRD1 --> AWS1
    CRD2 --> AWS2
    CRD3 --> AWS3
    CRD4 --> AWS4
    CRD5 --> AWS5
    CRD6 --> AWS6
    CRD7 --> AWS7
    CRD8 --> AWS8
    CRD9 --> AWS9
    CRD10 --> AWS10

    style k8s fill:#e3f2fd
    style aws2 fill:#fff3e0
```

---

## Complete CRD to AWS Resource Mapping Table

| Crossplane CRD | AWS Resource | File |
|----------------|--------------|------|
| `ec2.aws.upbound.io/VPC` | VPC | `vpc.yaml` |
| `ec2.aws.upbound.io/Subnet` | VPC Subnet | `vpc.yaml` |
| `ec2.aws.upbound.io/InternetGateway` | Internet Gateway | `vpc.yaml` |
| `ec2.aws.upbound.io/RouteTable` | Route Table | `vpc.yaml` |
| `ec2.aws.upbound.io/Route` | Route | `vpc.yaml` |
| `ec2.aws.upbound.io/RouteTableAssociation` | Route Table Association | `vpc.yaml` |
| `ec2.aws.upbound.io/SecurityGroup` | Security Group | `security-groups.yaml` |
| `ec2.aws.upbound.io/SecurityGroupRule` | SG Ingress/Egress Rule | `security-groups.yaml` |
| `ec2.aws.upbound.io/KeyPair` | EC2 Key Pair | `spot-instance.yaml` |
| `ec2.aws.upbound.io/LaunchTemplate` | EC2 Launch Template | `spot-instance.yaml` |
| `ec2.aws.upbound.io/SpotInstanceRequest` | EC2 Spot Instance | `spot-instance.yaml` |
| `ec2.aws.upbound.io/EIP` | Elastic IP | `elastic-ip.yaml` |
| `iam.aws.upbound.io/Role` | IAM Role | `spot-instance.yaml` |
| `iam.aws.upbound.io/InstanceProfile` | IAM Instance Profile | `spot-instance.yaml` |
| `iam.aws.upbound.io/RolePolicyAttachment` | IAM Policy Attachment | `spot-instance.yaml` |
| `rds.aws.upbound.io/SubnetGroup` | RDS Subnet Group | `rds.yaml` |
| `rds.aws.upbound.io/Instance` | RDS DB Instance | `rds.yaml` |
| `s3.aws.upbound.io/Bucket` | S3 Bucket | `s3.yaml` |
| `s3.aws.upbound.io/BucketVersioning` | S3 Versioning Config | `s3.yaml` |
| `s3.aws.upbound.io/BucketServerSideEncryptionConfiguration` | S3 Encryption | `s3.yaml` |
| `s3.aws.upbound.io/BucketPublicAccessBlock` | S3 Public Access Block | `s3.yaml` |
| `s3.aws.upbound.io/BucketLifecycleConfiguration` | S3 Lifecycle Rules | `s3.yaml` |
| `secretsmanager.aws.upbound.io/Secret` | Secrets Manager Secret | `secrets.yaml` |
| `secretsmanager.aws.upbound.io/SecretVersion` | Secret Version | `secrets.yaml` |
| `route53.aws.upbound.io/Record` | Route 53 DNS Record | `route53.yaml` |
| `route53.aws.upbound.io/HealthCheck` | Route 53 Health Check | `route53.yaml` |
| `cloudwatchlogs.aws.upbound.io/Group` | CloudWatch Log Group | `cloudwatch.yaml` |
| `cloudwatchlogs.aws.upbound.io/MetricFilter` | CloudWatch Metric Filter | `cloudwatch.yaml` |
| `cloudwatch.aws.upbound.io/MetricAlarm` | CloudWatch Alarm | `cloudwatch.yaml` |
| `sns.aws.upbound.io/Topic` | SNS Topic | `cloudwatch.yaml` |

---

## Logging & Monitoring Architecture

Docker containers send logs to CloudWatch using the `awslogs` driver.

```mermaid
flowchart TB
    subgraph ec2["EC2 Instance"]
        subgraph docker["Docker Containers"]
            NestJS["NestJS Container<br/>stdout/stderr"]
            Caddy2["Caddy Container<br/>access logs"]
        end
        DockerD["Docker Daemon<br/>awslogs driver"]
    end

    subgraph cloudwatch["AWS CloudWatch"]
        subgraph loggroups["Log Groups"]
            APILogs["/diet-app/api<br/>30 day retention"]
            CaddyLogs["/diet-app/caddy<br/>14 day retention"]
        end

        subgraph metrics["Metric Filters"]
            ErrorCount["ErrorCount<br/>pattern: ERROR"]
            Http5xx["Http5xxCount<br/>pattern: status=5*"]
        end

        subgraph alarms["CloudWatch Alarms"]
            HighErrors["High Error Rate<br/>&gt;10 errors/5min"]
            CPUHigh["CPU High<br/>&gt;80% for 10min"]
            Unhealthy["Health Check Failed<br/>3 consecutive"]
        end

        Insights["CloudWatch<br/>Logs Insights<br/>(Query UI)"]
    end

    subgraph notify["Notifications"]
        SNS["SNS Topic<br/>diet-app-alerts"]
        Email["Email<br/>Subscription"]
    end

    NestJS --> DockerD
    Caddy2 --> DockerD
    DockerD -->|"awslogs driver"| APILogs
    DockerD -->|"awslogs driver"| CaddyLogs

    APILogs --> ErrorCount
    APILogs --> Http5xx
    APILogs --> Insights

    ErrorCount --> HighErrors
    HighErrors --> SNS
    CPUHigh --> SNS
    Unhealthy --> SNS
    SNS --> Email

    style ec2 fill:#e8f5e9
    style cloudwatch fill:#fff3e0
    style notify fill:#fce4ec
```

### Log Flow Detail

```mermaid
sequenceDiagram
    participant App as NestJS App
    participant Docker as Docker Daemon
    participant CW as CloudWatch Logs
    participant Filter as Metric Filter
    participant Alarm as CloudWatch Alarm
    participant SNS as SNS Topic
    participant You as Your Email

    App->>Docker: console.log() / console.error()
    Docker->>CW: awslogs driver sends to /diet-app/api

    Note over CW: Logs stored with timestamp

    CW->>Filter: Pattern matching
    Filter->>Filter: ERROR detected → increment ErrorCount

    alt Error threshold exceeded
        Filter->>Alarm: ErrorCount > 10 in 5min
        Alarm->>SNS: Trigger notification
        SNS->>You: Email alert
    end

    Note over You: Query logs via CloudWatch Insights
```

### CloudWatch Alarms Overview

```mermaid
flowchart TB
    subgraph app["Application Alarms"]
        A1["🔴 High Error Rate<br/>&gt;10 errors/5min"]
        A2["🔴 High 5xx Errors<br/>&gt;5 errors/5min"]
        A3["🔴 Database Errors<br/>Any Prisma errors"]
        A4["🟡 Auth Failures<br/>&gt;20 failures/5min"]
        A5["🟡 No Requests<br/>0 requests/15min"]
    end

    subgraph ec2["EC2 Alarms"]
        E1["🟡 CPU High<br/>&gt;80% for 10min"]
        E2["🔴 Status Check Failed<br/>Instance impaired"]
    end

    subgraph rds["RDS Alarms"]
        R1["🟡 CPU High<br/>&gt;80% for 10min"]
        R2["🟡 Storage Low<br/>&lt;2GB remaining"]
        R3["🟡 Memory Low<br/>&lt;100MB freeable"]
        R4["🟡 Connections High<br/>&gt;50 connections"]
    end

    subgraph r53["Route 53 Alarms"]
        H1["🔴 Health Check Failed<br/>/api/health/live down"]
    end

    SNS["📧 SNS Topic<br/>diet-app-alerts"]
    Email["✉️ Your Email"]

    A1 & A2 & A3 --> SNS
    A4 & A5 --> SNS
    E1 & E2 --> SNS
    R1 & R2 & R3 & R4 --> SNS
    H1 --> SNS
    SNS --> Email

    style app fill:#ffebee
    style ec2 fill:#e8f5e9
    style rds fill:#fff3e0
    style r53 fill:#e3f2fd
```

### Alarm Severity Levels

| Severity | Color | Action Required |
|----------|-------|-----------------|
| 🔴 Critical | Red | Immediate - App is down or degraded |
| 🟡 Warning | Yellow | Investigate soon - Potential issue |

### CloudWatch Logs Insights Queries

```sql
-- Find all errors in last hour
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100

-- HTTP 5xx errors with request details
fields @timestamp, @message
| filter @message like /status.*5\d{2}/
| parse @message '"method":"*","url":"*"' as method, url
| stats count() by method, url

-- Slow requests (>1000ms)
fields @timestamp, @message
| filter @message like /responseTime/
| parse @message 'responseTime":*,' as latency
| filter latency > 1000
| sort latency desc
```

### Costs

| Resource | Free Tier | After Free Tier |
|----------|-----------|-----------------|
| Log ingestion | 5GB/mo | $0.50/GB |
| Log storage | 5GB/mo | $0.03/GB/mo |
| Logs Insights queries | 5GB scanned/mo | $0.005/GB scanned |
| Alarms | 10 alarms | $0.10/alarm/mo |

**Estimated logging cost**: ~$1-3/mo for a personal app

---

## Key Concepts

### 1. Label Selectors
Resources reference each other using Kubernetes labels, not hardcoded IDs:
```yaml
vpcIdSelector:
  matchLabels:
    app: diet-management
```

### 2. Provider Config
All resources point to the same `providerConfigRef` which contains AWS credentials:
```yaml
providerConfigRef:
  name: aws-prod  # or 'localstack' for local dev
```

### 3. Cross-Resource References
Some resources write outputs that others can consume:
```yaml
# RDS writes connection details to a K8s secret
writeConnectionSecretToRef:
  name: rds-connection-details
  namespace: diet-app
```

### 4. Reconciliation Loop

```mermaid
flowchart LR
    YAML["Desired State<br/>(YAML in Git)"]
    Crossplane["Crossplane<br/>Controller"]
    AWS3["Actual State<br/>(AWS)"]

    YAML -->|"watches"| Crossplane
    Crossplane -->|"reconciles"| AWS3
    AWS3 -->|"reports status"| Crossplane
    Crossplane -->|"updates status"| YAML

    style YAML fill:#e3f2fd
    style Crossplane fill:#c8e6c9
    style AWS3 fill:#fff3e0
```

Crossplane continuously ensures actual AWS state matches desired YAML state:
- **Create** resources if missing
- **Update** resources if drifted
- **Delete** resources if YAML removed

---

*Last Updated: February 1, 2026*
