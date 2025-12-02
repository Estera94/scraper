# AWS Free Tier Deployment Guide

This guide will help you deploy the website-scraper application to AWS using free tier services.

## Prerequisites

1. **AWS Account**: Sign up at https://aws.amazon.com (free tier eligible)
2. **AWS CLI**: Install and configure AWS CLI
   ```bash
   # Install AWS CLI (macOS)
   brew install awscli
   
   # Configure AWS CLI
   aws configure
   ```
3. **SSH Key Pair**: Create an EC2 key pair in AWS Console or use existing one
4. **Domain Name (Optional)**: For proper SSL certificates with Let's Encrypt

## AWS Free Tier Services

- **EC2 t2.micro**: 750 hours/month free for 12 months
- **Elastic IP**: Free when attached to running instance
- **AWS Systems Manager Parameter Store**: 10,000 standard parameters free
- **EBS Storage**: 30 GB free tier
- **CloudWatch**: Basic monitoring free tier

## Quick Start

### Step 1: Store Secrets in AWS Parameter Store

Store your application secrets securely in AWS Systems Manager Parameter Store:

```bash
# JWT Secret
aws ssm put-parameter \
  --name "/website-scraper/jwt-secret" \
  --value "your-super-secret-jwt-key-change-this" \
  --type "SecureString"

# Stripe Keys
aws ssm put-parameter \
  --name "/website-scraper/stripe-secret-key" \
  --value "sk_live_your_stripe_secret_key" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/website-scraper/stripe-publishable-key" \
  --value "pk_live_your_stripe_publishable_key" \
  --type "String"

aws ssm put-parameter \
  --name "/website-scraper/stripe-webhook-secret" \
  --value "whsec_your_webhook_secret" \
  --type "SecureString"

# Database Credentials
aws ssm put-parameter \
  --name "/website-scraper/postgres-user" \
  --value "scraper_user" \
  --type "String"

aws ssm put-parameter \
  --name "/website-scraper/postgres-password" \
  --value "your-secure-database-password" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/website-scraper/postgres-db" \
  --value "website_scraper" \
  --type "String"

# LinkedIn Credentials (optional)
aws ssm put-parameter \
  --name "/website-scraper/linkedin-username" \
  --value "your-linkedin-email@example.com" \
  --type "SecureString"

aws ssm put-parameter \
  --name "/website-scraper/linkedin-password" \
  --value "your-linkedin-password" \
  --type "SecureString"
```

### Step 2: Configure Deployment Script

Edit `aws/deploy.sh` and update:
- `KEY_NAME`: Your EC2 key pair name
- `REGION`: Your preferred AWS region (e.g., `us-east-1`)
- `INSTANCE_TYPE`: `t2.micro` (free tier)
- `AMI_ID`: Latest Amazon Linux 2023 AMI for your region

### Step 3: Run Deployment

```bash
cd aws
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. Create security groups (ports 22, 80, 443)
2. Launch EC2 instance
3. Allocate and attach Elastic IP
4. Wait for instance to be ready
5. Copy application files to instance
6. Run initialization script
7. Set up SSL certificates
8. Start Docker Compose services

### Step 4: Access Your Application

After deployment completes, you'll get:
- **HTTPS URL**: `https://<ELASTIC_IP>`
- **SSH Access**: `ssh -i your-key.pem ec2-user@<ELASTIC_IP>`

## Manual Deployment (Alternative)

If you prefer manual setup:

### 1. Launch EC2 Instance

- Instance type: `t2.micro`
- AMI: Amazon Linux 2023
- Security group: Allow ports 22, 80, 443
- Storage: 20 GB (within free tier)

### 2. Connect to Instance

```bash
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>
```

### 3. Run Setup Script

```bash
# Copy files to instance first
scp -r -i your-key.pem ../ ec2-user@<EC2_PUBLIC_IP>:~/website-scraper

# SSH into instance
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>

# Run setup
cd ~/website-scraper/aws
chmod +x ec2-user-data.sh
sudo ./ec2-user-data.sh
```

### 4. Configure SSL

**Option A: Self-Signed Certificate (Quick Start)**
```bash
cd ~/website-scraper/aws
sudo ./setup-ssl.sh --self-signed
```

**Option B: Let's Encrypt (Requires Domain)**
```bash
cd ~/website-scraper/aws
sudo ./setup-ssl.sh --domain yourdomain.com --email your-email@example.com
```

### 5. Start Application

```bash
cd ~/website-scraper
sudo docker-compose -f aws/docker-compose.aws.yml up -d
```

## SSL Certificate Options

### Self-Signed Certificate
- Works immediately
- Browser will show security warning
- Good for testing/internal use
- Command: `sudo ./setup-ssl.sh --self-signed`

### Let's Encrypt Certificate
- Free, trusted certificate
- Requires domain name
- Auto-renewal configured
- Command: `sudo ./setup-ssl.sh --domain yourdomain.com --email your@email.com`

## Helper Scripts

The `aws/` directory contains several helper scripts:

- **`deploy.sh`**: Main deployment script (run from your local machine)
- **`update-app.sh`**: Update application on existing instance (run from your local machine)
- **`fetch-secrets.sh`**: Fetch secrets from AWS Parameter Store (run on EC2)
- **`setup-ssl.sh`**: Set up SSL certificates (run on EC2)
- **`backup-db.sh`**: Create database backup (run on EC2)
- **`health-check.sh`**: Check health of all services (run on EC2)

### Using Helper Scripts

**From your local machine:**
```bash
# Deploy application
cd aws
./deploy.sh

# Update application
./update-app.sh <EC2_IP> <SSH_KEY_PATH>
```

**On EC2 instance:**
```bash
# Create database backup
cd ~/website-scraper/aws
./backup-db.sh

# Check service health
./health-check.sh

# Set up Let's Encrypt SSL
sudo ./setup-ssl.sh --domain yourdomain.com --email your@email.com
```

## Managing the Application

### View Logs
```bash
# All services
sudo docker-compose -f aws/docker-compose.aws.yml logs -f

# Specific service
sudo docker-compose -f aws/docker-compose.aws.yml logs -f backend
sudo docker-compose -f aws/docker-compose.aws.yml logs -f frontend
sudo docker-compose -f aws/docker-compose.aws.yml logs -f postgres
```

### Restart Services
```bash
cd ~/website-scraper
sudo docker-compose -f aws/docker-compose.aws.yml restart
```

### Stop Services
```bash
cd ~/website-scraper
sudo docker-compose -f aws/docker-compose.aws.yml down
```

### Update Application
```bash
# SSH into instance
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>

# Pull latest code
cd ~/website-scraper
git pull

# Rebuild and restart
sudo docker-compose -f aws/docker-compose.aws.yml up -d --build
```

## Database Backups

### Manual Backup
```bash
# SSH into instance
ssh -i your-key.pem ec2-user@<EC2_PUBLIC_IP>

# Create backup
sudo docker-compose -f aws/docker-compose.aws.yml exec postgres pg_dump -U scraper_user website_scraper > backup_$(date +%Y%m%d).sql

# Download backup
scp -i your-key.pem ec2-user@<EC2_PUBLIC_IP>:~/backup_*.sql ./
```

### Automated Backups (Cron Job)

Add to crontab:
```bash
crontab -e
```

Add line:
```
0 2 * * * cd ~/website-scraper && sudo docker-compose -f aws/docker-compose.aws.yml exec -T postgres pg_dump -U scraper_user website_scraper > ~/backups/backup_$(date +\%Y\%m\%d).sql && find ~/backups -name "backup_*.sql" -mtime +7 -delete
```

## Monitoring

### CloudWatch Metrics
- CPU Utilization
- Network In/Out
- Disk Read/Write

View in AWS Console: EC2 → Instances → Your Instance → Monitoring

### Application Health Check
```bash
curl https://<ELASTIC_IP>/health
```

## Troubleshooting

### Instance Won't Start
- Check security group rules
- Verify key pair is correct
- Check CloudWatch logs

### Application Not Accessible
- Verify security group allows ports 80 and 443
- Check Nginx status: `sudo systemctl status nginx`
- Check Docker containers: `sudo docker-compose -f aws/docker-compose.aws.yml ps`

### SSL Certificate Issues
- Verify domain DNS points to Elastic IP
- Check certbot logs: `sudo journalctl -u certbot.timer`
- Renew manually: `sudo certbot renew`

### Database Connection Issues
- Check PostgreSQL container: `sudo docker-compose -f aws/docker-compose.aws.yml logs postgres`
- Verify DATABASE_URL environment variable
- Check database is running: `sudo docker-compose -f aws/docker-compose.aws.yml ps postgres`

## Cost Management

### Free Tier Limits
- **EC2**: 750 hours/month of t2.micro (enough for 24/7 operation)
- **EBS**: 30 GB storage
- **Data Transfer**: 15 GB out per month

### Cost Optimization Tips
1. Use t2.micro instance (free tier)
2. Keep EBS volume under 30 GB
3. Monitor data transfer (stay under 15 GB/month)
4. Stop instance when not in use (if not needed 24/7)

### Estimated Monthly Cost
- **Within Free Tier**: $0/month (first 12 months)
- **After Free Tier**: ~$8-15/month (depending on usage)

## Security Best Practices

1. **Change Default Passwords**: Update database passwords
2. **Use Strong JWT Secret**: Generate secure random string
3. **Enable Firewall**: Security groups configured
4. **Regular Updates**: Keep system and Docker images updated
5. **Backup Regularly**: Automated database backups
6. **Monitor Access**: Review CloudWatch logs

## Next Steps

1. Set up domain name and DNS
2. Configure automated backups
3. Set up CloudWatch alarms
4. Configure email notifications
5. Set up CI/CD pipeline (optional)

## Support

For issues or questions:
- Check application logs
- Review AWS CloudWatch logs
- Check Docker container status
- Review Nginx error logs: `sudo tail -f /var/log/nginx/error.log`

