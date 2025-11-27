#!/bin/sh
set -e

echo "Generating Prisma Client..."
npx prisma generate

echo "Running migrations..."
# Use migrate deploy which doesn't require a shadow database
# This is safer for Docker environments
npx prisma migrate deploy || echo "No migrations to deploy, database may already be up to date"

echo "Starting server..."
exec npm run dev
