#!/bin/bash
# =============================================================================
# Build and Push Docker Image to GitHub Container Registry (GHCR)
# =============================================================================
# Prerequisites:
#   - Docker installed and running
#   - GitHub Personal Access Token with `write:packages` scope
#   - GITHUB_TOKEN environment variable set
#
# Setup:
#   1. Create GitHub PAT: Settings → Developer settings → Personal access tokens
#   2. Select scopes: write:packages, read:packages, delete:packages
#   3. Export token: export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
#
# Usage:
#   ./scripts/build-push-ghcr.sh [command]
#
# Commands:
#   login         - Login to GHCR
#   build         - Build Docker image (ARM64)
#   push          - Push to GHCR
#   all           - Login, build, and push
#   info          - Show image information
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GITHUB_USERNAME="${GITHUB_USERNAME:-ayansasmal}"
REGISTRY="ghcr.io"
IMAGE_NAME="diet-api"
IMAGE_TAG="${IMAGE_TAG:-latest}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${SCRIPT_DIR}/.."

# Full image reference
FULL_IMAGE="${REGISTRY}/${GITHUB_USERNAME}/${IMAGE_NAME}"

# Helper functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found. Please install Docker."
        exit 1
    fi

    # Check Docker is running
    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker Desktop."
        exit 1
    fi

    # Check GITHUB_TOKEN
    if [ -z "${GITHUB_TOKEN}" ]; then
        log_error "GITHUB_TOKEN not set."
        echo ""
        echo "To create a GitHub Personal Access Token:"
        echo "  1. Go to: https://github.com/settings/tokens"
        echo "  2. Click 'Generate new token (classic)'"
        echo "  3. Select scopes: write:packages, read:packages"
        echo "  4. Copy the token"
        echo "  5. Run: export GITHUB_TOKEN=ghp_xxxxxxxxxxxx"
        echo ""
        exit 1
    fi

    log_success "Prerequisites check passed"
}

# Login to GHCR
ghcr_login() {
    log_info "Logging into GitHub Container Registry..."

    echo "${GITHUB_TOKEN}" | docker login ${REGISTRY} -u ${GITHUB_USERNAME} --password-stdin

    log_success "Logged into GHCR as ${GITHUB_USERNAME}"
}

# Build Docker image for ARM64
build_image() {
    log_info "Building Docker image for ARM64..."

    cd "${BACKEND_DIR}"

    # Check if buildx is available
    if docker buildx version &> /dev/null; then
        log_info "Using Docker Buildx for multi-platform build..."

        # Create builder if not exists
        if ! docker buildx inspect diet-builder &> /dev/null; then
            docker buildx create --name diet-builder --use
        else
            docker buildx use diet-builder
        fi

        # Build for ARM64 and push directly
        docker buildx build \
            --platform linux/arm64 \
            --tag ${FULL_IMAGE}:${IMAGE_TAG} \
            --tag ${FULL_IMAGE}:$(git rev-parse --short HEAD 2>/dev/null || echo "dev") \
            --push \
            --label "org.opencontainers.image.source=https://github.com/${GITHUB_USERNAME}/diet-management-app-api" \
            --label "org.opencontainers.image.description=Diet Management API - NestJS Backend" \
            --label "org.opencontainers.image.licenses=UNLICENSED" \
            .

        log_success "Image built and pushed: ${FULL_IMAGE}:${IMAGE_TAG}"
    else
        log_warn "Docker Buildx not available. Building for local platform..."

        # Standard build
        docker build \
            --tag ${FULL_IMAGE}:${IMAGE_TAG} \
            --label "org.opencontainers.image.source=https://github.com/${GITHUB_USERNAME}/diet-management-app-api" \
            .

        log_success "Image built: ${FULL_IMAGE}:${IMAGE_TAG}"
        log_info "Run 'push' command to push to GHCR"
    fi
}

# Push image to GHCR (if not using buildx --push)
push_image() {
    log_info "Pushing image to GHCR..."

    # Check if image exists locally
    if ! docker image inspect ${FULL_IMAGE}:${IMAGE_TAG} &> /dev/null; then
        log_error "Image not found locally. Run 'build' first."
        exit 1
    fi

    docker push ${FULL_IMAGE}:${IMAGE_TAG}

    # Also tag and push with git commit SHA
    GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "")
    if [ -n "${GIT_SHA}" ]; then
        docker tag ${FULL_IMAGE}:${IMAGE_TAG} ${FULL_IMAGE}:${GIT_SHA}
        docker push ${FULL_IMAGE}:${GIT_SHA}
        log_info "Also pushed: ${FULL_IMAGE}:${GIT_SHA}"
    fi

    log_success "Image pushed: ${FULL_IMAGE}:${IMAGE_TAG}"
}

# Build and push
build_and_push() {
    check_prerequisites
    ghcr_login
    build_image

    echo ""
    log_success "=== Build and Push Complete ==="
    echo ""
    echo "Image: ${FULL_IMAGE}:${IMAGE_TAG}"
    echo ""
    echo "To pull on EC2:"
    echo "  echo \$GITHUB_TOKEN | docker login ghcr.io -u ${GITHUB_USERNAME} --password-stdin"
    echo "  docker pull ${FULL_IMAGE}:${IMAGE_TAG}"
}

# Show image info
show_info() {
    echo ""
    log_info "=== GHCR Image Information ==="
    echo ""
    echo "Registry:    ${REGISTRY}"
    echo "Username:    ${GITHUB_USERNAME}"
    echo "Image Name:  ${IMAGE_NAME}"
    echo "Full Image:  ${FULL_IMAGE}:${IMAGE_TAG}"
    echo ""
    echo "GitHub Packages URL:"
    echo "  https://github.com/${GITHUB_USERNAME}?tab=packages"
    echo ""

    # Try to list local images
    log_info "Local images:"
    docker images "${FULL_IMAGE}" 2>/dev/null || echo "No local images found"
}

# Generate EC2 setup instructions
show_ec2_setup() {
    echo ""
    log_info "=== EC2 Setup Instructions ==="
    echo ""
    cat << 'EOF'
# 1. Store GitHub token in AWS Secrets Manager (already done in secrets.yaml)
#    Add GITHUB_TOKEN to the secret

# 2. On EC2, login to GHCR:
export GITHUB_TOKEN=$(aws secretsmanager get-secret-value \
  --secret-id diet-app/production/secrets \
  --region ap-southeast-2 \
  --query SecretString --output text | jq -r '.GITHUB_TOKEN')

echo $GITHUB_TOKEN | docker login ghcr.io -u ayansasmal --password-stdin

# 3. Pull and run:
EOF
    echo "docker pull ${FULL_IMAGE}:${IMAGE_TAG}"
    cat << 'EOF'
docker run -d \
  --name diet-api \
  --restart unless-stopped \
  -p 3000:3000 \
  --log-driver=awslogs \
  --log-opt awslogs-region=ap-southeast-2 \
  --log-opt awslogs-group=/diet-app/api \
  --log-opt awslogs-stream=diet-api \
  --log-opt awslogs-create-group=true \
  -e DATABASE_URL="${DATABASE_URL}" \
  -e JWT_SECRET="${JWT_SECRET}" \
  -e GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}" \
  -e GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET}" \
  -e NODE_ENV=production \
EOF
    echo "  ${FULL_IMAGE}:${IMAGE_TAG}"
}

# Main
case "${1:-all}" in
    login)
        check_prerequisites
        ghcr_login
        ;;
    build)
        check_prerequisites
        ghcr_login
        build_image
        ;;
    push)
        check_prerequisites
        ghcr_login
        push_image
        ;;
    all)
        build_and_push
        ;;
    info)
        show_info
        ;;
    ec2-setup)
        show_ec2_setup
        ;;
    *)
        echo "Usage: $0 {login|build|push|all|info|ec2-setup}"
        echo ""
        echo "Environment variables:"
        echo "  GITHUB_TOKEN     - GitHub PAT with write:packages scope (required)"
        echo "  GITHUB_USERNAME  - GitHub username (default: ayansasmal)"
        echo "  IMAGE_TAG        - Docker image tag (default: latest)"
        exit 1
        ;;
esac
