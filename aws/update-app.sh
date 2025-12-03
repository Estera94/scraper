#!/bin/bash

# Script to update the application on an existing EC2 instance
# Usage: ./update-app.sh <EC2_IP_OR_DOMAIN> <SSH_KEY_PATH>

set -e

if [ $# -lt 2 ]; then
    echo "Usage: $0 <EC2_IP_OR_DOMAIN> <SSH_KEY_PATH>"
    echo "Example: $0 54.123.45.67 ~/.ssh/my-key.pem"
    exit 1
fi

EC2_HOST=$1
KEY_PATH=$2

echo "Updating application on $EC2_HOST..."

# Copy latest code to instance
echo "Copying files to instance..."
cd ..

# Use tar+ssh for reliable file transfer (works even if rsync is not available)
if command -v rsync &> /dev/null; then
    rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' --exclude 'aws/.env' \
        --exclude 'backend/node_modules' --exclude 'frontend/node_modules' \
        -e "ssh -i $KEY_PATH -o StrictHostKeyChecking=no" \
        ./ ec2-user@$EC2_HOST:~/website-scraper/
else
    echo "Using tar+ssh to copy files (rsync not available)..."
    tar --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='aws/.env' \
        --exclude='backend/node_modules' --exclude='frontend/node_modules' \
        -czf - . | ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$EC2_HOST \
        "cd ~/website-scraper && tar -xzf -"
fi

cd aws

# Run update on instance
echo "Rebuilding and restarting services..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$EC2_HOST << 'ENDSSH'
cd ~/website-scraper

# Fetch latest secrets (in case they changed)
cd aws
sudo ./fetch-secrets.sh
cd ..

# Rebuild and restart
sudo docker-compose -f aws/docker-compose.aws.yml --env-file .env down
sudo docker-compose -f aws/docker-compose.aws.yml --env-file .env up -d --build

# Show status
echo ""
echo "Service status:"
sudo docker-compose -f aws/docker-compose.aws.yml ps

echo ""
echo "Update complete!"
ENDSSH

echo ""
echo "Application updated successfully!"
echo "View logs with: ssh -i $KEY_PATH ec2-user@$EC2_HOST 'cd ~/website-scraper && sudo docker-compose -f aws/docker-compose.aws.yml logs -f'"

