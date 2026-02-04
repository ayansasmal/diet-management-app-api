#!/bin/bash
# =============================================================================
# Deploy Diet Management App to Local Kubernetes (Docker Desktop)
# =============================================================================
# Prerequisites:
#   - Docker Desktop with Kubernetes enabled
#   - kubectl configured
#   - Helm installed
#
# Usage:
#   ./scripts/deploy-local.sh [command]
#
# Commands:
#   setup     - Full setup (Crossplane, LocalStack, PostgreSQL, app)
#   app       - Deploy only the application
#   clean     - Remove all resources
#   status    - Check deployment status
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="diet-app"
CROSSPLANE_NAMESPACE="crossplane-system"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_LOCAL_DIR="${SCRIPT_DIR}/../k8s/local"
LOCALSTACK_PORT="${LOCALSTACK_PORT:-4566}"
LOCALSTACK_HOST="${LOCALSTACK_HOST:-localhost}"

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl not found. Please install kubectl."
        exit 1
    fi

    # Check Kubernetes connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster. Is Docker Desktop Kubernetes running?"
        exit 1
    fi

    # Check helm
    if ! command -v helm &> /dev/null; then
        log_error "helm not found. Please install helm."
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Install Crossplane
install_crossplane() {
    log_info "Installing Crossplane..."

    # Add Crossplane Helm repo
    helm repo add crossplane-stable https://charts.crossplane.io/stable
    helm repo update

    # Create namespace if not exists
    kubectl create namespace ${CROSSPLANE_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

    # Install Crossplane
    helm upgrade --install crossplane crossplane-stable/crossplane \
        --namespace ${CROSSPLANE_NAMESPACE} \
        --wait

    # Wait for Crossplane to be ready
    log_info "Waiting for Crossplane pods..."
    kubectl wait --for=condition=ready pod -l app=crossplane \
        -n ${CROSSPLANE_NAMESPACE} --timeout=120s

    log_success "Crossplane installed successfully"
}

# Install AWS Provider for Crossplane
install_crossplane_aws_provider() {
    log_info "Installing Crossplane AWS Provider..."

    # Wait for Crossplane CRDs to be ready
    sleep 10

    # Apply AWS provider manifests
    kubectl apply -f "${K8S_LOCAL_DIR}/crossplane-provider-aws.yaml"

    # Wait for providers to be healthy
    log_info "Waiting for AWS providers to be ready (this may take 2-3 minutes)..."
    sleep 30

    # Check provider status
    kubectl get providers

    log_success "AWS Provider installed"
}

# Check if LocalStack is already running
check_localstack_running() {
    # Check if LocalStack is accessible via HTTP
    if curl -s "http://${LOCALSTACK_HOST}:${LOCALSTACK_PORT}/_localstack/health" > /dev/null 2>&1; then
        return 0
    fi

    # Check if LocalStack is running as a Docker container
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q -i localstack; then
        return 0
    fi

    # Check if LocalStack is running in K8s
    if kubectl get pod -l app.kubernetes.io/name=localstack -n ${NAMESPACE} 2>/dev/null | grep -q Running; then
        return 0
    fi

    return 1
}

# Install LocalStack (or skip if already running)
install_localstack() {
    log_info "Checking for existing LocalStack instance..."

    if check_localstack_running; then
        log_success "LocalStack already running at ${LOCALSTACK_HOST}:${LOCALSTACK_PORT} - skipping installation"

        # Still create namespace for other resources
        kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

        # Show LocalStack health
        log_info "LocalStack health:"
        curl -s "http://${LOCALSTACK_HOST}:${LOCALSTACK_PORT}/_localstack/health" | head -c 200 || true
        echo ""
        return 0
    fi

    log_info "LocalStack not found - installing via Helm..."

    # Add LocalStack Helm repo
    helm repo add localstack https://localstack.github.io/helm-charts
    helm repo update

    # Install LocalStack in diet-app namespace
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

    helm upgrade --install localstack localstack/localstack \
        --namespace ${NAMESPACE} \
        -f "${K8S_LOCAL_DIR}/localstack-values.yaml" \
        --wait

    # Wait for LocalStack to be ready
    log_info "Waiting for LocalStack to be ready..."
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=localstack \
        -n ${NAMESPACE} --timeout=180s

    log_success "LocalStack installed successfully"
}

# Deploy PostgreSQL
deploy_postgres() {
    log_info "Deploying PostgreSQL..."

    kubectl apply -f "${K8S_LOCAL_DIR}/namespace.yaml"
    kubectl apply -f "${K8S_LOCAL_DIR}/postgres-deployment.yaml"

    # Wait for PostgreSQL to be ready
    log_info "Waiting for PostgreSQL to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres \
        -n ${NAMESPACE} --timeout=120s

    log_success "PostgreSQL deployed successfully"
}

# Build and load Docker image
build_docker_image() {
    log_info "Building Docker image..."

    cd "${SCRIPT_DIR}/.."

    # Build image for local architecture
    docker build -t diet-api:local .

    log_success "Docker image built: diet-api:local"
}

# Deploy application
deploy_app() {
    log_info "Deploying Diet Management API..."

    # Apply deployment and service
    kubectl apply -f "${K8S_LOCAL_DIR}/app-deployment.yaml"
    kubectl apply -f "${K8S_LOCAL_DIR}/app-service.yaml"

    # Wait for app to be ready
    log_info "Waiting for app to be ready..."
    kubectl wait --for=condition=ready pod -l app=diet-api \
        -n ${NAMESPACE} --timeout=120s

    log_success "Application deployed successfully"
}

# Configure Crossplane for LocalStack
configure_localstack_provider() {
    log_info "Configuring Crossplane for LocalStack..."

    kubectl apply -f "${K8S_LOCAL_DIR}/provider-config-local.yaml"

    log_success "LocalStack provider configured"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."

    # Get pod name
    POD=$(kubectl get pod -l app=diet-api -n ${NAMESPACE} -o jsonpath='{.items[0].metadata.name}')

    # Run Prisma migrations
    kubectl exec -n ${NAMESPACE} ${POD} -- npx prisma db push

    log_success "Database migrations completed"
}

# Seed database
seed_database() {
    log_info "Seeding database..."

    # Get pod name
    POD=$(kubectl get pod -l app=diet-api -n ${NAMESPACE} -o jsonpath='{.items[0].metadata.name}')

    # Run seed
    kubectl exec -n ${NAMESPACE} ${POD} -- npm run db:seed || log_warn "Seeding may have failed or already seeded"

    log_success "Database seeding completed"
}

# Check deployment status
check_status() {
    echo ""
    log_info "=== Deployment Status ==="
    echo ""

    log_info "Crossplane System:"
    kubectl get pods -n ${CROSSPLANE_NAMESPACE} 2>/dev/null || echo "Not installed"
    echo ""

    log_info "Diet App Namespace:"
    kubectl get pods -n ${NAMESPACE} 2>/dev/null || echo "Not deployed"
    echo ""

    log_info "Services:"
    kubectl get svc -n ${NAMESPACE} 2>/dev/null || echo "No services"
    echo ""

    # Test health endpoint
    log_info "Testing health endpoint..."
    if curl -s http://localhost:30300/api/health/live > /dev/null 2>&1; then
        log_success "API is healthy: http://localhost:30300/api/health"
        log_info "Swagger docs: http://localhost:30300/api/docs"
    else
        log_warn "API not responding on http://localhost:30300"
    fi
}

# Clean up all resources
cleanup() {
    log_info "Cleaning up all resources..."

    # Delete app resources
    kubectl delete -f "${K8S_LOCAL_DIR}/app-service.yaml" --ignore-not-found
    kubectl delete -f "${K8S_LOCAL_DIR}/app-deployment.yaml" --ignore-not-found
    kubectl delete -f "${K8S_LOCAL_DIR}/postgres-deployment.yaml" --ignore-not-found
    kubectl delete -f "${K8S_LOCAL_DIR}/provider-config-local.yaml" --ignore-not-found

    # Uninstall LocalStack (only if installed via Helm in K8s)
    if helm list -n ${NAMESPACE} 2>/dev/null | grep -q localstack; then
        log_info "Uninstalling LocalStack from K8s..."
        helm uninstall localstack -n ${NAMESPACE} 2>/dev/null || true
    else
        log_info "LocalStack not installed via Helm - skipping"
    fi

    # Delete namespace (this will delete everything in it)
    kubectl delete namespace ${NAMESPACE} --ignore-not-found

    # Uninstall Crossplane (optional - leave installed for faster re-deployment)
    read -p "Uninstall Crossplane? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl delete -f "${K8S_LOCAL_DIR}/crossplane-provider-aws.yaml" --ignore-not-found
        helm uninstall crossplane -n ${CROSSPLANE_NAMESPACE} 2>/dev/null || true
        kubectl delete namespace ${CROSSPLANE_NAMESPACE} --ignore-not-found
    fi

    log_success "Cleanup completed"
}

# Full setup
full_setup() {
    check_prerequisites
    install_crossplane
    install_crossplane_aws_provider
    install_localstack
    deploy_postgres
    build_docker_image
    deploy_app
    configure_localstack_provider

    log_info "Waiting for everything to stabilize..."
    sleep 10

    run_migrations
    seed_database
    check_status

    echo ""
    log_success "=== Full Setup Complete ==="
    log_info "API: http://localhost:30300/api"
    log_info "Swagger: http://localhost:30300/api/docs"
    log_info "Health: http://localhost:30300/api/health"
}

# Main
case "${1:-setup}" in
    setup)
        full_setup
        ;;
    app)
        check_prerequisites
        build_docker_image
        deploy_app
        run_migrations
        check_status
        ;;
    clean)
        cleanup
        ;;
    status)
        check_status
        ;;
    *)
        echo "Usage: $0 {setup|app|clean|status}"
        exit 1
        ;;
esac
