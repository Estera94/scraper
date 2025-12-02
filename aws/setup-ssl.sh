#!/bin/bash

# SSL Certificate Setup Script
# Supports both self-signed certificates and Let's Encrypt

set -e

NGINX_CONF="/etc/nginx/nginx.conf"
SSL_DIR="/etc/nginx/ssl"
DOMAIN=""
EMAIL=""
SELF_SIGNED=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --email)
            EMAIL="$2"
            shift 2
            ;;
        --self-signed)
            SELF_SIGNED=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--self-signed] OR [--domain DOMAIN --email EMAIL]"
            exit 1
            ;;
    esac
done

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "Error: Nginx is not installed"
    exit 1
fi

# Create SSL directory
sudo mkdir -p "$SSL_DIR"

if [ "$SELF_SIGNED" = true ]; then
    echo "Setting up self-signed SSL certificate..."
    
    # Generate self-signed certificate
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/nginx-selfsigned.key" \
        -out "$SSL_DIR/nginx-selfsigned.crt" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    
    # Create Nginx SSL configuration
    sudo tee /etc/nginx/conf.d/ssl.conf > /dev/null << 'EOF'
server {
    listen 443 ssl http2;
    server_name _;

    ssl_certificate /etc/nginx/ssl/nginx-selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/nginx-selfsigned.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}
EOF

    echo "Self-signed certificate created successfully!"
    echo "Note: Browsers will show a security warning for self-signed certificates."

elif [ -n "$DOMAIN" ] && [ -n "$EMAIL" ]; then
    echo "Setting up Let's Encrypt SSL certificate for domain: $DOMAIN"
    
    # First, set up temporary HTTP configuration for domain validation
    sudo tee /etc/nginx/conf.d/temp.conf > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

    sudo systemctl reload nginx
    
    # Obtain certificate
    echo "Obtaining Let's Encrypt certificate..."
    sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect
    
    # Set up auto-renewal
    echo "Setting up automatic certificate renewal..."
    sudo systemctl enable certbot.timer
    sudo systemctl start certbot.timer
    
    echo "Let's Encrypt certificate installed successfully!"
    echo "Certificate will auto-renew before expiration."

else
    echo "Error: Either --self-signed or --domain and --email must be provided"
    echo "Usage: $0 [--self-signed] OR [--domain DOMAIN --email EMAIL]"
    exit 1
fi

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
echo "Reloading Nginx..."
sudo systemctl reload nginx

echo "SSL setup completed successfully!"

