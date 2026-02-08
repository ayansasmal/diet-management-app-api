#!/bin/bash
# =============================================================================
# EC2 User Data Bootstrap
# =============================================================================
# Tiny bootstrap that installs Docker + jq, then downloads and runs the
# real setup script from S3. This keeps userDataBase64 small and stable;
# infrastructure/app changes go to S3 scripts instead of requiring an
# EC2 rebuild.
#
# Full setup: scripts/deploy/ec2-setup.sh (S3)
# App start:  scripts/deploy/start.sh     (S3)
# =============================================================================

set -e
exec > >(tee /var/log/user-data.log) 2>&1
echo "[$(date)] Starting bootstrap..."

# Install required packages
dnf update -y
dnf install -y docker jq

# Start Docker
systemctl enable docker
systemctl start docker

# Download and run setup from S3
DEPLOY_BUCKET="diet-app-uploads-851112554948"
aws s3 cp "s3://${DEPLOY_BUCKET}/deploy/ec2-setup.sh" /tmp/ec2-setup.sh --region ap-southeast-2
chmod +x /tmp/ec2-setup.sh
/tmp/ec2-setup.sh

echo "[$(date)] Bootstrap complete!"
