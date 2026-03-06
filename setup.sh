#!/bin/bash

# Zion Orchestrator One-Click Installer
# For Mac and Linux

echo "Initializing Zion Orchestrator Installation..."

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Please install Node.js (v18+) first."
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "npm not found. Please install npm first."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building the project..."
npm run build

# Install OpenClaw Gateway
echo "Setting up OpenClaw Gateway..."
npm run install-gateway

# Start the application
echo "Starting Zion Orchestrator..."
echo "Automatically opening the dashboard in your browser..."
npm start
