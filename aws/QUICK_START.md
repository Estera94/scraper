# AWS Deployment Quick Start

## Prerequisites Checklist

- [ ] AWS account created
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] EC2 key pair created in AWS Console
- [ ] Secrets stored in AWS Parameter Store (see README.md Step 1)

## One-Command Deployment

1. **Edit `aws/deploy.sh`** and update:
   ```bash
   KEY_NAME="your-ec2-key-pair-name"
   REGION="us-east-1"  # or your preferred region
   ```

2. **Place your SSH key** at `~/.ssh/${KEY_NAME}.pem`

3. **Run deployment**:
   ```bash
   cd aws
   ./deploy.sh
   ```

4. **Wait 5-10 minutes** for deployment to complete

5. **Access your app** at `https://<ELASTIC_IP>` (shown at end of deployment)

## Post-Deployment

### Set up Let's Encrypt SSL (if you have a domain)

```bash
# SSH into instance
ssh -i ~/.ssh/your-key.pem ec2-user@<ELASTIC_IP>

# Set up SSL
cd ~/website-scraper/aws
sudo ./setup-ssl.sh --domain yourdomain.com --email your@email.com

# Update DNS: Point yourdomain.com to <ELASTIC_IP>
```

### Verify Deployment

```bash
# SSH into instance
ssh -i ~/.ssh/your-key.pem ec2-user@<ELASTIC_IP>

# Run health check
cd ~/website-scraper/aws
./health-check.sh
```

## Common Commands

### View Logs
```bash
ssh -i ~/.ssh/your-key.pem ec2-user@<ELASTIC_IP>
cd ~/website-scraper
sudo docker-compose -f aws/docker-compose.aws.yml logs -f
```

### Restart Services
```bash
ssh -i ~/.ssh/your-key.pem ec2-user@<ELASTIC_IP>
cd ~/website-scraper
sudo docker-compose -f aws/docker-compose.aws.yml restart
```

### Update Application
```bash
# From your local machine
cd aws
./update-app.sh <ELASTIC_IP> ~/.ssh/your-key.pem
```

### Backup Database
```bash
ssh -i ~/.ssh/your-key.pem ec2-user@<ELASTIC_IP>
cd ~/website-scraper/aws
./backup-db.sh
```

## Troubleshooting

**Can't connect via SSH?**
- Check security group allows port 22
- Verify key file permissions: `chmod 600 ~/.ssh/your-key.pem`
- Wait a few more minutes for instance to fully initialize

**Application not accessible?**
- Check security group allows ports 80 and 443
- Verify services are running: `sudo docker-compose -f aws/docker-compose.aws.yml ps`
- Check Nginx: `sudo systemctl status nginx`

**SSL certificate issues?**
- For self-signed: Browser warning is expected
- For Let's Encrypt: Verify DNS points to Elastic IP

## Cost Estimate

- **Free Tier (First 12 months)**: $0/month
- **After Free Tier**: ~$8-15/month
  - EC2 t2.micro: ~$8/month
  - EBS storage: ~$2/month
  - Data transfer: Variable

## Next Steps

1. Set up automated database backups (cron job)
2. Configure CloudWatch alarms
3. Set up domain name and DNS
4. Enable Let's Encrypt SSL
5. Review security settings

For detailed information, see [README.md](./README.md).

