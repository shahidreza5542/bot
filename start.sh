#!/bin/bash

echo "🚀 Toolmetry AI Bot Starter"
echo "=========================="

# Function to cleanup
cleanup() {
    echo ""
    echo "🛑 Stopping bot..."
    pkill -f "node server.js" 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Kill any existing node processes on port 5000
echo "🔍 Cleaning up old processes..."
pkill -f "node server.js" 2>/dev/null
pkill -f "nodemon" 2>/dev/null
sleep 2

PORT_PID=$(lsof -ti:5000 2>/dev/null)
if [ ! -z "$PORT_PID" ]; then
    echo "🛑 Killing process on port 5000"
    kill -9 $PORT_PID 2>/dev/null
fi

echo "✅ Ready to start"
echo ""

# Check for .env
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "Creating .env.example..."
    cat > .env.example << 'ENVFILE'
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_bot_application_id
MONGODB_URI=mongodb://localhost:27017/toolmetry
PORT=5000
ENVFILE
    echo "Please copy .env.example to .env and fill in your values"
    exit 1
fi

# Menu
echo "Choose option:"
echo "1) Start Bot (with auto-restart)"
echo "2) Deploy Commands Only"
echo "3) Start Bot (once, no restart)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo "🤖 Starting Bot with auto-restart..."
        npm run dev
        ;;
    2)
        echo "🚀 Deploying Commands..."
        node deploy-commands.js
        ;;
    3)
        echo "🤖 Starting Bot (no restart)..."
        npm start
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
