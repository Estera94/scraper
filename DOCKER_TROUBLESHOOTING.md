# Docker Troubleshooting Guide

## npm install Hangs During Build

If `npm install` hangs during Docker build, try these solutions:

### Solution 1: Use npm ci with package-lock.json (Recommended)

Ensure you have `package-lock.json` files committed:

```bash
# Backend
cd backend
npm install  # This creates/updates package-lock.json
git add package-lock.json

# Frontend
cd frontend
npm install  # This creates/updates package-lock.json
git add package-lock.json
```

Then rebuild:
```bash
docker-compose build --no-cache
```

### Solution 2: Increase Docker Build Timeout

If using Docker Desktop, increase memory allocation:
- Docker Desktop → Settings → Resources → Memory (increase to 4GB+)

### Solution 3: Use Different npm Registry

If npm registry is slow, use a faster mirror. Update Dockerfiles:

```dockerfile
RUN npm config set registry https://registry.npmmirror.com
```

Or use environment variable:
```yaml
# In docker-compose.yml
environment:
  - npm_config_registry=https://registry.npmmirror.com
```

### Solution 4: Build with Verbose Output

See what's happening:

```bash
docker-compose build --progress=plain --no-cache backend
```

### Solution 5: Install Dependencies Locally First

```bash
# Install locally to generate lock files
cd backend && npm install
cd ../frontend && npm install

# Then build Docker
docker-compose build
```

### Solution 6: Skip Puppeteer Download (if Puppeteer is the issue)

Puppeteer downloads Chromium which can be slow. Add to Dockerfile:

```dockerfile
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Install Chromium separately
RUN apk add --no-cache chromium
```

### Solution 7: Use Multi-stage Build with Caching

The Dockerfiles already use layer caching. Ensure package.json hasn't changed:

```bash
# Only rebuild if package.json changed
docker-compose build --no-cache backend
```

### Solution 8: Check Network/Firewall

```bash
# Test npm connectivity
docker run --rm node:20-alpine npm config get registry

# Test if you can reach npm
docker run --rm node:20-alpine wget -O- https://registry.npmjs.org
```

### Solution 9: Use npm cache in Docker

```dockerfile
# Add before npm install
RUN npm cache clean --force
```

### Solution 10: Build Without Cache

Sometimes cached layers cause issues:

```bash
docker-compose build --no-cache
docker-compose up -d
```

## Quick Fix Commands

```bash
# Stop everything
docker-compose down

# Remove all containers and volumes
docker-compose down -v

# Clean Docker build cache
docker builder prune

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

## Check What's Happening

```bash
# Build with verbose output
docker-compose build --progress=plain backend 2>&1 | tee build.log

# Check if npm is actually running
docker-compose build backend
# In another terminal:
docker ps
docker exec -it <container-id> ps aux | grep npm
```

## Alternative: Use Pre-built Images

If builds keep failing, you can:

1. Build images separately:
```bash
cd backend
docker build -f Dockerfile.dev -t website-scraper-backend:dev .

cd ../frontend
docker build -f Dockerfile.dev -t website-scraper-frontend:dev .
```

2. Then use docker-compose with pre-built images

## Still Having Issues?

1. Check Docker logs: `docker-compose logs backend`
2. Check system resources: `docker stats`
3. Try building one service at a time:
   ```bash
   docker-compose build postgres
   docker-compose build backend
   docker-compose build frontend
   ```

