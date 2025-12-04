#!/bin/bash

# Quick update script - simpler alternative
# Usage: ./quick-update.sh

set -e

EC2_HOST="3.222.214.39"
KEY_PATH="${HOME}/Desktop/website-scraper-key.pem"

echo "Quick update to $EC2_HOST..."

# Copy files using tar+ssh
echo "Copying files..."
cd ..
tar --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='aws/.env' \
    --exclude='backend/node_modules' --exclude='frontend/node_modules' \
    -czf - . | ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$EC2_HOST \
    "cd ~/website-scraper && tar -xzf -"
cd aws

# Update on server
echo "Updating services..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$EC2_HOST << 'EOF'
cd ~/website-scraper/aws
sudo ./fetch-secrets.sh
cd ..
sudo docker-compose -f aws/docker-compose.aws.yml --env-file .env down
sudo docker-compose -f aws/docker-compose.aws.yml --env-file .env up -d --build
echo "Update complete!"
EOF

echo ""
echo "✅ Application updated successfully!"

