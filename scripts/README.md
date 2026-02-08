# Scripts

Deployment and build scripts for the Diet Management App backend.

## Main Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `deploy-aws.sh` | AWS deployment orchestrator | `./scripts/deploy-aws.sh <command>` |
| `deploy-local.sh` | Local K8s deployment | `./scripts/deploy-local.sh <command>` |
| `build-push-ghcr.sh` | Docker build + push to GHCR | `./scripts/build-push-ghcr.sh all` |
| `setup-aws-secrets.sh` | Initial AWS Secrets Manager setup | `./scripts/setup-aws-secrets.sh` |
| `ec2-userdata.sh` | EC2 bootstrap (base64 in spot-instance.yaml) | Auto-runs on EC2 launch |

## Deploy Scripts (S3-hosted)

These scripts live in `deploy/` and are uploaded to S3. EC2 downloads them at boot.

| Script | Purpose | When Re-downloaded |
|--------|---------|-------------------|
| `deploy/ec2-setup.sh` | Infrastructure setup (Docker, Caddy, systemd) | On EC2 rebuild only |
| `deploy/start.sh` | App startup (secrets, GHCR login, Docker run) | Every `systemctl restart` |

## deploy-aws.sh Commands

```bash
./scripts/deploy-aws.sh setup-creds    # Configure AWS credentials for Crossplane
./scripts/deploy-aws.sh infra          # Provision all AWS resources
./scripts/deploy-aws.sh update         # Detect changes, upload scripts, rebuild if needed
./scripts/deploy-aws.sh upload-scripts # Upload deploy/ scripts to S3
./scripts/deploy-aws.sh restart-app    # Restart app on EC2 via SSM (no rebuild)
./scripts/deploy-aws.sh associate-eip  # Re-associate Elastic IP with EC2
./scripts/deploy-aws.sh update-secrets # Push secrets to AWS Secrets Manager
./scripts/deploy-aws.sh status         # Check all AWS resource status
```

## S3 Bootstrap Pattern

EC2 user data is a tiny bootstrap (~30 lines) that downloads real scripts from S3:

```
EC2 Boot → ec2-userdata.sh → Downloads ec2-setup.sh from S3 → Runs setup
                            → Creates systemd service
                            → systemd ExecStartPre downloads start.sh from S3
                            → Runs start.sh (pulls Docker image, starts app)
```

**What changed → What to do → EC2 rebuild?**

| Change | Action | Rebuild? |
|--------|--------|----------|
| `start.sh` (env vars, Docker flags) | `upload-scripts` + `restart-app` | No |
| `ec2-setup.sh` (Docker, packages) | `upload-scripts` + EC2 rebuild | Yes |
| EC2 config (AMI, instance type) | Edit `spot-instance.yaml` + rebuild | Yes |
