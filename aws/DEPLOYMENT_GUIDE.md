# Deployment Guide

## Quick Deployment Options

### Option 1: Update Existing Instance (Recommended)

If you already have a running instance and want to update the code:

```bash
cd aws
./update-app.sh 3.222.214.39 ~/.ssh/website-scraper-key.pem
```

This will:
- Copy latest code to the instance
- Fetch latest secrets from AWS Parameter Store
- Rebuild and restart Docker containers
- Preserve all data (database, etc.)

### Option 2: Fresh Deployment (New Instance)

If you want to deploy to a completely new instance (terminates old one):

```bash
cd aws
./deploy.sh
```

**Note:** This will automatically terminate any existing instances with the same name.

### Option 3: Manual Update on Existing Instance

SSH into your instance and update manually:

```bash
# 1. SSH into instance
ssh -i ~/.ssh/website-scraper-key.pem ec2-user@3.222.214.39

# 2. Navigate to project
cd ~/website-scraper

# 3. Pull latest code (if using git) or copy files manually
# If using git:
git pull

# 4. Fetch latest secrets
cd aws
sudo ./fetch-secrets.sh
cd ..

# 5. Rebuild and restart
sudo docker-compose -f aws/docker-compose.aws.yml --env-file .env down
sudo docker-compose -f aws/docker-compose.aws.yml --env-file .env up -d --build

# 6. Check status
sudo docker-compose -f aws/docker-compose.aws.yml ps
```

## Current Instance Info

- **IP Address**: 3.222.214.39
- **Instance ID**: i-0c1c6103fa3b507ef
- **Region**: us-east-1
- **Key**: ~/.ssh/website-scraper-key.pem

## Common Commands

### View Logs
```bash
ssh -i ~/.ssh/website-scraper-key.pem ec2-user@3.222.214.39
cd ~/website-scraper
sudo docker-compose -f aws/docker-compose.aws.yml --env-file .env logs -f
```

### Restart Services
```bash
ssh -i ~/.ssh/website-scraper-key.pem ec2-user@3.222.214.39
cd ~/website-scraper
sudo docker-compose -f aws/docker-compose.aws.yml --env-file .env restart
```

### Check Service Status
```bash
ssh -i ~/.ssh/website-scraper-key.pem ec2-user@3.222.214.39
cd ~/website-scraper
sudo docker-compose -f aws/docker-compose.aws.yml --env-file .env ps
```

### Backup Database
```bash
ssh -i ~/.ssh/website-scraper-key.pem ec2-user@3.222.214.39
cd ~/website-scraper/aws
./backup-db.sh
```

## Troubleshooting

If deployment fails:
1. Check instance is running: `aws ec2 describe-instances --instance-ids i-0c1c6103fa3b507ef`
2. Check security groups allow ports 22, 80, 443
3. View instance logs in AWS Console
4. SSH into instance and check Docker containers
