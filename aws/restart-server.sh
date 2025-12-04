#!/bin/bash

# Script to restart Docker services on EC2 instance
# Usage: ./restart-server.sh [EC2_IP] [SSH_KEY_PATH]
# Or set environment variables: EC2_HOST=... KEY_PATH=... ./restart-server.sh

set -e

# Default values
EC2_HOST="${1:-${EC2_HOST:-3.222.214.39}}"
# KEY_PATH can be passed as second argument, set as environment variable, or will default to ~/Desktop/website-scraper-key.pem
KEY_PATH="${2:-${KEY_PATH:-${HOME}/Desktop/website-scraper-key.pem}}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate key file exists
if [ ! -f "$KEY_PATH" ]; then
    print_error "SSH key not found: $KEY_PATH"
    echo ""
    echo "Usage: $0 [EC2_IP] [SSH_KEY_PATH]"
    echo "Example: $0 3.222.214.39 ~/Desktop/website-scraper-key.pem"
    exit 1
fi

print_info "Restarting server at $EC2_HOST..."
print_info "Using SSH key: $KEY_PATH"
echo ""

# Restart services on server
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$EC2_HOST << 'EOF'
cd ~/website-scraper

echo "Stopping services..."
sudo docker-compose -f aws/docker-compose.aws.yml --env-file .env down

echo ""
echo "Starting services..."
sudo docker-compose -f aws/docker-compose.aws.yml --env-file .env up -d

echo ""
echo "Waiting for services to start..."
sleep 5

echo ""
echo "Service status:"
sudo docker-compose -f aws/docker-compose.aws.yml ps

echo ""
echo "Recent logs (last 20 lines):"
sudo docker-compose -f aws/docker-compose.aws.yml logs --tail=20
EOF

echo ""
print_info "✅ Server restarted successfully!"
echo ""
echo "To view logs:"
echo "  ssh -i $KEY_PATH ec2-user@$EC2_HOST 'cd ~/website-scraper && sudo docker-compose -f aws/docker-compose.aws.yml logs -f'"
echo ""
echo "To check service status:"
echo "  ssh -i $KEY_PATH ec2-user@$EC2_HOST 'cd ~/website-scraper && sudo docker-compose -f aws/docker-compose.aws.yml ps'"

