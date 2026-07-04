# CryptoTrader Pro - Production Deployment Guide

## Overview

CryptoTrader Pro is a full-stack crypto trading platform with real-time market data, AI analytics, Pine Script backtesting, and multi-platform bot management. This guide covers production deployment.

## Pre-Deployment Checklist

- [ ] Environment variables configured (.env.production)
- [ ] Database migrations applied
- [ ] API credentials encrypted and stored securely
- [ ] SSL/TLS certificates configured
- [ ] Rate limiting tested
- [ ] WebSocket connections verified
- [ ] All tests passing (26/29 minimum)
- [ ] Docker build successful
- [ ] Backup strategy in place

## Environment Variables

Create `.env.production`:

```bash
# Database
DATABASE_URL=mysql://user:password@host:3306/cryptotrader

# OAuth
VITE_APP_ID=your-manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/login
JWT_SECRET=your-secure-jwt-secret

# API Keys (encrypted in database)
# Users add these via Settings page

# LLM
BUILT_IN_FORGE_API_KEY=your-forge-key
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge

# Storage
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge

# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id

# App Info
VITE_APP_TITLE=CryptoTrader Pro
VITE_APP_LOGO=https://your-domain.com/logo.png
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-open-id

# Node
NODE_ENV=production
PORT=3000
```

## Deployment Options

### Option 1: Manus Platform (Recommended)

**Advantages:**
- One-click deployment
- Automatic SSL/TLS
- Built-in database
- Automatic scaling
- No infrastructure management

**Steps:**
1. In Management UI, click **"Publish"** button
2. Configure custom domain (optional)
3. Review deployment settings
4. Click **"Deploy"**
5. Wait for deployment to complete (~2-5 minutes)

**URL:** Your app will be available at `https://your-domain.manus.space`

### Option 2: Docker (Self-Hosted)

**Requirements:**
- Docker & Docker Compose
- MySQL 8.0+
- Node.js 20+
- 2GB RAM minimum

**Steps:**

```bash
# 1. Clone repository
git clone https://github.com/yourusername/cryptotrader-pro.git
cd cryptotrader-pro

# 2. Configure environment
cp .env.example .env.production
# Edit .env.production with your settings

# 3. Build and deploy
docker-compose -f docker-compose.yml up -d --build

# 4. Run migrations
docker-compose exec app pnpm drizzle-kit migrate

# 5. Verify
curl http://localhost:3000
```

**URL:** Your app will be available at `http://your-server-ip:3000`

### Option 3: Cloud Platforms

**Supported Platforms:**
- Railway.app
- Render.com
- Heroku
- AWS EC2
- Google Cloud Run
- DigitalOcean

**General Steps:**
1. Push code to GitHub
2. Connect repository to platform
3. Configure environment variables
4. Set build command: `pnpm build`
5. Set start command: `pnpm start`
6. Deploy

## Post-Deployment Verification

### Health Checks

```bash
# Check API health
curl https://your-domain.com/api/health

# Check WebSocket connection
wscat -c wss://your-domain.com/api/ws

# Check database connection
curl https://your-domain.com/api/trpc/system.health
```

### Monitor Logs

```bash
# Manus Platform
# View in Management UI → Dashboard → Logs

# Docker
docker-compose logs -f app

# Cloud Platforms
# Check platform's logging dashboard
```

### Test Features

1. **Authentication**
   - Sign up with email
   - Verify OAuth flow
   - Check session persistence

2. **Bot Management**
   - Connect 3Commas account
   - Sync bots
   - Verify bot metrics display

3. **Real-time Updates**
   - Open WebSocket connection
   - Subscribe to market data
   - Verify price updates

4. **AI Features**
   - Test AI chat assistant
   - Run Pine Script backtest
   - Verify AI recommendations

## Performance Optimization

### Database

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_bots_user_id ON bots(user_id);
CREATE INDEX idx_deals_bot_id ON deals(bot_id);
CREATE INDEX idx_market_data_symbol ON market_data(symbol);
CREATE INDEX idx_trades_user_id ON trades(user_id);
```

### Caching

- Market data cached for 5 seconds
- Bot metrics cached for 30 seconds
- User settings cached for 1 hour

### Rate Limiting

- API: 100 requests/minute per IP
- Auth: 5 requests/15 minutes per IP
- WebSocket: 10 subscriptions per connection

## Security Checklist

- [ ] HTTPS/TLS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] API keys encrypted
- [ ] Database credentials secured
- [ ] JWT secrets rotated
- [ ] WebSocket authenticated
- [ ] SQL injection prevention enabled
- [ ] XSS protection headers set
- [ ] CSRF tokens validated

## Backup & Recovery

### Daily Backups

```bash
# Backup database
mysqldump -u user -p database > backup-$(date +%Y%m%d).sql

# Backup to S3
aws s3 cp backup-$(date +%Y%m%d).sql s3://your-bucket/backups/
```

### Restore from Backup

```bash
# Restore database
mysql -u user -p database < backup-20240704.sql

# Restore from S3
aws s3 cp s3://your-bucket/backups/backup-20240704.sql .
mysql -u user -p database < backup-20240704.sql
```

## Monitoring & Alerts

### Key Metrics to Monitor

- API response time (target: <200ms)
- Database query time (target: <100ms)
- WebSocket connection count
- Error rate (target: <0.1%)
- Memory usage (target: <500MB)
- CPU usage (target: <50%)

### Alert Thresholds

- Error rate > 1%
- Response time > 1000ms
- Database connection pool exhausted
- Memory usage > 1GB
- CPU usage > 80%

## Scaling Considerations

### Horizontal Scaling

- Load balance API requests across multiple instances
- Use Redis for session storage
- Use message queue for async jobs

### Vertical Scaling

- Increase server RAM to 4GB+
- Upgrade CPU to 2+ cores
- Use SSD for database storage

## Troubleshooting

### Common Issues

**WebSocket Connection Failed**
```
Solution: Check firewall rules, verify WSS port is open
```

**Database Connection Error**
```
Solution: Verify DATABASE_URL, check MySQL is running
```

**Rate Limiting Too Strict**
```
Solution: Adjust rate limits in server/_core/rateLimiter.ts
```

**High Memory Usage**
```
Solution: Check for memory leaks, restart service, increase RAM
```

## Support & Documentation

- **Documentation:** See README.md
- **Issues:** GitHub Issues
- **Email:** support@cryptotrader.pro
- **Status:** https://status.cryptotrader.pro

## Version Management

Current Version: **1.0.0**

### Release Notes

**v1.0.0 (2024-07-04)**
- Initial production release
- Multi-platform bot management
- AI analytics engine
- Pine Script backtesting
- Advanced order types
- Real-time WebSocket streaming
- Rate limiting & security hardening

## License

MIT License - See LICENSE file for details
