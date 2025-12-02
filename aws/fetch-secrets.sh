#!/bin/bash

# Script to fetch secrets from AWS Systems Manager Parameter Store
# and create .env file for Docker Compose

set -e

ENV_FILE="/home/ec2-user/website-scraper/.env"
REGION="${AWS_REGION:-us-east-1}"

echo "Fetching secrets from AWS Parameter Store..."

# Function to get parameter value
get_parameter() {
    local param_name=$1
    local param_type=${2:-String}
    
    if [ "$param_type" == "SecureString" ]; then
        aws ssm get-parameter \
            --region $REGION \
            --name "$param_name" \
            --with-decryption \
            --query 'Parameter.Value' \
            --output text 2>/dev/null || echo ""
    else
        aws ssm get-parameter \
            --region $REGION \
            --name "$param_name" \
            --query 'Parameter.Value' \
            --output text 2>/dev/null || echo ""
    fi
}

# Fetch all parameters
JWT_SECRET=$(get_parameter "/website-scraper/jwt-secret" "SecureString")
STRIPE_SECRET_KEY=$(get_parameter "/website-scraper/stripe-secret-key" "SecureString")
STRIPE_PUBLISHABLE_KEY=$(get_parameter "/website-scraper/stripe-publishable-key" "String")
STRIPE_WEBHOOK_SECRET=$(get_parameter "/website-scraper/stripe-webhook-secret" "SecureString")
POSTGRES_USER=$(get_parameter "/website-scraper/postgres-user" "String")
POSTGRES_PASSWORD=$(get_parameter "/website-scraper/postgres-password" "SecureString")
POSTGRES_DB=$(get_parameter "/website-scraper/postgres-db" "String")
LINKEDIN_USERNAME=$(get_parameter "/website-scraper/linkedin-username" "SecureString")
LINKEDIN_PASSWORD=$(get_parameter "/website-scraper/linkedin-password" "SecureString")

# Get Elastic IP or public IP for FRONTEND_URL
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
FRONTEND_URL="https://${PUBLIC_IP}"

# Create .env file
cat > "$ENV_FILE" << EOF
# Database Configuration
POSTGRES_USER=${POSTGRES_USER:-scraper_user}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-scraper_password}
POSTGRES_DB=${POSTGRES_DB:-website_scraper}

# JWT Configuration
JWT_SECRET=${JWT_SECRET:-your-super-secret-jwt-key-change-this-in-production}

# Stripe Configuration
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}

# Application Configuration
FRONTEND_URL=${FRONTEND_URL}
PORT=3000

# LinkedIn Configuration (Optional)
LINKEDIN_USERNAME=${LINKEDIN_USERNAME}
LINKEDIN_PASSWORD=${LINKEDIN_PASSWORD}
EOF

# Set proper permissions
chmod 600 "$ENV_FILE"
chown ec2-user:ec2-user "$ENV_FILE"

echo "Environment file created at $ENV_FILE"
echo "Secrets fetched successfully!"

