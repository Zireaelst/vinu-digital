# 🚀 USDT Transfer Monitor - Backend

Ethereum blockchain'deki büyük USDT transferlerini gerçek zamanlı olarak izleyen ve Firebase Cloud Messaging (FCM) ile anında bildirimler gönderen NestJS tabanlı backend servisidir.

## ✨ Özellikler

### 🔍 Blockchain Monitoring
- **Gerçek zamanlı USDT izleme**: Ethereum mainnet'te ≥ 100,000 USDT transferlerini izler
- **WebSocket bağlantısı**: Ethereum ağına güvenilir WebSocket bağlantısı
- **Otomatik yeniden bağlanma**: Bağlantı kopmaları için otomatik retry mantığı
- **Event filtering**: Sadece büyük transferleri filtreler ve işler

### 📱 Bildirim Sistemi
- **Firebase push notifications**: Büyük transferler için anında bildirimler
- **Topic-based messaging**: `largeTransfers` topic'ine abone olan tüm cihazlara gönderim
- **Rich notifications**: Transfer detaylarını içeren zengin bildirimler
- **Multi-platform**: Android ve iOS destekli bildirimler

### 📊 Transfer Yönetimi
- **Transfer geçmişi**: Son transferlerin hafızada tutulması
- **İstatistikler**: Transfer istatistikleri ve analitik veriler
- **Cleanup işlemleri**: Eski verilerin otomatik temizlenmesi
- **Performance monitoring**: Sistem performans takibi

### 🔧 Operasyonel
- **Docker desteği**: Production-ready Docker konfigürasyonu
- **Environment configuration**: Güvenli konfigürasyon yönetimi
- **Health checks**: Uygulama sağlık kontrolü
- **Graceful shutdown**: Zarif kapatma mekanizması

## 🛠️ Teknoloji Stack'i

### Core Framework
- **NestJS 11.0.1**: Enterprise-grade Node.js framework
- **Node.js 18+**: Modern JavaScript runtime
- **TypeScript**: Type safety ve developer experience
- **RxJS**: Reactive programming

### Blockchain Integration
- **Ethers.js 6.15.0**: Ethereum blockchain etkileşimi
- **WebSocket Provider**: Gerçek zamanlı event listening
- **Contract Interaction**: USDT smart contract integration

### Notification & Configuration
- **Firebase Admin SDK 13.6.0**: Server-side Firebase operations
- **@nestjs/config 4.0.2**: Configuration management
- **Joi**: Environment validation

### Development & Quality
- **ESLint**: Code linting ve standards
- **Prettier**: Code formatting
- **Jest**: Unit ve integration testing

## 📋 Kurulum

### 1. Sistem Gereksinimleri

```bash
# Node.js 18+ gereklidir
node --version  # v18.0.0+

# npm veya yarn
npm --version
```

### 2. Bağımlılıkları Yükleyin

```bash
cd backend
npm install
```

### 3. Environment Configuration

#### .env Dosyası Oluşturun
```bash
cp .env.example .env
```

#### Environment Variables
`.env` dosyasını düzenleyin:

```bash
# Ethereum WebSocket URL (Zorunlu)
ETHEREUM_WSS_URL=wss://eth-mainnet.ws.alchemyapi.io/v2/YOUR_API_KEY

# Firebase Admin SDK Config Path (Zorunlu)
FIREBASE_ADMIN_CONFIG_PATH=./firebase-service-account.json

# Uygulama Portu (Opsiyonel)
PORT=3001

# Log Level (Opsiyonel)
LOG_LEVEL=info
```

### 4. Ethereum RPC Provider Setup

Aşağıdaki servis sağlayıcılardan birinden WebSocket endpoint alın:

#### Alchemy (Önerilen)
```bash
# 1. https://alchemy.com adresinde hesap oluşturun
# 2. Yeni Ethereum Mainnet app oluşturun
# 3. WebSocket URL'ini kopyalayın
ETHEREUM_WSS_URL=wss://eth-mainnet.ws.alchemyapi.io/v2/YOUR_API_KEY
```

#### Infura
```bash
# 1. https://infura.io adresinde proje oluşturun  
# 2. Ethereum endpoint'i alın
ETHEREUM_WSS_URL=wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID
```

#### QuickNode
```bash
# 1. https://quicknode.com adresinde endpoint oluşturun
ETHEREUM_WSS_URL=wss://your-endpoint.quiknode.pro/YOUR_TOKEN/
```

### 5. Firebase Setup

#### Firebase Console Konfigürasyonu
1. [Firebase Console](https://console.firebase.google.com/)'a gidin
2. Yeni proje oluşturun veya mevcut projeyi seçin
3. **Project Settings** > **Service Accounts** > **Firebase Admin SDK**
4. **Generate new private key** butonuna tıklayın
5. İndirilen JSON dosyasını `firebase-service-account.json` adıyla backend klasörüne kaydedin

#### Cloud Messaging Setup
```bash
# Firebase Console'da Cloud Messaging'i etkinleştirin
# Project Settings > Cloud Messaging > Enable API
```

### 6. Konfigürasyonu Doğrulayın

```bash
# Environment variables kontrolü
npm run check:env

# Configuration validation
npm run validate:config
```

## 🚀 Uygulamayı Çalıştırma

### Development Mode

```bash
# Development server (hot reload)
npm run start:dev

# Debug mode ile çalıştırma
npm run start:debug

# Monitor mode (alias for start:dev)
npm run start:monitor
```

### Production Mode

```bash
# Build application
npm run build

# Production server
npm run start:prod
```

### Docker ile Çalıştırma

```bash
# Docker Compose ile build ve run
docker-compose up -d

# Logları görüntüle
docker-compose logs -f usdt-monitor

# Container durumunu kontrol et
docker-compose ps

# Servisi durdur
docker-compose down
```

### Docker Compose Configuration
```yaml
services:
  usdt-monitor:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./firebase-service-account.json:/app/firebase-service-account.json:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 📊 Monitoring Configuration

### USDT Contract Detayları
- **Contract Address**: `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **Token Standard**: ERC-20
- **Decimals**: 6
- **Transfer Threshold**: 100,000 USDT (configurable)
- **Network**: Ethereum Mainnet (Chain ID: 1)

### Event Monitoring
```typescript
interface TransferEvent {
  from: string;           // Gönderen adres
  to: string;            // Alıcı adres  
  value: bigint;         // Raw transfer miktarı
  formattedAmount: string; // Formatlanmış USDT miktarı
  txHash: string;        // Transaction hash
  blockNumber: number;   // Block numarası
  timestamp: Date;       // Transfer zamanı
}
```

### Filtering Logic
```typescript
// 100,000 USDT ve üzeri transferler
const TRANSFER_THRESHOLD = ethers.parseUnits('100000', 6);

// Contract event filter
const filter = usdtContract.filters.Transfer();
```

## 🔧 Available Scripts

### Development Scripts
```bash
npm run start:dev         # Development server (watch mode)
npm run start:debug       # Debug mode (port 9229)
npm run start:monitor     # Alias for start:dev
```

### Production Scripts
```bash
npm run build             # TypeScript build
npm run start:prod        # Production server
npm run start             # Standard NestJS start
```

### Code Quality Scripts
```bash
npm run lint              # ESLint check
npm run lint:fix          # ESLint fix
npm run format            # Prettier formatting
```

### Testing Scripts
```bash
npm run test              # Unit tests
npm run test:watch        # Test watch mode
npm run test:cov          # Coverage report
npm run test:debug        # Debug tests
npm run test:e2e          # E2E tests
```

### Utility Scripts
```bash
npm run check:env         # Environment variables check
npm run validate:config   # Configuration validation
```

## 📱 Firebase Cloud Messaging

### Notification Format
Backend'den gönderilen bildirim formatı:

```json
{
  "notification": {
    "title": "🚨 Large USDT Transfer Detected",
    "body": "150,000.00 USDT transferred from 0x1234...5678 to 0xabcd...efgh"
  },
  "data": {
    "fromAddress": "0x1234567890123456789012345678901234567890",
    "toAddress": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef", 
    "amount": "150000.00",
    "txHash": "0x...",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "sound": "default",
    "popupEnabled": "true"
  },
  "android": {
    "notification": {
      "sound": "default",
      "channelId": "usdt_transfers",
      "priority": "high"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "sound": "default",
        "badge": 1
      }
    }
  },
  "topic": "largeTransfers"
}
```

### Topic Subscription
Frontend cihazlar `largeTransfers` topic'ine abone olur:

```typescript
// Frontend tarafında subscription
await messaging.subscribeToTopic(fcmToken, 'largeTransfers');
```

## 🏗️ Proje Yapısı

```
backend/
├── src/
│   ├── main.ts                          # Application entry point
│   ├── app.module.ts                    # Root module
│   ├── blockchain/                      # Blockchain monitoring
│   │   ├── blockchain.module.ts         # Blockchain module
│   │   ├── blockchain.service.ts        # Main monitoring service
│   │   └── usdt-monitor.service.ts      # Transfer processing service
│   ├── firebase/                        # Firebase integration
│   │   ├── firebase.module.ts           # Firebase module
│   │   └── firebase.service.ts          # FCM notification service
│   └── config/                          # Configuration
│       ├── configuration.ts             # App configuration schema
│       └── config-validation.service.ts # Environment validation
├── test/                               # Test files
│   ├── app.e2e-spec.ts                # E2E tests
│   └── jest-e2e.json                  # E2E test config
├── .env.example                        # Environment template
├── .env                               # Environment variables (gitignored)
├── firebase-service-account.json      # Firebase credentials (gitignored)
├── Dockerfile                         # Docker configuration
├── docker-compose.yml                 # Docker Compose setup
├── nest-cli.json                      # NestJS CLI config
├── tsconfig.json                      # TypeScript config
├── tsconfig.build.json                # Build TypeScript config
├── package.json                       # Dependencies
└── README.md                          # This file
```

### Core Modules

#### BlockchainService
```typescript
@Injectable()
export class BlockchainService implements OnApplicationBootstrap {
  // WebSocket provider initialization
  // USDT contract setup
  // Event listener registration
  // Connection management
}
```

#### UsdtMonitorService
```typescript
@Injectable()
export class UsdtMonitorService {
  // Transfer processing logic
  // History management
  // Statistics calculation
  // Data cleanup
}
```

#### FirebaseService
```typescript
@Injectable()
export class FirebaseService implements OnModuleInit {
  // Firebase Admin SDK initialization
  // FCM notification sending
  // Topic management
}
```

## 🔐 Güvenlik

### Environment Security
- **Sensitive data**: `.env` ve `firebase-service-account.json` gitignore'da
- **File permissions**: Service account dosyası için 600 permission
- **Environment validation**: Joi ile runtime validation

### Network Security
- **WSS connections**: Sadece güvenli WebSocket bağlantıları
- **API keys**: Environment variables ile güvenli saklama
- **Docker secrets**: Production'da Docker secrets kullanımı

### Application Security
- **Input validation**: Tüm girişler için validation
- **Error handling**: Sensitive bilgilerin loglanmaması
- **Rate limiting**: Notification rate limiting (gelecek özellik)

## 🚀 Deployment

### Vercel (Serverless)
```bash
# Vercel ile deploy (serverless functions)
npm i -g vercel
vercel

# Environment variables Vercel dashboard'dan ekleyin
```

### Docker Production
```bash
# Production image build
docker build -t usdt-monitor .

# Container run
docker run -d \
  --name usdt-monitor \
  --env-file .env \
  -v $(pwd)/firebase-service-account.json:/app/firebase-service-account.json:ro \
  -p 3001:3001 \
  usdt-monitor
```

### PM2 (Process Manager)
```bash
# PM2 ile production deployment
npm install -g pm2

# Build application
npm run build

# Start with PM2
pm2 start dist/main.js --name "usdt-monitor"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Environment Variables for Production
Production ortamında gerekli environment variables:

```bash
ETHEREUM_WSS_URL=wss://...
FIREBASE_ADMIN_CONFIG_PATH=/app/firebase-service-account.json
NODE_ENV=production
PORT=3001
LOG_LEVEL=error
```

## 🐛 Debugging & Troubleshooting

### Common Issues

#### 1. WebSocket Connection Errors
```bash
# URL syntax kontrolü
npm run check:env

# Network connectivity test
curl -I https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY

# Debug logs
NODE_ENV=development npm run start:dev
```

**Error**: `WebSocket connection failed`
**Solution**: 
- API key'in geçerliliğini kontrol edin
- Network firewall ayarlarını kontrol edin
- Rate limit'e takılmış olabilirsiniz

#### 2. Firebase Authentication Errors
```bash
# Firebase credentials kontrolü
ls -la firebase-service-account.json

# File permissions
chmod 600 firebase-service-account.json

# Content validation
cat firebase-service-account.json | jq .
```

**Error**: `Firebase Admin SDK initialization failed`
**Solution**:
- Service account JSON'ın valid olduğunu kontrol edin
- File path'in doğru olduğunu kontrol edin
- Firebase projesinin aktif olduğunu kontrol edin

#### 3. Memory/Performance Issues
```bash
# Memory usage monitoring
docker stats usdt-monitor

# Application health check
curl http://localhost:3001/health

# Process monitoring
ps aux | grep node
```

### Debug Configuration

#### Development Debugging
```typescript
// Environment-based logging
if (process.env.NODE_ENV === 'development') {
  this.logger.debug('Detailed debug information');
}
```

#### Docker Debugging
```bash
# Container logs
docker-compose logs -f usdt-monitor

# Container shell access
docker exec -it usdt-monitor sh

# Resource usage
docker stats usdt-monitor
```

### Log Analysis
```bash
# Real-time logs
tail -f logs/application.log

# Error filtering  
grep ERROR logs/application.log

# Performance monitoring
grep "Transfer processed" logs/application.log | wc -l
```

## 📊 Performance & Monitoring

### System Requirements
- **Memory**: 100-200MB baseline
- **CPU**: Low usage (event-driven)
- **Network**: Persistent WebSocket connection
- **Storage**: Minimal (in-memory data)

### Performance Metrics
```typescript
// Transfer processing metrics
export interface PerformanceMetrics {
  totalTransfers: number;
  averageProcessingTime: number;
  notificationsSent: number;
  uptime: number;
}
```

### Scaling Considerations
- **Horizontal scaling**: Stateless design
- **Load balancing**: Multiple instances
- **Database**: Redis için persistent storage
- **Message queue**: Bull/Agenda için job processing

### Health Monitoring
```typescript
// Health check endpoint
@Get('/health')
healthCheck() {
  return {
    status: 'ok',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: this.getActiveConnections()
  };
}
```

## 🧪 Testing

### Unit Tests
```bash
# All unit tests
npm run test

# Specific test file
npm run test -- blockchain.service.spec.ts

# Watch mode
npm run test:watch
```

### E2E Tests
```bash
# End-to-end tests
npm run test:e2e

# Coverage report
npm run test:cov
```

### Test Structure
```typescript
describe('BlockchainService', () => {
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BlockchainService, MockFirebaseService],
    }).compile();
  });

  it('should detect large transfers', async () => {
    // Test implementation
  });
});
```

## 🤝 Contributing

### Development Workflow
1. Fork repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Implement changes with tests
4. Run linting: `npm run lint:fix`
5. Run tests: `npm test`
6. Commit: `git commit -am 'Add new feature'`
7. Push: `git push origin feature/new-feature`
8. Create Pull Request

### Code Standards
- **ESLint**: Automated code linting
- **Prettier**: Code formatting
- **TypeScript**: Strict type checking
- **Testing**: Unit tests required for new features

### Commit Convention
```bash
# Feature
git commit -m "feat: add transfer threshold configuration"

# Bug fix
git commit -m "fix: resolve websocket reconnection issue"

# Documentation
git commit -m "docs: update installation instructions"
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

Destek ve sorularınız için:

- **GitHub Issues**: Bug reports ve feature requests
- **Documentation**: README ve code comments
- **Logs**: Application logs için troubleshooting

## 🔗 İlgili Linkler

- **NestJS Documentation**: https://docs.nestjs.com
- **Ethers.js Documentation**: https://docs.ethers.io
- **Firebase Admin SDK**: https://firebase.google.com/docs/admin/setup
- **Ethereum JSON-RPC**: https://ethereum.org/en/developers/docs/apis/json-rpc/

---

**⚠️ Disclaimer**: Bu yazılım eğitim ve monitoring amaçlıdır. Blockchain verilerini izlerken ilgili yönetmelikler ve hizmet koşullarına uygunluğu sağlayın.
