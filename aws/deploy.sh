#!/bin/bash

# AWS Deployment Script for Website Scraper
# This script automates the deployment of the application to AWS EC2

set -e

# Configuration - UPDATE THESE VALUES
KEY_NAME="website-scraper-key"  # Your EC2 key pair name
KEY_PATH="${HOME}/.ssh/${KEY_NAME}.pem"  # Path to your private key file
REGION="us-east-1"              # AWS region
INSTANCE_TYPE="t3.micro"        # Instance type (t3.micro if free tier expired, otherwise t2.micro)
AMI_ID=""                       # Leave empty to auto-detect latest Amazon Linux 2023
SECURITY_GROUP_NAME="website-scraper-sg"
APP_NAME="website-scraper"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured. Run 'aws configure' first."
    exit 1
fi

# Check if key file exists
if [ ! -f "$KEY_PATH" ]; then
    print_error "SSH key file not found at: $KEY_PATH"
    print_error "Please update KEY_PATH in deploy.sh or place your key file at the expected location."
    exit 1
fi

# Check if key file has correct permissions
if [ "$(stat -f %A "$KEY_PATH" 2>/dev/null || stat -c %a "$KEY_PATH" 2>/dev/null)" != "600" ]; then
    print_warn "Setting correct permissions on SSH key file..."
    chmod 600 "$KEY_PATH"
fi

# Get the latest Amazon Linux 2023 AMI if not specified
if [ -z "$AMI_ID" ]; then
    print_info "Finding latest Amazon Linux 2023 AMI..."
    AMI_ID=$(aws ec2 describe-images \
        --region $REGION \
        --owners amazon \
        --filters "Name=name,Values=al2023-ami-*-x86_64" "Name=state,Values=available" \
        --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
        --output text)
    
    if [ -z "$AMI_ID" ] || [ "$AMI_ID" == "None" ]; then
        print_error "Could not find Amazon Linux 2023 AMI. Please specify AMI_ID manually."
        exit 1
    fi
    print_info "Using AMI: $AMI_ID"
fi

# Check for existing instances and terminate them
print_info "Checking for existing instances..."
EXISTING_INSTANCES=$(aws ec2 describe-instances \
    --region $REGION \
    --filters "Name=tag:Name,Values=$APP_NAME" "Name=instance-state-name,Values=running,pending,stopping" \
    --query 'Reservations[*].Instances[*].InstanceId' \
    --output text)

if [ -n "$EXISTING_INSTANCES" ]; then
    print_warn "Found existing instances: $EXISTING_INSTANCES"
    print_info "Terminating existing instances to ensure only one instance runs..."
    for INSTANCE_ID in $EXISTING_INSTANCES; do
        # Release Elastic IPs associated with these instances
        ALLOCATION_IDS=$(aws ec2 describe-addresses \
            --region $REGION \
            --filters "Name=instance-id,Values=$INSTANCE_ID" \
            --query 'Addresses[*].AllocationId' \
            --output text)
        
        if [ -n "$ALLOCATION_IDS" ]; then
            for ALLOC_ID in $ALLOCATION_IDS; do
                print_info "Releasing Elastic IP: $ALLOC_ID"
                aws ec2 disassociate-address --region $REGION --association-id $(aws ec2 describe-addresses --region $REGION --allocation-ids $ALLOC_ID --query 'Addresses[0].AssociationId' --output text) 2>/dev/null || true
                aws ec2 release-address --region $REGION --allocation-id $ALLOC_ID 2>/dev/null || true
            done
        fi
        
        print_info "Terminating instance: $INSTANCE_ID"
        aws ec2 terminate-instances --region $REGION --instance-ids $INSTANCE_ID > /dev/null
    done
    
    print_info "Waiting for instances to terminate..."
    aws ec2 wait instance-terminated --region $REGION --instance-ids $EXISTING_INSTANCES 2>/dev/null || sleep 10
    print_info "Existing instances terminated."
fi

# Get VPC ID (use default VPC)
print_info "Finding default VPC..."
VPC_ID=$(aws ec2 describe-vpcs \
    --region $REGION \
    --filters "Name=isDefault,Values=true" \
    --query 'Vpcs[0].VpcId' \
    --output text)

if [ -z "$VPC_ID" ] || [ "$VPC_ID" == "None" ]; then
    print_error "No default VPC found. Please create a VPC or specify one."
    exit 1
fi
print_info "Using VPC: $VPC_ID"

# Create security group if it doesn't exist
print_info "Checking security group..."
SG_ID=$(aws ec2 describe-security-groups \
    --region $REGION \
    --filters "Name=group-name,Values=$SECURITY_GROUP_NAME" "Name=vpc-id,Values=$VPC_ID" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

if [ -z "$SG_ID" ] || [ "$SG_ID" == "None" ]; then
    print_info "Creating security group..."
    SG_ID=$(aws ec2 create-security-group \
        --region $REGION \
        --group-name $SECURITY_GROUP_NAME \
        --description "Security group for $APP_NAME" \
        --vpc-id $VPC_ID \
        --query 'GroupId' \
        --output text)
    
    # Add inbound rules
    print_info "Configuring security group rules..."
    aws ec2 authorize-security-group-ingress \
        --region $REGION \
        --group-id $SG_ID \
        --protocol tcp \
        --port 22 \
        --cidr 0.0.0.0/0 > /dev/null
    
    aws ec2 authorize-security-group-ingress \
        --region $REGION \
        --group-id $SG_ID \
        --protocol tcp \
        --port 80 \
        --cidr 0.0.0.0/0 > /dev/null
    
    aws ec2 authorize-security-group-ingress \
        --region $REGION \
        --group-id $SG_ID \
        --protocol tcp \
        --port 443 \
        --cidr 0.0.0.0/0 > /dev/null
    
    print_info "Security group created: $SG_ID"
else
    print_info "Using existing security group: $SG_ID"
fi

# Read user data script
print_info "Reading EC2 user data script..."
if [ ! -f "ec2-user-data.sh" ]; then
    print_error "ec2-user-data.sh not found in current directory"
    exit 1
fi

# Base64 encode user data (compatible with both macOS and Linux)
if [[ "$OSTYPE" == "darwin"* ]]; then
    USER_DATA=$(base64 -i ec2-user-data.sh)
else
    USER_DATA=$(base64 ec2-user-data.sh)
fi

# Launch EC2 instance
print_info "Launching EC2 instance..."
INSTANCE_ID=$(aws ec2 run-instances \
    --region $REGION \
    --image-id $AMI_ID \
    --instance-type $INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SG_ID \
    --user-data "$USER_DATA" \
    --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$APP_NAME}]" \
    --query 'Instances[0].InstanceId' \
    --output text)

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" == "None" ]; then
    print_error "Failed to launch EC2 instance"
    exit 1
fi

print_info "Instance launched: $INSTANCE_ID"
print_info "Waiting for instance to be running..."

# Wait for instance to be running
aws ec2 wait instance-running --region $REGION --instance-ids $INSTANCE_ID

# Allocate Elastic IP
print_info "Allocating Elastic IP..."
ALLOCATION_ID=$(aws ec2 allocate-address \
    --region $REGION \
    --domain vpc \
    --query 'AllocationId' \
    --output text)

if [ -z "$ALLOCATION_ID" ] || [ "$ALLOCATION_ID" == "None" ]; then
    print_error "Failed to allocate Elastic IP"
    exit 1
fi

# Associate Elastic IP with instance
print_info "Associating Elastic IP with instance..."
aws ec2 associate-address \
    --region $REGION \
    --instance-id $INSTANCE_ID \
    --allocation-id $ALLOCATION_ID > /dev/null

# Get Elastic IP address
ELASTIC_IP=$(aws ec2 describe-addresses \
    --region $REGION \
    --allocation-ids $ALLOCATION_ID \
    --query 'Addresses[0].PublicIp' \
    --output text)

print_info "Elastic IP allocated: $ELASTIC_IP"

# Wait for instance to be ready (SSH accessible)
print_info "Waiting for instance to be ready (this may take a few minutes)..."
sleep 30

MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no -o ConnectTimeout=5 ec2-user@$ELASTIC_IP "echo 'Connected'" 2>/dev/null; then
        print_info "Instance is ready!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "."
    sleep 10
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    print_warn "Instance may not be fully ready. Continuing anyway..."
fi

# Copy application files to instance
print_info "Copying application files to instance..."
cd ..

# Use tar+ssh for reliable file transfer
print_info "Creating archive and transferring files..."
tar --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='aws/.env' \
    --exclude='backend/node_modules' --exclude='frontend/node_modules' \
    -czf - . | ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$ELASTIC_IP \
    "mkdir -p ~/website-scraper && cd ~/website-scraper && tar -xzf -"

# Run additional setup on instance
print_info "Running additional setup on instance..."
ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no ec2-user@$ELASTIC_IP << 'ENDSSH'
cd ~/website-scraper/aws
chmod +x fetch-secrets.sh setup-ssl.sh
sudo ./fetch-secrets.sh
sudo ./setup-ssl.sh --self-signed
cd ~/website-scraper
sudo docker-compose -f aws/docker-compose.aws.yml up -d --build
ENDSSH

print_info ""
print_info "=========================================="
print_info "Deployment Complete!"
print_info "=========================================="
print_info "Instance ID: $INSTANCE_ID"
print_info "Elastic IP: $ELASTIC_IP"
print_info "Application URL: https://$ELASTIC_IP"
print_info ""
print_info "Next steps:"
print_info "1. Wait 2-3 minutes for services to start"
print_info "2. Access your application at: https://$ELASTIC_IP"
print_info "3. For Let's Encrypt SSL, run:"
print_info "   ssh -i $KEY_PATH ec2-user@$ELASTIC_IP"
print_info "   cd ~/website-scraper/aws"
print_info "   sudo ./setup-ssl.sh --domain yourdomain.com --email your@email.com"
print_info ""
print_info "To view logs:"
print_info "  ssh -i $KEY_PATH ec2-user@$ELASTIC_IP"
print_info "  cd ~/website-scraper"
print_info "  sudo docker-compose -f aws/docker-compose.aws.yml logs -f"
print_info ""

