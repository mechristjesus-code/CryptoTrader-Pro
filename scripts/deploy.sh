#!/bin/bash
set -e

echo "🚀 Deploying CryptoTrader Pro..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Build
echo -e "${BLUE}[1/4]${NC} Building application..."
pnpm build
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 2: Stop existing containers
echo -e "${BLUE}[2/4]${NC} Stopping existing containers..."
docker-compose down || true
echo -e "${GREEN}✓ Containers stopped${NC}"
echo ""

# Step 3: Start new containers
echo -e "${BLUE}[3/4]${NC} Starting Docker containers..."
docker-compose up -d --build
echo -e "${GREEN}✓ Containers started${NC}"
echo ""

# Step 4: Wait for services
echo -e "${BLUE}[4/4]${NC} Waiting for services to be ready..."
sleep 5
echo -e "${GREEN}✓ Services ready${NC}"
echo ""

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📍 App running at: http://localhost:3000"
echo "📊 Database at: localhost:3306"
echo "🔴 Redis at: localhost:6379"
echo ""
echo "To view logs: docker-compose logs -f app"
echo "To stop: docker-compose down"

