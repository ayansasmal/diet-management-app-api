#!/bin/bash
# =============================================================================
# EC2 User Data Script for Diet Management App
# =============================================================================
# This script runs on first boot and sets up:
# - Docker with CloudWatch logging
# - Diet App start script (pulls secrets from AWS Secrets Manager)
# - Systemd service for auto-start on boot
# =============================================================================

set -e
exec > >(tee /var/log/user-data.log) 2>&1
echo "[$(date)] Starting user data script..."

# Install required packages
echo "[$(date)] Installing packages..."
dnf update -y
dnf install -y docker jq

# Start and enable Docker
echo "[$(date)] Configuring Docker..."
systemctl enable docker
systemctl start docker

# Configure Docker logging to CloudWatch
mkdir -p /etc/docker
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "awslogs",
  "log-opts": {
    "awslogs-region": "ap-southeast-2",
    "awslogs-group": "/diet-app/api",
    "awslogs-create-group": "true"
  }
}
EOF
systemctl restart docker

# Install Docker Compose (ARM64)
echo "[$(date)] Installing Docker Compose..."
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-aarch64 \
  -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose

# Install Caddy (for future HTTPS setup) - optional, non-blocking
echo "[$(date)] Installing Caddy..."
# Caddy copr doesn't support Amazon Linux 2023, install from binary instead
CADDY_VERSION="2.7.6"
curl -sL "https://github.com/caddyserver/caddy/releases/download/v${CADDY_VERSION}/caddy_${CADDY_VERSION}_linux_arm64.tar.gz" -o /tmp/caddy.tar.gz && \
    tar -xzf /tmp/caddy.tar.gz -C /usr/local/bin caddy && \
    chmod +x /usr/local/bin/caddy && \
    rm /tmp/caddy.tar.gz && \
    echo "[$(date)] Caddy installed successfully" || \
    echo "[$(date)] WARNING: Caddy installation failed (non-critical, continuing...)"

# Create app directory
mkdir -p /opt/diet-app

# Create the start script that pulls secrets and runs the container
echo "[$(date)] Creating start script..."
cat > /opt/diet-app/start.sh << 'SCRIPT'
#!/bin/bash
# =============================================================================
# Diet App Start Script
# Pulls secrets from AWS Secrets Manager and starts the Docker container
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

# Run the container
log "Starting container..."
docker run -d \
  --name diet-api \
  --restart unless-stopped \
  -p 3000:3000 \
  -e DATABASE_URL="$DATABASE_URL" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
  -e GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
  -e NODE_ENV=production \
  ghcr.io/ayansasmal/diet-api:latest

log "Container started successfully!"
log "Check logs with: docker logs -f diet-api"
SCRIPT
chmod +x /opt/diet-app/start.sh

# Create systemd service for auto-start on boot
echo "[$(date)] Creating systemd service..."
cat > /etc/systemd/system/diet-app.service << 'SERVICE'
[Unit]
Description=Diet Management API
After=docker.service network-online.target
Requires=docker.service
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/opt/diet-app/start.sh
ExecStop=/usr/bin/docker stop diet-api
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICE

# Enable the service to start on boot
systemctl daemon-reload
systemctl enable diet-app.service

# Start the service now (will pull secrets and run container)
echo "[$(date)] Starting diet-app service..."
systemctl start diet-app.service

echo "[$(date)] User data script completed!"
echo "[$(date)] Check service status: systemctl status diet-app"
echo "[$(date)] Check app logs: docker logs -f diet-api"
