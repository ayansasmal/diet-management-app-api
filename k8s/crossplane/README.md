# Crossplane AWS Infrastructure

Kubernetes-native IaC manifests for provisioning AWS resources via [Crossplane](https://crossplane.io/).

## Prerequisites

- Docker Desktop with Kubernetes enabled
- Crossplane installed (`helm install crossplane crossplane-stable/crossplane`)
- AWS Provider configured (`provider-config-aws.yaml`)

## Resources

| File | AWS Resource | Purpose |
|------|-------------|---------|
| `vpc.yaml` | VPC, Subnets, IGW, Routes | Network (10.0.0.0/16) |
| `security-groups.yaml` | EC2 + RDS Security Groups | Firewall rules |
| `rds.yaml` | RDS PostgreSQL 16 (db.t4g.micro) | Database (private subnet) |
| `spot-instance.yaml` | EC2 Spot t4g.micro, IAM, KeyPair | Application server |
| `elastic-ip.yaml` | Elastic IP allocation | Static public IP |
| `eip-association.yaml` | EIP ↔ EC2 association | Bind IP to instance |
| `s3.yaml` | S3 bucket | Deploy scripts + uploads |
| `route53.yaml` | DNS A record | Domain → EIP |
| `cloudwatch.yaml` | Log groups + alarms | Monitoring |
| `secrets.yaml` | Secrets Manager | App secrets |
| `provider-config-aws.yaml` | Crossplane AWS provider | Provider auth config |

## Deployment Order

Resources have label-based dependencies. Apply in order:

```bash
# 1. Provider config
kubectl apply -f provider-config-aws.yaml

# 2. Networking
kubectl apply -f vpc.yaml

# 3. Security
kubectl apply -f security-groups.yaml

# 4. Data + Compute
kubectl apply -f rds.yaml
kubectl apply -f s3.yaml
kubectl apply -f spot-instance.yaml

# 5. Networking (post-compute)
kubectl apply -f elastic-ip.yaml
kubectl apply -f eip-association.yaml
kubectl apply -f route53.yaml

# 6. Monitoring
kubectl apply -f cloudwatch.yaml
kubectl apply -f secrets.yaml
```

Or use the deploy script: `../scripts/deploy-aws.sh infra`

## Key Patterns

- **EIP + EC2**: `elastic-ip.yaml` must NOT manage the `instance` field — it conflicts with `eip-association.yaml`. Uses `managementPolicies` excluding `LateInitialize`.
- **S3 Bootstrap**: EC2 downloads setup scripts from S3 at boot (see `scripts/deploy/`).
- **Spot Instances**: `spot-instance.yaml` uses spot pricing (~$2.50/mo vs $7.50 on-demand).

## Checking Status

```bash
kubectl get managed                    # All Crossplane resources
kubectl describe <resource-type> <name>  # Detailed status + events
```
