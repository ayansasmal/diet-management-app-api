#!/bin/bash
# Setup AWS Secrets for Diet App
# Creates Kubernetes secret that Crossplane uses for AWS Secrets Manager
#
# Credentials are sourced from:
#   1. Environment variables (if already set)
#   2. .env file (gitignored, contains local dev secrets)
#
# Required:
#   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_TOKEN
# Optional:
#   JWT_SECRET (auto-generated if not set)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../.env"

# Source .env if it exists (for GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
if [ -f "$ENV_FILE" ]; then
    echo "Sourcing credentials from .env..."
    set -a
    source "$ENV_FILE"
    set +a
fi

# Check required environment variables
MISSING=""
[ -z "$GOOGLE_CLIENT_ID" ] && MISSING="$MISSING GOOGLE_CLIENT_ID"
[ -z "$GOOGLE_CLIENT_SECRET" ] && MISSING="$MISSING GOOGLE_CLIENT_SECRET"
[ -z "$GITHUB_TOKEN" ] && MISSING="$MISSING GITHUB_TOKEN"

if [ -n "$MISSING" ]; then
    echo "ERROR: Missing required variables:$MISSING"
    echo ""
    echo "Either add them to .env or export before running:"
    echo "  export GITHUB_TOKEN='ghp_your_token'"
    exit 1
fi

# Generate JWT_SECRET if not provided
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "Generated new JWT_SECRET"
fi

echo "Creating diet-app-aws-secrets in crossplane-system namespace..."

# Create the secret JSON (DATABASE_URL is set later by deploy-aws.sh update-secrets)
SECRET_JSON=$(cat <<EOF
{
  "JWT_SECRET": "${JWT_SECRET}",
  "GOOGLE_CLIENT_ID": "${GOOGLE_CLIENT_ID}",
  "GOOGLE_CLIENT_SECRET": "${GOOGLE_CLIENT_SECRET}",
  "DATABASE_URL": "PENDING_RDS_ENDPOINT",
  "GITHUB_TOKEN": "${GITHUB_TOKEN}"
}
EOF
)

# Create/update the Kubernetes secret
kubectl create secret generic diet-app-aws-secrets \
  -n crossplane-system \
  --from-literal=secret-value="$SECRET_JSON" \
  --dry-run=client -o yaml | kubectl apply -f -

echo "Secret created successfully!"
echo ""
echo "NOTE: DATABASE_URL is set to placeholder. After RDS is ready, run:"
echo "  ./scripts/deploy-aws.sh update-secrets"
