# 🚀 Deployment Guide - 3Commas AI Trader

## Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env.local

# Run migrations
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# Start dev server
pnpm dev

# Visit http://localhost:3000
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Stop services
docker-compose down

# Access at http://localhost:3000
```

## Production Deployment

### Manus Cloud (Recommended)

1. **Create Checkpoint**
   ```bash
   # Ensure all changes are committed
   git add .
   git commit -m "Production ready"
   ```

2. **Click Publish in Management UI**
   - Select deployment region
   - Configure custom domain
   - Set environment variables
   - Deploy with one click

3. **Verify Deployment**
   - Check health endpoint: `https://your-domain.com/health`
   - Monitor logs in dashboard
   - Test API endpoints

### Docker Swarm / Kubernetes

```bash
# Build production image
docker build -t cryptotrader:latest .

# Push to registry
docker tag cryptotrader:latest your-registry/cryptotrader:latest
docker push your-registry/cryptotrader:latest

# Deploy with Kubernetes
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

## Environment Variables

### Required
```env
DATABASE_URL=mysql://user:password@host:3306/cryptotrader
JWT_SECRET=your-secret-key-here
VITE_APP_ID=your-oauth-app-id
OAUTH_SERVER_URL=https://oauth.example.com
VITE_OAUTH_PORTAL_URL=https://login.example.com
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
```

### Optional
```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
ENABLE_METRICS=true
```

## Database Setup

### MySQL

```sql
-- Create database
CREATE DATABASE cryptotrader;
USE cryptotrader;

-- Run migrations
-- Migrations are auto-applied on startup
```

### Backup & Recovery

```bash
# Backup database
mysqldump -u user -p cryptotrader > backup.sql

# Restore database
mysql -u user -p cryptotrader < backup.sql
```

## Monitoring & Logging

### Health Checks

```bash
# Check app health
curl http://localhost:3000/health

# Check database
curl http://localhost:3000/api/health/db

# Check API connectivity
curl http://localhost:3000/api/health/apis
```

### Logs

```bash
# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f mysql

# View Redis logs
docker-compose logs -f redis
```

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  app:
    deploy:
      replicas: 3
    environment:
      - REDIS_URL=redis://redis:6379
```

### Load Balancing

```nginx
# nginx.conf
upstream cryptotrader {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://cryptotrader;
    }
}
```

## Security

### API Key Encryption

All API credentials are encrypted using AES-256-GCM before storage:

```typescript
// Encryption happens automatically
const encrypted = encryptCredential(apiKey);
const decrypted = decryptCredential(encrypted);
```

### SSL/TLS

```bash
# Enable HTTPS
export HTTPS=true
export SSL_CERT=/path/to/cert.pem
export SSL_KEY=/path/to/key.pem
```

### Rate Limiting

```typescript
// Configured in middleware
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
mysql -h localhost -u user -p -e "SELECT 1"

# Check connection string
echo $DATABASE_URL
```

### API Integration Failures

```bash
# Test 3Commas API
curl -X GET "https://api.3commas.io/api/v1/accounts" \
  -H "Authorization: Bearer YOUR_API_KEY"

# Test Kraken API
curl -X GET "https://api.kraken.com/0/public/Ticker?pair=XBTUSDT"
```

### Memory Issues

```bash
# Check memory usage
docker stats

# Increase memory limit
docker-compose.yml:
  services:
    app:
      mem_limit: 2g
```

## Backup & Recovery

### Automated Backups

```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Schedule with cron
0 2 * * * /scripts/backup.sh
```

### Disaster Recovery

```bash
# Restore from backup
gunzip < /backups/backup_20240704_020000.sql.gz | mysql -u user -p cryptotrader

# Verify restoration
mysql -u user -p cryptotrader -e "SELECT COUNT(*) FROM bots;"
```

## Performance Optimization

### Database Indexing

```sql
-- Add indexes for common queries
CREATE INDEX idx_bots_user ON bots(userId);
CREATE INDEX idx_deals_bot ON deals(botId);
CREATE INDEX idx_trades_timestamp ON trades(createdAt);
CREATE INDEX idx_market_data_pair ON market_data(pair, timestamp);
```

### Caching

```typescript
// Redis caching configured
const cache = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

// Cache bot data for 5 minutes
const bots = await cache.getex('bots:' + userId, {
  EX: 300
});
```

### Query Optimization

```typescript
// Use database views for complex queries
CREATE VIEW bot_performance AS
SELECT b.id, b.botName, 
       COUNT(d.id) as total_deals,
       AVG(d.profitLoss) as avg_profit,
       SUM(d.profitLoss) as total_profit
FROM bots b
LEFT JOIN deals d ON b.id = d.botId
GROUP BY b.id;
```

## Maintenance

### Regular Tasks

- **Daily**: Check logs and health metrics
- **Weekly**: Review performance metrics and optimize queries
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Full system audit and capacity planning

### Updates

```bash
# Update dependencies
pnpm update

# Update Docker images
docker-compose pull
docker-compose up -d

# Database migrations
pnpm drizzle-kit migrate
```

## Support & Monitoring

- **Status Page**: https://status.example.com
- **Monitoring**: Datadog / New Relic integration
- **Alerts**: Slack / PagerDuty notifications
- **Support**: support@example.com

---

**For additional help, see README.md or contact the development team.**
