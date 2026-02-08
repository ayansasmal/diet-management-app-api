#!/bin/bash
# =============================================================================
# EC2 Infrastructure Setup Script
# =============================================================================
# Downloaded from S3 by the bootstrap (ec2-userdata.sh) on first boot.
# Sets up Docker, Caddy, CloudWatch logging, RDS CA cert, and the
# systemd service that runs start.sh on every boot/restart.
#
# S3 location: s3://diet-app-uploads-851112554948/deploy/ec2-setup.sh
# =============================================================================

set -e
LOG_PREFIX="[ec2-setup]"
log() { echo "$LOG_PREFIX [$(date '+%Y-%m-%d %H:%M:%S')] $1"; }

DEPLOY_BUCKET="diet-app-uploads-851112554948"
AWS_REGION="ap-southeast-2"

log "Starting infrastructure setup..."

# --- Docker CloudWatch logging ---
log "Configuring Docker CloudWatch logging..."
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

# --- Docker Compose (ARM64) ---
log "Installing Docker Compose..."
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-aarch64 \
  -o /usr/local/bin/docker-compose && chmod +x /usr/local/bin/docker-compose

# --- Caddy (optional, non-blocking) ---
log "Installing Caddy..."
CADDY_VERSION="2.7.6"
curl -sL "https://github.com/caddyserver/caddy/releases/download/v${CADDY_VERSION}/caddy_${CADDY_VERSION}_linux_arm64.tar.gz" -o /tmp/caddy.tar.gz && \
    tar -xzf /tmp/caddy.tar.gz -C /usr/local/bin caddy && \
    chmod +x /usr/local/bin/caddy && \
    rm /tmp/caddy.tar.gz && \
    log "Caddy installed successfully" || \
    log "WARNING: Caddy installation failed (non-critical, continuing...)"

# --- App directory and RDS CA cert ---
mkdir -p /opt/diet-app/certs

log "Downloading RDS CA bundle..."
curl -sL "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem" \
  -o /opt/diet-app/certs/global-bundle.pem
if [ ! -s /opt/diet-app/certs/global-bundle.pem ]; then
  log "ERROR: RDS CA bundle download failed — app will not start without it!"
  exit 1
fi
log "RDS CA bundle downloaded successfully"

# --- Download start.sh from S3 ---
log "Downloading start.sh from S3..."
aws s3 cp "s3://${DEPLOY_BUCKET}/deploy/start.sh" /opt/diet-app/start.sh --region "${AWS_REGION}"
chmod +x /opt/diet-app/start.sh
log "start.sh downloaded successfully"

# --- Systemd service ---
# ExecStartPre re-downloads start.sh from S3 on every restart, so
# updating start.sh in S3 + systemctl restart is enough (no EC2 rebuild).
log "Creating systemd service..."
cat > /etc/systemd/system/diet-app.service << SERVICEEOF
[Unit]
Description=Diet Management API
After=docker.service network-online.target
Requires=docker.service
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStartPre=/usr/bin/aws s3 cp s3://${DEPLOY_BUCKET}/deploy/start.sh /opt/diet-app/start.sh --region ${AWS_REGION}
ExecStartPre=/usr/bin/chmod +x /opt/diet-app/start.sh
ExecStart=/opt/diet-app/start.sh
ExecStop=/usr/bin/docker stop diet-api
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable diet-app.service

# --- Start the service ---
log "Starting diet-app service..."
systemctl start diet-app.service

log "Infrastructure setup complete!"
log "Check service status: systemctl status diet-app"
log "Check app logs: docker logs -f diet-api"
