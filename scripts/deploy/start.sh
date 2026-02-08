#!/bin/bash
# =============================================================================
# Diet App Start Script
# =============================================================================
# Downloaded from S3 on every systemd service start/restart.
# Pulls secrets from AWS Secrets Manager and starts the Docker container.
#
# S3 location: s3://diet-app-uploads-851112554948/deploy/start.sh
# =============================================================================

set -e
LOG_PREFIX="[diet-app]"
AWS_REGION="ap-southeast-2"
SECRET_ID="diet-app/production/secrets"

log() { echo "$LOG_PREFIX [$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

log "Starting Diet Management API..."

# Pull secrets from AWS Secrets Manager
log "Fetching secrets from AWS Secrets Manager..."
SECRETS=$(aws secretsmanager get-secret-value \
  --secret-id "$SECRET_ID" \
  --region "$AWS_REGION" \
  --query SecretString \
  --output text)

if [ -z "$SECRETS" ]; then
  log "ERROR: Failed to fetch secrets from AWS Secrets Manager"
  exit 1
fi

# Parse secrets
DATABASE_URL=$(echo "$SECRETS" | jq -r '.DATABASE_URL')
JWT_SECRET=$(echo "$SECRETS" | jq -r '.JWT_SECRET')
GOOGLE_CLIENT_ID=$(echo "$SECRETS" | jq -r '.GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET=$(echo "$SECRETS" | jq -r '.GOOGLE_CLIENT_SECRET')
FRONTEND_URL=$(echo "$SECRETS" | jq -r '.FRONTEND_URL // "https://diet-management-app-tau.vercel.app"')
GITHUB_TOKEN=$(echo "$SECRETS" | jq -r '.GITHUB_TOKEN')

log "Secrets loaded successfully"

# Login to GitHub Container Registry
log "Logging into GHCR..."
echo "$GITHUB_TOKEN" | docker login ghcr.io -u ayansasmal --password-stdin

# Pull latest image
log "Pulling latest Docker image..."
docker pull ghcr.io/ayansasmal/diet-api:latest

# Stop and remove existing container if running
log "Stopping existing container (if any)..."
docker stop diet-api 2>/dev/null || true
docker rm diet-api 2>/dev/null || true

# Run the container with RDS CA cert mounted
log "Starting container..."
docker run -d \
  --name diet-api \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /opt/diet-app/certs:/app/certs:ro \
  -e DATABASE_URL="$DATABASE_URL" \
  -e DATABASE_SSL_CA="/app/certs/global-bundle.pem" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
  -e GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
  -e FRONTEND_URL="$FRONTEND_URL" \
  -e NODE_ENV=production \
  ghcr.io/ayansasmal/diet-api:latest

log "Container started successfully!"
log "Check logs with: docker logs -f diet-api"
