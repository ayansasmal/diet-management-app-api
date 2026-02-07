#!/bin/bash
# =============================================================================
# Deploy Diet Management App to AWS via Crossplane
# =============================================================================
# Prerequisites:
#   - kubectl configured (can use local Docker Desktop K8s)
#   - AWS CLI configured
#   - Crossplane installed (from deploy-local.sh setup)
#   - AWS credentials in Kubernetes secret
#   - .env.prod file with GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
#   - GITHUB_TOKEN in environment (for GHCR access)
#
# Usage:
#   ./scripts/deploy-aws.sh [command]
#
# Quick Start (fully automated):
#   ./scripts/deploy-aws.sh all
#
# Manual Workflow (step by step):
#   1. ./scripts/deploy-aws.sh infra          # VPC + RDS (doesn't wait)
#   2. ./scripts/deploy-aws.sh update-secrets # After RDS is ready
#   3. ./scripts/deploy-aws.sh ec2            # Provision compute
#   4. SSH to EC2 and run: /opt/diet-app/start.sh
#
# Commands:
#   all             - FULL AUTOMATED DEPLOYMENT (waits for each step)
#   update          - DETECT CHANGES and apply (rebuilds EC2 if user data changed)
#   setup-creds     - Configure AWS credentials for Crossplane
#   infra           - Provision VPC, networking, RDS, S3 (no wait)
#   update-secrets  - Update AWS Secrets Manager with RDS endpoint
#   ec2             - Provision EC2 spot instance (after secrets ready)
#   deploy          - Show manual deployment steps for EC2
#   status          - Check AWS resource status
#   destroy         - Destroy all AWS resources (DANGEROUS)
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CROSSPLANE_NAMESPACE="crossplane-system"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_CROSSPLANE_DIR="${SCRIPT_DIR}/../k8s/crossplane"
AWS_REGION="ap-southeast-2"

# Helper functions with timestamps
timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
log_info() { echo -e "${BLUE}[$(timestamp)] [INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[$(timestamp)] [SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[$(timestamp)] [WARN]${NC} $1"; }
log_error() { echo -e "${RED}[$(timestamp)] [ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install AWS CLI."
        exit 1
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Run 'aws configure'."
        exit 1
    fi

    # Check Crossplane is installed
    if ! kubectl get pods -n ${CROSSPLANE_NAMESPACE} &> /dev/null; then
        log_error "Crossplane not installed. Run './scripts/deploy-local.sh setup' first."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Setup AWS credentials for Crossplane
setup_credentials() {
    log_info "Setting up AWS credentials for Crossplane..."

    # Create namespace if not exists
    kubectl create namespace ${CROSSPLANE_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

    # Check if credentials file exists
    AWS_CREDS_FILE="${HOME}/.aws/credentials"
    if [ ! -f "${AWS_CREDS_FILE}" ]; then
        log_error "AWS credentials file not found at ${AWS_CREDS_FILE}"
        log_info "Run 'aws configure' to set up credentials"
        exit 1
    fi

    # Create secret from AWS credentials
    kubectl create secret generic aws-creds-prod \
        --from-file=creds="${AWS_CREDS_FILE}" \
        -n ${CROSSPLANE_NAMESPACE} \
        --dry-run=client -o yaml | kubectl apply -f -

    # Apply provider config
    kubectl apply -f "${K8S_CROSSPLANE_DIR}/provider-config-aws.yaml"

    log_success "AWS credentials configured for Crossplane"
}

# Setup RDS password secret
setup_rds_password() {
    log_info "Setting up RDS password..."

    # Generate a secure password
    RDS_PASSWORD=$(openssl rand -base64 24 | tr -d '/+=' | head -c 20)

    # Create secret
    kubectl create secret generic rds-master-password \
        --from-literal=password="${RDS_PASSWORD}" \
        -n ${CROSSPLANE_NAMESPACE} \
        --dry-run=client -o yaml | kubectl apply -f -

    log_success "RDS password secret created"
    log_warn "Save this password securely: ${RDS_PASSWORD}"
}

# Provision VPC and networking
provision_networking() {
    log_info "Provisioning VPC and networking..."

    kubectl apply -f "${K8S_CROSSPLANE_DIR}/vpc.yaml"

    log_info "Waiting for VPC to be created..."
    sleep 30

    # Check VPC status
    kubectl get vpc,subnet,internetgateway,routetable

    log_success "Networking provisioned"
}

# Provision security groups
provision_security_groups() {
    log_info "Provisioning security groups..."

    kubectl apply -f "${K8S_CROSSPLANE_DIR}/security-groups.yaml"

    log_info "Waiting for security groups..."
    sleep 20

    kubectl get securitygroup,securitygrouprule

    log_success "Security groups provisioned"
}

# Provision RDS
provision_rds() {
    log_info "Provisioning RDS PostgreSQL..."

    setup_rds_password
    kubectl apply -f "${K8S_CROSSPLANE_DIR}/rds.yaml"

    log_info "RDS provisioning started. This takes 10-15 minutes..."
    log_info "Check progress with: kubectl get instance.rds -w"

    # Optional: Wait for RDS
    # kubectl wait --for=condition=ready instance.rds/diet-app-db --timeout=900s

    log_success "RDS provisioning initiated"
}

# Provision S3 bucket
provision_s3() {
    log_info "Provisioning S3 bucket..."

    # Get AWS account ID
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    log_info "AWS Account ID: ${ACCOUNT_ID}"

    # Update S3 manifest with account ID (create temp file)
    sed "s/YOUR_ACCOUNT_ID/${ACCOUNT_ID}/g" "${K8S_CROSSPLANE_DIR}/s3.yaml" | kubectl apply -f -

    log_info "Waiting for S3 bucket..."
    sleep 20

    kubectl get bucket,bucketversioning,bucketserversideencryptionconfiguration

    log_success "S3 bucket provisioned"
}

# Provision Secrets Manager
provision_secrets() {
    log_info "Provisioning Secrets Manager..."

    kubectl apply -f "${K8S_CROSSPLANE_DIR}/secrets.yaml"

    log_info "Waiting for secrets..."
    sleep 20

    log_warn "Remember to update secret values in AWS Console or via CLI"
    log_success "Secrets Manager provisioned"
}

# Provision Elastic IP
provision_elastic_ip() {
    log_info "Provisioning Elastic IP..."

    kubectl apply -f "${K8S_CROSSPLANE_DIR}/elastic-ip.yaml"

    log_info "Waiting for Elastic IP..."
    sleep 20

    kubectl get eip

    log_success "Elastic IP provisioned"
}

# Provision Spot EC2
# Pass "auto" as first argument to skip SSH key confirmation
provision_ec2() {
    log_info "Provisioning Spot EC2 instance..."

    # Check if SSH key is configured (skip prompt if running in auto mode)
    if [ "${1}" != "auto" ]; then
        log_warn "Make sure to update your SSH public key in spot-instance.yaml before applying!"
        read -p "Have you updated your SSH public key? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_error "Please update your SSH public key in k8s/crossplane/spot-instance.yaml"
            exit 1
        fi
    fi

    kubectl apply -f "${K8S_CROSSPLANE_DIR}/spot-instance.yaml"

    log_info "Spot instance request submitted..."
    log_info "Check progress with: kubectl get spotinstancerequest,launchtemplate"

    log_success "EC2 provisioning initiated"
}

# Provision infra only (VPC, networking, RDS, S3)
provision_infra_only() {
    check_prerequisites

    log_info "=== Provisioning AWS Infrastructure ==="

    # Phase 1: Credentials and networking
    setup_credentials
    provision_networking
    provision_security_groups

    # Phase 2: Database (takes 10-15 minutes)
    provision_rds
    provision_s3

    echo ""
    log_success "=== Infrastructure Provisioning Initiated ==="
    log_warn "RDS takes 10-15 minutes to be ready"
    log_info "Once RDS shows 'available', run:"
    log_info "  ./scripts/deploy-aws.sh update-secrets"
    log_info "  ./scripts/deploy-aws.sh ec2"
}

# Wait for RDS to be available
wait_for_rds() {
    log_info "Waiting for RDS to be available (this takes 10-15 minutes)..."

    local max_attempts=40  # 40 * 30s = 20 minutes max
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        RDS_STATUS=$(aws rds describe-db-instances \
            --db-instance-identifier diet-app-db \
            --region ${AWS_REGION} \
            --query 'DBInstances[0].DBInstanceStatus' \
            --output text 2>/dev/null || echo "not-found")

        if [ "${RDS_STATUS}" == "available" ]; then
            log_success "RDS is now available!"
            return 0
        fi

        log_info "RDS status: ${RDS_STATUS} (attempt ${attempt}/${max_attempts}, checking again in 30s...)"
        sleep 30
        attempt=$((attempt + 1))
    done

    log_error "Timeout waiting for RDS. Current status: ${RDS_STATUS}"
    return 1
}

# Associate Elastic IP with EC2 instance via Crossplane EIPAssociation
associate_elastic_ip() {
    log_info "Associating Elastic IP with EC2 instance via Crossplane..."

    # Get the EC2 instance ID from active spot request
    local INSTANCE_ID=$(aws ec2 describe-spot-instance-requests \
        --region ${AWS_REGION} \
        --filters "Name=tag:Name,Values=diet-app-spot" "Name=state,Values=active" \
        --query 'SpotInstanceRequests[0].InstanceId' \
        --output text 2>/dev/null)

    if [ -z "${INSTANCE_ID}" ] || [ "${INSTANCE_ID}" = "None" ]; then
        log_warn "EC2 instance not found. Skipping EIP association."
        return 1
    fi

    # Apply EIPAssociation manifest with instance ID substituted
    sed "s/INSTANCE_ID/${INSTANCE_ID}/g" "${K8S_CROSSPLANE_DIR}/eip-association.yaml" \
        | kubectl apply -f -

    # Wait for Crossplane to reconcile the association
    log_info "Waiting for EIP association to sync..."
    local max_wait=10
    for i in $(seq 1 ${max_wait}); do
        local synced=$(kubectl get eipassociation diet-app-eip-assoc \
            -o jsonpath='{.status.conditions[?(@.type=="Synced")].status}' 2>/dev/null)
        if [ "${synced}" = "True" ]; then
            break
        fi
        sleep 5
    done

    # Get the public IP from the EIP
    local PUBLIC_IP=$(aws ec2 describe-addresses \
        --region ${AWS_REGION} \
        --filters "Name=tag:Name,Values=diet-app-eip" \
        --query 'Addresses[0].PublicIp' \
        --output text 2>/dev/null)

    log_success "Elastic IP ${PUBLIC_IP} associated with instance ${INSTANCE_ID}"
    echo "${PUBLIC_IP}"
}

# Wait for EC2 spot instance to be running
wait_for_ec2() {
    log_info "Waiting for EC2 spot instance to be running..."

    local max_attempts=20  # 20 * 15s = 5 minutes max
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        # Get instance ID from ACTIVE spot request only (filter out cancelled/terminated)
        INSTANCE_ID=$(aws ec2 describe-spot-instance-requests \
            --region ${AWS_REGION} \
            --filters "Name=tag:Name,Values=diet-app-spot" "Name=state,Values=active" \
            --query 'SpotInstanceRequests[0].InstanceId' \
            --output text 2>/dev/null || echo "None")

        if [ "${INSTANCE_ID}" != "None" ] && [ -n "${INSTANCE_ID}" ]; then
            # Check instance state
            INSTANCE_STATE=$(aws ec2 describe-instances \
                --instance-ids "${INSTANCE_ID}" \
                --region ${AWS_REGION} \
                --query 'Reservations[0].Instances[0].State.Name' \
                --output text 2>/dev/null || echo "pending")

            if [ "${INSTANCE_STATE}" == "running" ]; then
                EC2_IP=$(aws ec2 describe-instances \
                    --instance-ids "${INSTANCE_ID}" \
                    --region ${AWS_REGION} \
                    --query 'Reservations[0].Instances[0].PublicIpAddress' \
                    --output text 2>/dev/null)
                log_success "EC2 instance is running! IP: ${EC2_IP}"
                return 0
            fi
            log_info "EC2 state: ${INSTANCE_STATE} (attempt ${attempt}/${max_attempts}, checking again in 15s...)"
        else
            log_info "Spot request pending... (attempt ${attempt}/${max_attempts}, checking again in 15s...)"
        fi

        sleep 15
        attempt=$((attempt + 1))
    done

    log_error "Timeout waiting for EC2"
    return 1
}

# Full automated deployment
provision_all() {
    check_prerequisites

    log_info "=============================================="
    log_info "  FULL AUTOMATED AWS DEPLOYMENT"
    log_info "=============================================="
    echo ""

    # Phase 1: Credentials and networking
    log_info ">>> Phase 1: Setting up credentials and networking..."
    setup_credentials
    provision_networking
    provision_security_groups

    # Phase 2: Database and storage
    log_info ">>> Phase 2: Provisioning RDS and S3..."
    provision_rds
    provision_s3

    # Phase 3: Wait for RDS
    log_info ">>> Phase 3: Waiting for RDS..."
    if ! wait_for_rds; then
        log_error "Failed waiting for RDS. Run './scripts/deploy-aws.sh status' to check"
        exit 1
    fi

    # Phase 4: Update secrets with RDS endpoint
    log_info ">>> Phase 4: Updating secrets with RDS endpoint..."
    update_secrets

    # Phase 5: Provision compute
    log_info ">>> Phase 5: Provisioning EC2 and Elastic IP..."
    provision_secrets
    provision_elastic_ip
    provision_ec2 auto  # Skip SSH key prompt in automated mode

    # Phase 6: Wait for EC2
    log_info ">>> Phase 6: Waiting for EC2..."
    if ! wait_for_ec2; then
        log_warn "EC2 may still be starting. Check with './scripts/deploy-aws.sh status'"
    fi

    # Phase 7: Associate Elastic IP
    log_info ">>> Phase 7: Associating Elastic IP..."
    ELASTIC_IP=$(associate_elastic_ip)

    echo ""
    log_success "=============================================="
    log_success "  DEPLOYMENT COMPLETE!"
    log_success "=============================================="
    echo ""

    # Get Elastic IP (stable) or fall back to instance IP
    if [ -n "${ELASTIC_IP}" ]; then
        log_info "Elastic IP (stable): ${ELASTIC_IP}"
        log_info "API URL: http://${ELASTIC_IP}:3000/api"
    else
        EC2_IP=$(aws ec2 describe-instances \
            --region ${AWS_REGION} \
            --filters "Name=tag:Name,Values=diet-app-spot" "Name=instance-state-name,Values=running" \
            --query 'Reservations[0].Instances[0].PublicIpAddress' \
            --output text 2>/dev/null || echo "pending")
        log_info "EC2 Public IP: ${EC2_IP}"
        log_warn "Elastic IP not associated. IP may change on restart."
    fi

    log_info ""
    log_info "Next steps:"
    log_info "  1. Wait ~3 min for user-data script to complete"
    log_info "  2. Test API: curl http://${ELASTIC_IP:-${EC2_IP}}:3000/api/health/live"
    log_info "  3. SSH if needed: ssh -i ~/.ssh/diet-app-aws ec2-user@${ELASTIC_IP:-${EC2_IP}}"
}

# Provision EC2 and EIP (after secrets are configured)
provision_compute() {
    check_prerequisites

    log_info "=== Provisioning Compute Resources ==="

    # Check if secrets exist in AWS
    if ! aws secretsmanager describe-secret --secret-id "diet-app/production/secrets" --region ${AWS_REGION} &>/dev/null; then
        log_error "Secrets not found in AWS. Run './scripts/deploy-aws.sh update-secrets' first"
        exit 1
    fi

    # Check if RDS is ready
    RDS_STATUS=$(aws rds describe-db-instances \
        --db-instance-identifier diet-app-db \
        --region ${AWS_REGION} \
        --query 'DBInstances[0].DBInstanceStatus' \
        --output text 2>/dev/null || echo "not-found")

    if [ "${RDS_STATUS}" != "available" ]; then
        log_error "RDS is not ready (status: ${RDS_STATUS}). Wait for RDS to be 'available'"
        exit 1
    fi

    provision_secrets
    provision_elastic_ip
    provision_ec2

    echo ""
    log_success "=== Compute Provisioning Complete ==="
    log_info "Once EC2 is running, SSH in and run: /opt/diet-app/start.sh"
}

# Deploy application to EC2
deploy_to_ec2() {
    log_info "Deploying application to EC2..."

    # Get EC2 public IP
    EC2_IP=$(kubectl get spotinstancerequest diet-app-spot \
        -o jsonpath='{.status.atProvider.publicIpAddress}' 2>/dev/null || echo "")

    if [ -z "${EC2_IP}" ]; then
        # Try Elastic IP
        EC2_IP=$(kubectl get eip diet-app-eip \
            -o jsonpath='{.status.atProvider.publicIp}' 2>/dev/null || echo "")
    fi

    if [ -z "${EC2_IP}" ]; then
        log_error "Could not get EC2 IP. Is the instance running?"
        log_info "Check with: kubectl get spotinstancerequest,eip"
        exit 1
    fi

    log_info "EC2 IP: ${EC2_IP}"

    # Get RDS endpoint
    RDS_ENDPOINT=$(kubectl get instance.rds diet-app-db \
        -o jsonpath='{.status.atProvider.endpoint}' 2>/dev/null || echo "")

    if [ -z "${RDS_ENDPOINT}" ]; then
        log_error "RDS endpoint not available. Is RDS ready?"
        log_info "Check with: kubectl get instance.rds diet-app-db"
        exit 1
    fi

    log_info "RDS Endpoint: ${RDS_ENDPOINT}"

    # SSH and deploy (requires SSH key setup)
    log_info "Connecting to EC2..."

    cat << EOF
=== Manual Deployment Steps ===

1. SSH to EC2:
   ssh -i ~/.ssh/diet-app-aws ec2-user@${EC2_IP}

2. Get secrets and login to GHCR:
   SECRETS=\$(aws secretsmanager get-secret-value --secret-id diet-app/production/secrets --region ${AWS_REGION} --query SecretString --output text)
   GITHUB_TOKEN=\$(echo \$SECRETS | jq -r '.GITHUB_TOKEN')
   echo \$GITHUB_TOKEN | docker login ghcr.io -u ayansasmal --password-stdin

3. Pull Docker image from GHCR:
   docker pull ghcr.io/ayansasmal/diet-api:latest

4. Run the container:
   DATABASE_URL=\$(echo \$SECRETS | jq -r '.DATABASE_URL')
   JWT_SECRET=\$(echo \$SECRETS | jq -r '.JWT_SECRET')
   GOOGLE_CLIENT_ID=\$(echo \$SECRETS | jq -r '.GOOGLE_CLIENT_ID')
   GOOGLE_CLIENT_SECRET=\$(echo \$SECRETS | jq -r '.GOOGLE_CLIENT_SECRET')
   FRONTEND_URL=\$(echo \$SECRETS | jq -r '.FRONTEND_URL')

   docker run -d \\
     --name diet-api \\
     --restart unless-stopped \\
     -p 3000:3000 \\
     --log-driver=awslogs \\
     --log-opt awslogs-region=ap-southeast-2 \\
     --log-opt awslogs-group=/diet-app/api \\
     --log-opt awslogs-stream=diet-api \\
     --log-opt awslogs-create-group=true \\
     -e DATABASE_URL="\${DATABASE_URL}" \\
     -e JWT_SECRET="\${JWT_SECRET}" \\
     -e GOOGLE_CLIENT_ID="\${GOOGLE_CLIENT_ID}" \\
     -e GOOGLE_CLIENT_SECRET="\${GOOGLE_CLIENT_SECRET}" \\
     -e FRONTEND_URL="\${FRONTEND_URL}" \\
     -e NODE_ENV=production \\
     ghcr.io/ayansasmal/diet-api:latest

5. Setup Caddy:
   sudo tee /etc/caddy/Caddyfile << 'CADDYEOF'
   api.yourdomain.com {
       reverse_proxy localhost:3000
   }
   CADDYEOF
   sudo systemctl enable caddy
   sudo systemctl start caddy

6. Run migrations:
   docker exec diet-api npx prisma db push
   docker exec diet-api npm run db:seed

=== Or use the automated script ===
   /opt/diet-app/start.sh

=== End Manual Steps ===
EOF

    log_success "See manual deployment steps above"
}

# Check AWS resource status
check_status() {
    check_prerequisites

    echo ""
    log_info "=== AWS Resource Status ==="
    echo ""

    log_info "VPC:"
    kubectl get vpc 2>/dev/null || echo "Not provisioned"
    echo ""

    log_info "Subnets:"
    kubectl get subnet 2>/dev/null || echo "Not provisioned"
    echo ""

    log_info "Security Groups:"
    kubectl get securitygroup 2>/dev/null || echo "Not provisioned"
    echo ""

    log_info "RDS:"
    kubectl get instance.rds 2>/dev/null || echo "Not provisioned"
    echo ""

    log_info "S3:"
    kubectl get bucket 2>/dev/null || echo "Not provisioned"
    echo ""

    log_info "Elastic IP:"
    kubectl get eip 2>/dev/null || echo "Not provisioned"
    echo ""

    log_info "EIP Association:"
    kubectl get eipassociation 2>/dev/null || echo "Not provisioned"
    echo ""

    log_info "EC2 Spot Instance:"
    kubectl get spotinstancerequest,launchtemplate 2>/dev/null || echo "Not provisioned"
    echo ""

    # Get costs estimate
    log_info "=== Estimated Monthly Costs ==="
    log_info "Spot EC2 t4g.micro: ~\$2.50"
    log_info "RDS db.t4g.micro: FREE (Year 1) / ~\$12 (Year 2+)"
    log_info "S3 (5GB): ~\$0.12"
    log_info "Route 53: ~\$1"
    log_info "Total: ~\$3-4/mo (Year 1) / ~\$15-16/mo (Year 2+)"
}

# Destroy all resources
destroy_resources() {
    log_warn "=== DANGER: This will destroy all AWS resources ==="
    log_warn "This includes: VPC, RDS, EC2, S3, all data"
    echo ""
    read -p "Are you absolutely sure? Type 'destroy' to confirm: " confirm

    if [ "${confirm}" != "destroy" ]; then
        log_info "Aborted"
        exit 0
    fi

    log_info "Destroying AWS resources..."

    # Delete in reverse order of dependencies
    kubectl delete -f "${K8S_CROSSPLANE_DIR}/route53.yaml" --ignore-not-found
    kubectl delete -f "${K8S_CROSSPLANE_DIR}/cloudwatch.yaml" --ignore-not-found
    kubectl delete eipassociation diet-app-eip-assoc --ignore-not-found 2>/dev/null || true
    kubectl delete -f "${K8S_CROSSPLANE_DIR}/spot-instance.yaml" --ignore-not-found
    kubectl delete -f "${K8S_CROSSPLANE_DIR}/elastic-ip.yaml" --ignore-not-found
    kubectl delete -f "${K8S_CROSSPLANE_DIR}/secrets.yaml" --ignore-not-found
    kubectl delete -f "${K8S_CROSSPLANE_DIR}/s3.yaml" --ignore-not-found
    kubectl delete -f "${K8S_CROSSPLANE_DIR}/rds.yaml" --ignore-not-found
    kubectl delete -f "${K8S_CROSSPLANE_DIR}/security-groups.yaml" --ignore-not-found
    kubectl delete -f "${K8S_CROSSPLANE_DIR}/vpc.yaml" --ignore-not-found

    # Clean up any remaining Crossplane managed resources (in dependency order)
    log_info "Cleaning up remaining managed resources..."
    kubectl delete securitygrouprule --all --ignore-not-found 2>/dev/null || true
    kubectl delete securitygroup --all --ignore-not-found 2>/dev/null || true
    kubectl delete routetableassociation --all --ignore-not-found 2>/dev/null || true
    kubectl delete route.ec2 --all --ignore-not-found 2>/dev/null || true
    kubectl delete routetable --all --ignore-not-found 2>/dev/null || true
    kubectl delete subnet --all --ignore-not-found 2>/dev/null || true
    kubectl delete internetgateway --all --ignore-not-found 2>/dev/null || true
    kubectl delete vpc --all --ignore-not-found 2>/dev/null || true

    # Delete secrets
    kubectl delete secret rds-master-password -n ${CROSSPLANE_NAMESPACE} --ignore-not-found
    kubectl delete secret diet-app-aws-secrets -n ${CROSSPLANE_NAMESPACE} --ignore-not-found
    kubectl delete secret aws-creds-prod -n ${CROSSPLANE_NAMESPACE} --ignore-not-found

    log_info "Resources deletion initiated. They will be removed from AWS shortly."
    log_info "Check progress with: kubectl get managed"

    log_success "Destroy command completed"
}

# Update secrets with real RDS endpoint and credentials
update_secrets() {
    log_info "Updating secrets with RDS endpoint..."

    # Get RDS endpoint
    RDS_ENDPOINT=$(aws rds describe-db-instances \
        --db-instance-identifier diet-app-db \
        --region ${AWS_REGION} \
        --query 'DBInstances[0].Endpoint.Address' \
        --output text 2>/dev/null)

    if [ -z "${RDS_ENDPOINT}" ] || [ "${RDS_ENDPOINT}" == "None" ]; then
        log_error "RDS endpoint not available. Is RDS ready?"
        log_info "Check with: aws rds describe-db-instances --db-instance-identifier diet-app-db --region ${AWS_REGION}"
        exit 1
    fi

    log_info "RDS Endpoint: ${RDS_ENDPOINT}"

    # Get RDS password from K8s secret
    RDS_PASSWORD=$(kubectl get secret rds-master-password -n ${CROSSPLANE_NAMESPACE} \
        -o jsonpath='{.data.password}' 2>/dev/null | base64 -d)

    if [ -z "${RDS_PASSWORD}" ]; then
        log_error "RDS password not found in K8s secret"
        exit 1
    fi

    log_info "RDS password retrieved from K8s secret"

    # Build DATABASE_URL from RDS
    DATABASE_URL="postgresql://dietapp:${RDS_PASSWORD}@${RDS_ENDPOINT}:5432/diet_management"
    log_info "Built DATABASE_URL: postgresql://dietapp:****@${RDS_ENDPOINT}:5432/diet_management"

    # Load credentials from environment variables first, then fall back to .env.prod or .env
    # Priority: Environment Variable > .env.prod > .env

    if [ -n "${GOOGLE_CLIENT_ID}" ] && [ -n "${GOOGLE_CLIENT_SECRET}" ]; then
        log_info "Using GOOGLE credentials from environment variables"
    else
        ENV_PROD_FILE="${SCRIPT_DIR}/../.env.prod"
        ENV_FILE="${SCRIPT_DIR}/../.env"

        if [ -f "${ENV_PROD_FILE}" ]; then
            # Try .env.prod first (may have env var references that expand)
            source "${ENV_PROD_FILE}" 2>/dev/null || true
            log_info "Loaded config from .env.prod"
        fi

        # If still not set, try .env as fallback
        if [ -z "${GOOGLE_CLIENT_ID}" ] && [ -f "${ENV_FILE}" ]; then
            GOOGLE_CLIENT_ID=$(grep '^GOOGLE_CLIENT_ID=' "${ENV_FILE}" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
            GOOGLE_CLIENT_SECRET=$(grep '^GOOGLE_CLIENT_SECRET=' "${ENV_FILE}" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
            log_warn "Loaded GOOGLE credentials from .env (fallback)"
        fi
    fi

    # Validate GOOGLE credentials
    if [ -z "${GOOGLE_CLIENT_ID}" ] || [ -z "${GOOGLE_CLIENT_SECRET}" ]; then
        log_warn "GOOGLE credentials not found. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
    fi

    # JWT_SECRET - generate if not set
    if [ -z "${JWT_SECRET}" ]; then
        JWT_SECRET=$(openssl rand -base64 32)
        log_info "Generated new JWT_SECRET"
    fi

    # GITHUB_TOKEN from environment (usually in .zshrc)
    if [ -z "${GITHUB_TOKEN}" ]; then
        log_warn "GITHUB_TOKEN not found in environment"
        log_info "Set it with: export GITHUB_TOKEN=ghp_your_token"
        GITHUB_TOKEN="CHANGE_ME"
    fi

    # FRONTEND_URL - the Vercel frontend URL for OAuth redirect_uri matching
    FRONTEND_URL="${FRONTEND_URL:-https://diet-management-app-tau.vercel.app}"
    log_info "FRONTEND_URL: ${FRONTEND_URL}"

    # Build the secret JSON
    SECRET_JSON=$(cat <<EOF
{
  "JWT_SECRET": "${JWT_SECRET}",
  "GOOGLE_CLIENT_ID": "${GOOGLE_CLIENT_ID:-CHANGE_ME}",
  "GOOGLE_CLIENT_SECRET": "${GOOGLE_CLIENT_SECRET:-CHANGE_ME}",
  "DATABASE_URL": "${DATABASE_URL}",
  "FRONTEND_URL": "${FRONTEND_URL}",
  "GITHUB_TOKEN": "${GITHUB_TOKEN}"
}
EOF
)

    # Check if secret exists in AWS
    if aws secretsmanager describe-secret --secret-id "diet-app/production/secrets" --region ${AWS_REGION} &>/dev/null; then
        # Update existing secret
        aws secretsmanager put-secret-value \
            --secret-id "diet-app/production/secrets" \
            --secret-string "${SECRET_JSON}" \
            --region ${AWS_REGION}
        log_success "AWS Secrets Manager updated"
    else
        # Create new secret
        aws secretsmanager create-secret \
            --name "diet-app/production/secrets" \
            --secret-string "${SECRET_JSON}" \
            --region ${AWS_REGION}
        log_success "AWS Secrets Manager secret created"
    fi

    # Also update the K8s secret for Crossplane sync
    kubectl create secret generic diet-app-aws-secrets \
        --from-literal=secret-value="${SECRET_JSON}" \
        -n ${CROSSPLANE_NAMESPACE} \
        --dry-run=client -o yaml | kubectl apply -f -

    log_success "K8s secret updated"

    echo ""
    log_success "=== Secrets Updated ==="
    log_info "DATABASE_URL: postgresql://dietapp:****@${RDS_ENDPOINT}:5432/diet_management"
    log_info "JWT_SECRET: (generated)"
    log_info "GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-NOT SET}"
    log_info "FRONTEND_URL: ${FRONTEND_URL}"
    log_warn "If GOOGLE credentials show 'NOT SET', update .env file and re-run"
}

# Checksum file for tracking changes
CHECKSUM_FILE="${SCRIPT_DIR}/../.crossplane-checksums"

# Calculate checksum of a file
get_checksum() {
    md5 -q "$1" 2>/dev/null || md5sum "$1" 2>/dev/null | cut -d' ' -f1
}

# Get stored checksum for a file
get_stored_checksum() {
    local file_key="$1"
    grep "^${file_key}=" "${CHECKSUM_FILE}" 2>/dev/null | cut -d'=' -f2 || echo ""
}

# Store checksum for a file
store_checksum() {
    local file_key="$1"
    local checksum="$2"

    # Create file if not exists
    touch "${CHECKSUM_FILE}"

    # Remove old entry and add new one
    grep -v "^${file_key}=" "${CHECKSUM_FILE}" > "${CHECKSUM_FILE}.tmp" 2>/dev/null || true
    echo "${file_key}=${checksum}" >> "${CHECKSUM_FILE}.tmp"
    mv "${CHECKSUM_FILE}.tmp" "${CHECKSUM_FILE}"
}

# Update stack - detect changes and apply
update_stack() {
    check_prerequisites

    log_info "=============================================="
    log_info "  DETECTING AND APPLYING CHANGES"
    log_info "=============================================="
    echo ""

    local changes_detected=false
    local ec2_needs_rebuild=false

    # List of manifests to check
    declare -a MANIFESTS=(
        "vpc.yaml"
        "security-groups.yaml"
        "rds.yaml"
        "s3.yaml"
        "secrets.yaml"
        "elastic-ip.yaml"
        "spot-instance.yaml"
    )

    # Check each manifest for changes
    for manifest in "${MANIFESTS[@]}"; do
        local file_path="${K8S_CROSSPLANE_DIR}/${manifest}"

        if [ ! -f "${file_path}" ]; then
            log_warn "Manifest not found: ${manifest}"
            continue
        fi

        local current_checksum=$(get_checksum "${file_path}")
        local stored_checksum=$(get_stored_checksum "${manifest}")

        if [ "${current_checksum}" != "${stored_checksum}" ]; then
            changes_detected=true
            log_info "Change detected: ${manifest}"

            # Special handling for spot-instance.yaml - needs EC2 rebuild
            if [ "${manifest}" = "spot-instance.yaml" ]; then
                ec2_needs_rebuild=true
                log_warn "EC2 user data changed - instance will be rebuilt"
            fi
        else
            log_info "No change: ${manifest}"
        fi
    done

    echo ""

    if [ "${changes_detected}" = false ]; then
        log_success "No changes detected. Stack is up to date."
        return 0
    fi

    log_info "Applying changes..."
    echo ""

    # Apply infrastructure changes (kubectl apply is idempotent)
    log_info ">>> Applying infrastructure manifests..."
    kubectl apply -f "${K8S_CROSSPLANE_DIR}/vpc.yaml"
    store_checksum "vpc.yaml" "$(get_checksum "${K8S_CROSSPLANE_DIR}/vpc.yaml")"

    kubectl apply -f "${K8S_CROSSPLANE_DIR}/security-groups.yaml"
    store_checksum "security-groups.yaml" "$(get_checksum "${K8S_CROSSPLANE_DIR}/security-groups.yaml")"

    # RDS - apply but don't wait (already exists)
    kubectl apply -f "${K8S_CROSSPLANE_DIR}/rds.yaml"
    store_checksum "rds.yaml" "$(get_checksum "${K8S_CROSSPLANE_DIR}/rds.yaml")"

    # S3
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    sed "s/YOUR_ACCOUNT_ID/${ACCOUNT_ID}/g" "${K8S_CROSSPLANE_DIR}/s3.yaml" | kubectl apply -f -
    store_checksum "s3.yaml" "$(get_checksum "${K8S_CROSSPLANE_DIR}/s3.yaml")"

    # Secrets
    kubectl apply -f "${K8S_CROSSPLANE_DIR}/secrets.yaml"
    store_checksum "secrets.yaml" "$(get_checksum "${K8S_CROSSPLANE_DIR}/secrets.yaml")"

    # Elastic IP
    kubectl apply -f "${K8S_CROSSPLANE_DIR}/elastic-ip.yaml"
    store_checksum "elastic-ip.yaml" "$(get_checksum "${K8S_CROSSPLANE_DIR}/elastic-ip.yaml")"

    # EC2 - rebuild if user data changed
    if [ "${ec2_needs_rebuild}" = true ]; then
        log_info ">>> Rebuilding EC2 instance..."

        # Delete existing EC2 resources and EIP association
        log_info "Deleting existing EC2 resources..."
        kubectl delete eipassociation diet-app-eip-assoc --ignore-not-found 2>/dev/null || true
        kubectl delete spotinstancerequest diet-app-spot --ignore-not-found --wait=true 2>/dev/null || true
        kubectl delete keypair diet-app-keypair --ignore-not-found 2>/dev/null || true
        kubectl delete instanceprofile diet-app-ec2-profile --ignore-not-found 2>/dev/null || true
        kubectl delete role diet-app-ec2-role --ignore-not-found 2>/dev/null || true
        kubectl delete rolepolicyattachment diet-app-ssm-policy --ignore-not-found 2>/dev/null || true
        kubectl delete rolepolicyattachment diet-app-cloudwatch-policy --ignore-not-found 2>/dev/null || true

        log_info "Waiting for EC2 termination..."
        sleep 45

        # Re-create EC2
        log_info "Creating new EC2 instance..."
        kubectl apply -f "${K8S_CROSSPLANE_DIR}/spot-instance.yaml"
        store_checksum "spot-instance.yaml" "$(get_checksum "${K8S_CROSSPLANE_DIR}/spot-instance.yaml")"

        # Wait for EC2
        log_info "Waiting for EC2 to be ready..."
        if wait_for_ec2; then
            log_success "EC2 rebuilt successfully!"
            # Associate Elastic IP with new instance
            associate_elastic_ip
        else
            log_warn "EC2 may still be starting..."
        fi
    else
        # Just apply (no rebuild needed)
        kubectl apply -f "${K8S_CROSSPLANE_DIR}/spot-instance.yaml"
        store_checksum "spot-instance.yaml" "$(get_checksum "${K8S_CROSSPLANE_DIR}/spot-instance.yaml")"
    fi

    echo ""
    log_success "=============================================="
    log_success "  UPDATE COMPLETE"
    log_success "=============================================="

    # Show status
    check_status
}

# Main
case "${1:-status}" in
    setup-creds)
        check_prerequisites
        setup_credentials
        ;;
    all)
        provision_all
        ;;
    infra)
        provision_infra_only
        ;;
    update-secrets)
        check_prerequisites
        update_secrets
        ;;
    ec2)
        provision_compute
        ;;
    deploy)
        deploy_to_ec2
        ;;
    associate-eip)
        check_prerequisites
        associate_elastic_ip
        ;;
    status)
        check_status
        ;;
    destroy)
        destroy_resources
        ;;
    update)
        update_stack
        ;;
    *)
        log_info "Usage: $0 {all|update|setup-creds|infra|update-secrets|ec2|deploy|associate-eip|status|destroy}"
        log_info ""
        log_info "Quick start:  $0 all           # Full automated deployment"
        log_info "Update:       $0 update        # Detect changes and update stack"
        log_info "EIP:          $0 associate-eip  # Re-associate Elastic IP with EC2"
        exit 1
        ;;
esac
