#!/bin/sh
set -e

echo "Generating Prisma Client..."
npx prisma generate

echo "Running migrations..."
npx prisma migrate dev --name init || npx prisma migrate deploy

echo "Starting server..."
exec npm run dev
