# Local Kubernetes Development

Manifests for running the backend stack on Docker Desktop Kubernetes with LocalStack for AWS emulation.

## Prerequisites

- Docker Desktop with Kubernetes enabled
- `kubectl` configured for local cluster
- Helm (for LocalStack + Crossplane)

## Files

| File | Purpose |
|------|---------|
| `namespace.yaml` | `diet-app` namespace |
| `postgres-deployment.yaml` | PostgreSQL 16 pod + service |
| `app-deployment.yaml` | NestJS backend pod |
| `app-service.yaml` | Backend NodePort service |
| `crossplane-provider-aws.yaml` | Crossplane AWS provider for LocalStack |
| `provider-config-local.yaml` | Points Crossplane at LocalStack endpoint |
| `localstack-values.yaml` | Helm values for LocalStack deployment |

## Quick Start

```bash
# Option 1: Use deploy script (recommended)
../../scripts/deploy-local.sh setup

# Option 2: Manual
kubectl apply -f namespace.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f app-deployment.yaml
kubectl apply -f app-service.yaml

# Check status
../../scripts/deploy-local.sh status
```

## LocalStack Integration

LocalStack emulates AWS services locally. Use `awslocal` CLI instead of `aws`:

```bash
# Install LocalStack via Helm
helm install localstack localstack/localstack -f localstack-values.yaml

# Test with awslocal
awslocal s3 ls
awslocal secretsmanager list-secrets
```

## Cleanup

```bash
../../scripts/deploy-local.sh clean
```
