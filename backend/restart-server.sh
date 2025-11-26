#!/bin/bash
# Script to restart the backend server

echo "Stopping server on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No server running on port 3000"

echo "Waiting 2 seconds..."
sleep 2

echo "Starting server..."
cd "$(dirname "$0")"
npm start

