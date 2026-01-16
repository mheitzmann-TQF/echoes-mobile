#!/bin/bash
# Start both Expo Metro (port 8081) and Express API server (port 5000)
# Express handles /api/* and proxies other requests to Metro for the web preview

set -e

echo "Starting Echoes development server..."

# Kill any existing processes on our ports
fuser -k 5000/tcp 2>/dev/null || true
fuser -k 8081/tcp 2>/dev/null || true
sleep 1

# Start Expo web on port 8081 (Metro bundler)
echo "Starting Expo Metro on port 8081..."
CI=1 npx expo start --web --port 8081 &
EXPO_PID=$!

# Wait for Metro to be ready
echo "Waiting for Metro to initialize..."
for i in {1..30}; do
  if curl -s http://localhost:8081 > /dev/null 2>&1; then
    echo "Metro is ready!"
    break
  fi
  sleep 1
done

# Start Express server on port 5000 (handles API + proxies to Metro)
echo "Starting Express API server on port 5000..."
PORT=5000 HOST=0.0.0.0 npx tsx server/index.ts &
SERVER_PID=$!

echo "Both services starting. Webview available at port 5000."

# Handle shutdown
trap "kill $EXPO_PID $SERVER_PID 2>/dev/null" EXIT

# Wait for both processes
wait $EXPO_PID $SERVER_PID
