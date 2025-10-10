#!/bin/bash
# Exit on error
set -o errexit

# Print commands for debugging
set -x

echo "Starting build process..."

# Clean install all dependencies including devDependencies
echo "Installing all dependencies..."
npm install --include=dev

# Verify critical dependencies are installed
echo "Verifying critical dependencies..."
npm list @vitejs/plugin-react vite

# Build the application
echo "Building application..."
npm run build

echo "Build completed successfully!"
