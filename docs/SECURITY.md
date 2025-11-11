# 🔐 Güvenlik ve Best Practices

Bu dokümanda USDT Transfer Monitörü projesinin güvenlik önlemleri ve best practice'leri detaylandırılmıştır.

## 🛡️ Data Protection

### Environment Security

#### Sensitive Files Protection
```bash
# .gitignore'da korunması gereken dosyalar
.env
.env.local
firebase-service-account.json
*.log
*.key
*.pem
node_modules/
dist/
coverage/

# File permissions (Linux/macOS)
chmod 600 .env
chmod 600 .env.local
chmod 600 firebase-service-account.json
chown $USER:$USER firebase-service-account.json

# Windows
icacls firebase-service-account.json /grant:r "%USERNAME%":R
```

#### Environment Variable Validation
```typescript
// Environment variable validation
const requiredEnvVars = [
  'ETHEREUM_WSS_URL',
  'FIREBASE_ADMIN_CONFIG_PATH',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_VAPID_KEY'
];

// Startup validation
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Required environment variable ${envVar} is not set`);
  }
});

// Input validation with Joi
import Joi from 'joi';

const configSchema = Joi.object({
  ethereumWssUrl: Joi.string().uri().required(),
  firebaseAdminConfigPath: Joi.string().required(),
  port: Joi.number().port().default(3001)
});
```

### API Security

#### Rate Limiting
```typescript
// Express rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

#### Request Validation
```typescript
// Input sanitization
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class SubscribeTokenDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  token: string;
}
```

## 🔒 Production Security

### HTTPS Enforcement

#### Nginx Configuration
```nginx
# /etc/nginx/sites-available/usdt-monitor
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```

#### Let's Encrypt SSL Setup
```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Docker Security

#### Multi-stage Dockerfile Security
```dockerfile
# Backend Dockerfile with security best practices
FROM node:18-alpine AS base
RUN apk add --no-cache dumb-init
ENV NODE_ENV production
WORKDIR /app
COPY package*.json ./

FROM base AS build
ENV NODE_ENV development
RUN npm ci --only=development && npm cache clean --force
COPY . .
RUN npm run build && npm prune --production

FROM base AS production
# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Copy built application
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /app/package*.json ./

# Switch to non-root user
USER nestjs

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Security labels
LABEL security.non-root=true
LABEL security.no-new-privileges=true
```

#### Docker Compose Security
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    read_only: true
    tmpfs:
      - /tmp
      - /var/tmp
    volumes:
      - ./firebase-service-account.json:/app/firebase-service-account.json:ro
    networks:
      - internal
    restart: unless-stopped
    
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    read_only: true
    tmpfs:
      - /tmp
      - /var/tmp
    networks:
      - internal
    restart: unless-stopped

networks:
  internal:
    driver: bridge
```

## 🔐 Firebase Security

### Service Account Security
```typescript
// Secure Firebase initialization
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

export class FirebaseSecurityService {
  private static instance: admin.app.App;
  
  public static initializeSecurely(): admin.app.App {
    if (this.instance) {
      return this.instance;
    }
    
    try {
      const serviceAccountPath = process.env.FIREBASE_ADMIN_CONFIG_PATH;
      
      if (!serviceAccountPath) {
        throw new Error('Firebase service account path not configured');
      }
      
      // Validate file exists and has correct permissions
      const stats = require('fs').statSync(serviceAccountPath);
      if (stats.mode & 0o077) {
        throw new Error('Firebase service account file has overly broad permissions');
      }
      
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
      
      // Validate required fields
      const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
      for (const field of requiredFields) {
        if (!serviceAccount[field]) {
          throw new Error(`Missing required field in service account: ${field}`);
        }
      }
      
      this.instance = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      
      return this.instance;
    } catch (error) {
      throw new Error(`Failed to initialize Firebase securely: ${error.message}`);
    }
  }
}
```

### FCM Token Security
```typescript
// Secure FCM token handling
export class FCMSecurityService {
  private static readonly TOKEN_PATTERN = /^[A-Za-z0-9_-]{152}$/;
  private static readonly MAX_TOKENS = 1000000; // FCM limit
  
  public static validateToken(token: string): boolean {
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    // Check token format
    if (!this.TOKEN_PATTERN.test(token)) {
      return false;
    }
    
    // Additional security checks
    if (token.includes('..') || token.includes('//')) {
      return false;
    }
    
    return true;
  }
  
  public static sanitizeToken(token: string): string {
    return token.replace(/[^A-Za-z0-9_-]/g, '');
  }
}
```

## 🛡️ Blockchain Security

### WebSocket Connection Security
```typescript
// Secure WebSocket connection
export class BlockchainSecurityService {
  private static readonly TRUSTED_PROVIDERS = [
    'wss://eth-mainnet.ws.alchemyapi.io',
    'wss://mainnet.infura.io',
    'wss://eth-mainnet.gateway.pokt.network'
  ];
  
  public static validateProvider(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      
      // Must use WSS (secure WebSocket)
      if (parsedUrl.protocol !== 'wss:') {
        return false;
      }
      
      // Check against trusted providers
      const isTrusted = this.TRUSTED_PROVIDERS.some(provider => 
        url.startsWith(provider)
      );
      
      if (!isTrusted) {
        console.warn(`Untrusted WebSocket provider: ${parsedUrl.hostname}`);
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  public static createSecureProvider(url: string): ethers.WebSocketProvider {
    if (!this.validateProvider(url)) {
      throw new Error('Invalid or insecure WebSocket provider URL');
    }
    
    return new ethers.WebSocketProvider(url, {
      reconnect: {
        auto: true,
        delay: 5000,
        maxAttempts: 5,
        onTimeout: false
      }
    });
  }
}
```

### Transaction Validation
```typescript
// Secure transaction data validation
export class TransactionSecurityService {
  private static readonly USDT_CONTRACT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
  private static readonly MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
  
  public static validateTransferEvent(event: any): boolean {
    try {
      // Validate contract address
      if (event.address?.toLowerCase() !== this.USDT_CONTRACT.toLowerCase()) {
        return false;
      }
      
      // Validate addresses
      if (!ethers.isAddress(event.args.from) || !ethers.isAddress(event.args.to)) {
        return false;
      }
      
      // Validate amount
      const amount = BigInt(event.args.value);
      if (amount < 0 || amount > this.MAX_UINT256) {
        return false;
      }
      
      // Validate transaction hash
      if (!event.transactionHash || !/^0x[a-fA-F0-9]{64}$/.test(event.transactionHash)) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
}
```

## 🔍 Security Monitoring

### Logging Security Events
```typescript
// Security event logging
export class SecurityLogger {
  private static readonly LOG_LEVELS = {
    SECURITY: 'SECURITY',
    AUDIT: 'AUDIT',
    THREAT: 'THREAT'
  };
  
  public static logSecurityEvent(level: string, event: string, details: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      event,
      details: this.sanitizeLogData(details),
      source: 'USDT-Monitor'
    };
    
    // Log to secure location
    console.log(JSON.stringify(logEntry));
    
    // Send to security monitoring service if configured
    if (process.env.SECURITY_WEBHOOK_URL) {
      this.sendToSecurityService(logEntry);
    }
  }
  
  private static sanitizeLogData(data: any): any {
    const sanitized = { ...data };
    
    // Remove sensitive information
    delete sanitized.privateKey;
    delete sanitized.token;
    delete sanitized.password;
    delete sanitized.secret;
    
    return sanitized;
  }
}
```

### Intrusion Detection
```typescript
// Basic intrusion detection
export class IntrusionDetection {
  private static attemptCounts = new Map<string, number>();
  private static readonly MAX_ATTEMPTS = 10;
  private static readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  
  public static checkForAnomalies(ip: string, endpoint: string): boolean {
    const key = `${ip}:${endpoint}`;
    const now = Date.now();
    
    // Clean old entries
    for (const [k, timestamp] of this.attemptCounts) {
      if (now - timestamp > this.WINDOW_MS) {
        this.attemptCounts.delete(k);
      }
    }
    
    // Check current attempts
    const attempts = this.attemptCounts.get(key) || 0;
    
    if (attempts >= this.MAX_ATTEMPTS) {
      SecurityLogger.logSecurityEvent('THREAT', 'Rate limit exceeded', {
        ip,
        endpoint,
        attempts
      });
      return true; // Suspicious activity detected
    }
    
    this.attemptCounts.set(key, attempts + 1);
    return false;
  }
}
```

## 📋 Security Checklist

### Development Security
- [ ] **Environment Variables**: All sensitive data in .env files
- [ ] **Git Security**: firebase-service-account.json in .gitignore  
- [ ] **Dependency Security**: Regular `npm audit` checks
- [ ] **Code Reviews**: Security-focused code reviews
- [ ] **Static Analysis**: ESLint security rules enabled

### Production Security
- [ ] **HTTPS Only**: SSL certificates properly configured
- [ ] **Security Headers**: All security headers implemented
- [ ] **File Permissions**: Restricted access to sensitive files
- [ ] **User Privileges**: Non-root container execution
- [ ] **Network Security**: Firewall rules configured

### Firebase Security
- [ ] **Service Account**: Minimal required permissions
- [ ] **Project Settings**: Appropriate security rules
- [ ] **Token Validation**: FCM token format validation
- [ ] **Access Control**: Proper IAM roles assigned

### Blockchain Security
- [ ] **Provider Validation**: Trusted WebSocket providers only
- [ ] **Connection Security**: WSS (secure WebSocket) protocol
- [ ] **Data Validation**: All blockchain data validated
- [ ] **Rate Limiting**: Provider rate limits respected

---

**⚠️ Security Notice**: Bu güvenlik önlemleri production ortamında uygulanmalıdır. Güvenlik sürekli bir süreç olduğu için düzenli güncellemeler yapılmalıdır.
