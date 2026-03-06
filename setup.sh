#!/bin/bash

# Zion Orchestrator One-Click Installer
# For Mac and Linux

echo "------------------------------------------------"
echo "Initializing Zion Orchestrator Installation..."
echo "------------------------------------------------"

# Check for Node.js version >= 18
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

# Check for npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm first."
    exit 1
fi

# Check for git
if ! command -v git &> /dev/null; then
    echo "❌ git not found. Please install git first."
    exit 1
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "VITE_GEMINI_API_KEY=" >> .env
    echo "GATEWAY_URL=http://localhost:18789" >> .env
    echo "⚠️  Please edit .env later if you want to add your Gemini API Key."
fi

# Install dependencies
echo "📦 Installing dependencies (this may take a minute)..."
npm install --no-fund --no-audit --no-optional

# Build the project
echo "🏗️  Building the frontend assets..."
npm run build

# Install OpenClaw Gateway
echo "🌐 Setting up OpenClaw Gateway..."
if [ ! -d "gateway" ]; then
    npm run install-gateway
else
    echo "✅ Gateway already exists."
fi

# Start the application
echo "🚀 Starting Zion Orchestrator..."
echo "🌐 Automatically opening the dashboard in your browser..."
echo "------------------------------------------------"
npm run dev
