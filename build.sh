#!/bin/bash

# Build script for Netlify deployment
echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
cd client
npm install

# Build the project
echo "Building project..."
npm run build

echo "Build completed successfully!"
