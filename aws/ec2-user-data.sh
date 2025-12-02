#!/bin/bash

# EC2 User Data Script
# This script runs automatically when the EC2 instance starts
# It installs Docker, Docker Compose, and sets up the environment

set -e

# Update system
echo "Updating system packages..."
sudo yum update -y

# Install Docker
echo "Installing Docker..."
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
echo "Installing Docker Compose..."
DOCKER_COMPOSE_VERSION="v2.24.0"
sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git (if not already installed)
echo "Installing Git..."
sudo yum install -y git

# Install Nginx
echo "Installing Nginx..."
sudo yum install -y nginx
sudo systemctl enable nginx

# Install certbot for SSL certificates
echo "Installing Certbot..."
sudo yum install -y certbot python3-certbot-nginx

# Install AWS CLI (if not already installed)
echo "Installing AWS CLI..."
if ! command -v aws &> /dev/null; then
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
fi

# Install jq for JSON parsing
echo "Installing jq..."
sudo yum install -y jq

# Create application directory
echo "Creating application directory..."
mkdir -p /home/ec2-user/website-scraper
chown ec2-user:ec2-user /home/ec2-user/website-scraper

# Create directories for SSL certificates
echo "Creating SSL directories..."
sudo mkdir -p /etc/nginx/ssl
sudo mkdir -p /etc/letsencrypt

# Create log directories
echo "Creating log directories..."
sudo mkdir -p /var/log/website-scraper
sudo chown ec2-user:ec2-user /var/log/website-scraper

# Set up automatic startup script
echo "Setting up startup script..."
cat > /home/ec2-user/start-app.sh << 'EOF'
#!/bin/bash
cd /home/ec2-user/website-scraper
if [ -f "aws/docker-compose.aws.yml" ]; then
    sudo docker-compose -f aws/docker-compose.aws.yml up -d
fi
EOF

chmod +x /home/ec2-user/start-app.sh

# Add to crontab for automatic startup on reboot
(crontab -l 2>/dev/null; echo "@reboot /home/ec2-user/start-app.sh") | crontab -

# Configure Nginx to start on boot
sudo systemctl enable nginx

echo "User data script completed successfully!"

