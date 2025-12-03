# Quick Fix for npm install Hanging

## The Problem
Puppeteer downloads Chromium (~170MB) during `npm install`, which can hang or be very slow.

## The Solution
I've updated the Dockerfiles to:
1. Install Chromium via Alpine package manager (faster, more reliable)
2. Skip Puppeteer's Chromium download
3. Use system Chromium instead

## Rebuild Now

```bash
# Stop everything
docker-compose down

# Clean build cache
docker builder prune -f

# Rebuild (should be much faster now)
docker-compose build --no-cache

# Start services
docker-compose up -d
```

## What Changed

### Before:
- Puppeteer downloads Chromium during npm install (slow, can hang)

### After:
- Chromium installed via `apk add chromium` (fast, reliable)
- Puppeteer skips download with `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`
- Uses system Chromium at `/usr/bin/chromium-browser`

## Expected Build Time

- **Before**: 5-10+ minutes (or hangs)
- **After**: 2-3 minutes

## Verify It Works

After build completes:
```bash
# Check logs
docker-compose logs backend

# Should see server starting without errors
```

If you see any Puppeteer/Chromium errors, the scraper config has been updated to handle it automatically.


