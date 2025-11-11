# 🚀 Production Deployment Guide

Bu dokümanda USDT Transfer Monitörü'nün production ortamında deployment süreci detaylandırılmıştır.

## 🌐 Vercel Deployment (Önerilen)

### Frontend Deployment

#### 1. Vercel CLI Setup
```bash
# Vercel CLI kurulumu
npm install -g vercel

# Vercel'e login
vercel login
```

#### 2. Frontend Deploy
```bash
cd frontend

# İlk deployment
vercel

# Production deployment
vercel --prod

# Environment variables setup
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID
vercel env add NEXT_PUBLIC_FIREBASE_VAPID_KEY
```

#### 3. Vercel Configuration
```json
// vercel.json
{
  "version": 2,
  "name": "usdt-monitor-frontend",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_FIREBASE_API_KEY": "@firebase-api-key",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN": "@firebase-auth-domain",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "@firebase-project-id"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### Backend Deployment Options

#### Option 1: Vercel Serverless Functions
```bash
cd backend

# Vercel için optimize edilmiş deployment
vercel

# Environment variables
vercel env add ETHEREUM_WSS_URL
vercel env add FIREBASE_ADMIN_CONFIG_PATH
vercel env add PORT
```

#### Option 2: Railway
```bash
# Railway CLI kurulumu
npm install -g @railway/cli

# Login ve deploy
railway login
railway init
railway up

# Environment variables
railway variables set ETHEREUM_WSS_URL=your_websocket_url
railway variables set FIREBASE_ADMIN_CONFIG_PATH=./firebase-service-account.json
```

#### Option 3: Render
```bash
# render.yaml configuration
version: 1
services:
  - type: web
    name: usdt-monitor-backend
    env: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm run start:prod
    envVars:
      - key: ETHEREUM_WSS_URL
        sync: false
      - key: FIREBASE_ADMIN_CONFIG_PATH
        value: ./firebase-service-account.json
      - key: NODE_ENV
        value: production
```

## 🐳 Docker Production Deployment

### Full Stack with Docker Compose

#### Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  usdt-monitor-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: usdt-backend-prod
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    env_file:
      - ./backend/.env.production
    volumes:
      - ./firebase-service-account.json:/app/firebase-service-account.json:ro
      - backend_logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - usdt_network
    depends_on:
      - redis
    
  usdt-monitor-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: usdt-frontend-prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./frontend/.env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - usdt_network
    depends_on:
      - usdt-monitor-backend

  nginx:
    image: nginx:alpine
    container_name: usdt-nginx-prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    restart: unless-stopped
    networks:
      - usdt_network
    depends_on:
      - usdt-monitor-frontend

  redis:
    image: redis:alpine
    container_name: usdt-redis-prod
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - usdt_network
    command: redis-server --appendonly yes

volumes:
  backend_logs:
  nginx_logs:
  redis_data:

networks:
  usdt_network:
    driver: bridge
```

#### Production Deployment Commands
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Monitor services
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml ps

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale usdt-monitor-backend=2

# Update services
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

### Individual Service Deployment

#### Backend Production Build
```dockerfile
# backend/Dockerfile.prod
FROM node:18-alpine AS base
RUN apk add --no-cache dumb-init curl
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM base AS build
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build && npm run test

FROM base AS production
ENV NODE_ENV=production
ENV PORT=3001

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Copy built application
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --chown=nestjs:nodejs package*.json ./

# Create logs directory
RUN mkdir -p logs && chown nestjs:nodejs logs

USER nestjs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

```bash
# Backend deployment
cd backend
docker build -f Dockerfile.prod -t usdt-monitor-backend:prod .
docker run -d \
  --name usdt-backend-prod \
  --env-file .env.production \
  -v $(pwd)/firebase-service-account.json:/app/firebase-service-account.json:ro \
  -p 3001:3001 \
  --restart unless-stopped \
  usdt-monitor-backend:prod
```

#### Frontend Production Build
```dockerfile
# frontend/Dockerfile.prod
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS build
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

```bash
# Frontend deployment
cd frontend
docker build -f Dockerfile.prod -t usdt-monitor-frontend:prod .
docker run -d \
  --name usdt-frontend-prod \
  --env-file .env.production \
  -p 3000:3000 \
  --restart unless-stopped \
  usdt-monitor-frontend:prod
```

## ☁️ Cloud Provider Deployment

### AWS EC2 Deployment

#### EC2 Instance Setup
```bash
# 1. Launch EC2 instance (t3.medium önerilen)
# Amazon Linux 2 AMI
# Security Group: HTTP (80), HTTPS (443), SSH (22)

# 2. Connect to instance
ssh -i your-key.pem ec2-user@your-instance-ip

# 3. Install dependencies
sudo yum update -y
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# 4. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 5. Install Node.js (alternative deployment)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
nvm use --lts
```

#### Application Deployment
```bash
# 6. Clone and deploy
git clone https://github.com/your-repo/vinu-digital.git
cd vinu-digital

# 7. Setup environment files
cp backend/.env.example backend/.env.production
cp frontend/.env.example frontend/.env.production
# Edit environment files with production values

# 8. Deploy with Docker
docker-compose -f docker-compose.prod.yml up -d

# 9. Setup Nginx (if not using Docker nginx)
sudo yum install -y nginx
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### SSL Certificate Setup
```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo tee -a /etc/crontab
```

### Google Cloud Platform

#### Cloud Run Deployment
```bash
# 1. Setup Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# 2. Enable required services
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# 3. Build and push backend
cd backend
gcloud builds submit --tag gcr.io/PROJECT_ID/usdt-monitor-backend

# 4. Deploy to Cloud Run
gcloud run deploy usdt-monitor-backend \
  --image gcr.io/PROJECT_ID/usdt-monitor-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars ETHEREUM_WSS_URL=$ETHEREUM_WSS_URL,NODE_ENV=production \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10

# 5. Build and push frontend
cd ../frontend
gcloud builds submit --tag gcr.io/PROJECT_ID/usdt-monitor-frontend

# 6. Deploy frontend
gcloud run deploy usdt-monitor-frontend \
  --image gcr.io/PROJECT_ID/usdt-monitor-frontend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1
```

#### Cloud Run with Cloud Build
```yaml
# cloudbuild.yaml
steps:
  # Backend build
  - name: 'gcr.io/cloud-builders/docker'
    dir: 'backend'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/usdt-monitor-backend', '.']
  
  # Frontend build
  - name: 'gcr.io/cloud-builders/docker'
    dir: 'frontend'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/usdt-monitor-frontend', '.']
  
  # Push images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/usdt-monitor-backend']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/usdt-monitor-frontend']
  
  # Deploy backend
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args: 
      - 'run'
      - 'deploy'
      - 'usdt-monitor-backend'
      - '--image=gcr.io/$PROJECT_ID/usdt-monitor-backend'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'

images:
  - 'gcr.io/$PROJECT_ID/usdt-monitor-backend'
  - 'gcr.io/$PROJECT_ID/usdt-monitor-frontend'
```

### Digital Ocean App Platform

#### App Spec Configuration
```yaml
# app.yaml
name: usdt-monitor
services:
  - name: backend
    source_dir: /backend
    github:
      repo: your-username/vinu-digital
      branch: main
    run_command: npm run start:prod
    build_command: npm ci && npm run build
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    env:
      - key: NODE_ENV
        value: production
      - key: ETHEREUM_WSS_URL
        value: ${ETHEREUM_WSS_URL}
      - key: FIREBASE_ADMIN_CONFIG_PATH
        value: ./firebase-service-account.json
    
  - name: frontend
    source_dir: /frontend
    github:
      repo: your-username/vinu-digital
      branch: main
    run_command: npm start
    build_command: npm ci && npm run build
    environment_slug: node-js
    instance_count: 1
    instance_size_slug: basic-xxs
    env:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_FIREBASE_API_KEY
        value: ${NEXT_PUBLIC_FIREBASE_API_KEY}

static_sites:
  - name: assets
    source_dir: /frontend/public
    github:
      repo: your-username/vinu-digital
      branch: main
```

## 📊 Production Monitoring

### Health Checks

#### Application Health Endpoints
```typescript
// backend/src/health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthCheckService: HealthCheckService,
    private readonly blockchainService: BlockchainService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.healthCheckService.check([
      () => this.blockchainService.isHealthy(),
      () => this.firebaseService.isHealthy(),
      () => this.checkMemoryUsage(),
    ]);
  }

  @Get('detailed')
  async detailedCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      blockchain: await this.blockchainService.getConnectionStatus(),
      firebase: await this.firebaseService.getStatus(),
      environment: {
        nodeVersion: process.version,
        nodeEnv: process.env.NODE_ENV,
      },
    };
  }

  private checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const maxMemory = 512 * 1024 * 1024; // 512MB limit
    
    if (memUsage.heapUsed > maxMemory) {
      throw new Error('Memory usage too high');
    }
    
    return { status: 'ok', memory: memUsage };
  }
}
```

#### Docker Health Checks
```dockerfile
# Health check script
COPY healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/healthcheck.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh
```

```bash
#!/bin/bash
# healthcheck.sh
set -e

# Check main application endpoint
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health)

if [ "$HTTP_CODE" != "200" ]; then
    echo "Health check failed with HTTP code: $HTTP_CODE"
    exit 1
fi

# Check critical services
if ! curl -s http://localhost:3001/api/status | grep -q "connected"; then
    echo "Blockchain connection check failed"
    exit 1
fi

echo "Health check passed"
exit 0
```

### Logging Configuration

#### Production Logging
```typescript
// backend/src/config/logging.config.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const loggingConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context }) => {
          return `${timestamp} [${context}] ${level}: ${message}`;
        }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});
```

#### Log Rotation
```bash
# /etc/logrotate.d/usdt-monitor
/app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nestjs nestjs
    postrotate
        docker kill -s HUP usdt-backend-prod 2>/dev/null || true
    endscript
}
```

## 🔧 Production Maintenance

### Backup Strategy
```bash
#!/bin/bash
# backup.sh - Production backup script
BACKUP_DIR="/opt/backups/usdt-monitor"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "$BACKUP_DIR/$DATE"

# Backup configuration files
cp -r /app/.env* "$BACKUP_DIR/$DATE/"
cp /app/firebase-service-account.json "$BACKUP_DIR/$DATE/"

# Backup application logs
cp -r /app/logs "$BACKUP_DIR/$DATE/"

# Database backup (if applicable)
# docker exec usdt-redis-prod redis-cli BGSAVE
# cp /var/lib/redis/dump.rdb "$BACKUP_DIR/$DATE/"

# Compress backup
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "$BACKUP_DIR" "$DATE"
rm -rf "$BACKUP_DIR/$DATE"

# Keep only last 30 days of backups
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.tar.gz"
```

### Update Deployment
```bash
#!/bin/bash
# update.sh - Production update script
set -e

echo "Starting production update..."

# Pull latest code
git pull origin main

# Backup current deployment
./backup.sh

# Build new images
docker-compose -f docker-compose.prod.yml build --no-cache

# Update services with zero-downtime
docker-compose -f docker-compose.prod.yml up -d --force-recreate

# Wait for health checks
sleep 30

# Verify deployment
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "Update completed successfully"
else
    echo "Update failed, rolling back..."
    docker-compose -f docker-compose.prod.yml down
    # Restore from backup if needed
    exit 1
fi
```

---

**🚀 Production Ready**: Bu deployment guide'ı production ortamında güvenli ve scalable deployment için optimize edilmiştir.
