#!/bin/bash

# Health Check Script
# Checks the health of all services

set -e

echo "=== Website Scraper Health Check ==="
echo ""

# Check Docker services
echo "1. Checking Docker services..."
cd ~/website-scraper
if sudo docker-compose -f aws/docker-compose.aws.yml ps | grep -q "Up"; then
    echo "   ✓ Docker services are running"
    sudo docker-compose -f aws/docker-compose.aws.yml ps
else
    echo "   ✗ Some Docker services are not running"
    exit 1
fi

echo ""

# Check Nginx
echo "2. Checking Nginx..."
if sudo systemctl is-active --quiet nginx; then
    echo "   ✓ Nginx is running"
else
    echo "   ✗ Nginx is not running"
    exit 1
fi

echo ""

# Check backend health endpoint
echo "3. Checking backend API..."
if curl -f -s http://localhost:3000/health > /dev/null; then
    echo "   ✓ Backend API is responding"
else
    echo "   ✗ Backend API is not responding"
    exit 1
fi

echo ""

# Check database connection
echo "4. Checking database connection..."
if sudo docker-compose -f aws/docker-compose.aws.yml exec -T postgres pg_isready -U scraper_user > /dev/null 2>&1; then
    echo "   ✓ Database is accessible"
else
    echo "   ✗ Database is not accessible"
    exit 1
fi

echo ""

# Check SSL certificate
echo "5. Checking SSL certificate..."
if [ -f "/etc/nginx/ssl/nginx-selfsigned.crt" ] || [ -d "/etc/letsencrypt/live" ]; then
    echo "   ✓ SSL certificate found"
else
    echo "   ⚠ SSL certificate not found"
fi

echo ""
echo "=== All health checks passed! ==="

