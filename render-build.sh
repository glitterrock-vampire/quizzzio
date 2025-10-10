#!/bin/bash
# Exit on error
set -o errexit

# Install all dependencies including devDependencies
npm install --include=dev

# Build the application
npm run build

# Clean up devDependencies if needed
# npm prune --production
