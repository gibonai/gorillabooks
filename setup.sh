#!/bin/bash

set -e

echo "🦍 GorillaBooks Setup Script"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
else
    echo "✅ .env file already exists"
fi

# Install root dependencies
echo ""
echo "📦 Installing root dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start development:"
echo "   Option 1 (Docker - Recommended):"
echo "     docker-compose up"
echo ""
echo "   Option 2 (Manual):"
echo "     Terminal 1: cd backend && npm run dev"
echo "     Terminal 2: cd frontend && npm run dev"
echo "     Terminal 3: docker run -d -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=gorillabooks -e MONGO_INITDB_ROOT_PASSWORD=dev-password mongo:7"
echo ""
echo "📍 Access the app:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo "   Health:   http://localhost:3000/health"
echo ""
