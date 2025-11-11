# 🔧 Detaylı Konfigürasyon

Bu dokümanda USDT Transfer Monitörü projesinin detaylı konfigürasyon ayarları bulunmaktadır.

## 🖥️ Backend Configuration

### Environment Variables (.env)
```bash
# 🌐 Ethereum Network
ETHEREUM_WSS_URL=wss://eth-mainnet.ws.alchemyapi.io/v2/YOUR_API_KEY
# Alternative providers:
# ETHEREUM_WSS_URL=wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID
# ETHEREUM_WSS_URL=wss://your-endpoint.quiknode.pro/YOUR_TOKEN/

# 🔥 Firebase Configuration  
FIREBASE_ADMIN_CONFIG_PATH=../vinu-digital-firebase-adminsdk-*.json

# 🚀 Application Settings
PORT=3001
NODE_ENV=production
LOG_LEVEL=info

# 📊 Monitoring Settings (Optional)
TRANSFER_THRESHOLD=100000  # Minimum USDT amount to trigger notification
CLEANUP_INTERVAL=3600000   # Transfer history cleanup interval (1 hour)
```

### Service Configuration
```typescript
// USDT Contract Settings
const USDT_CONFIG = {
  address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  decimals: 6,
  threshold: 100000, // 100K USDT minimum
  network: 'mainnet'
};

// Firebase FCM Settings
const FCM_CONFIG = {
  topic: 'largeTransfers',
  priority: 'high',
  timeToLive: 86400 // 24 hours
};
```

## 💻 Frontend Configuration

### Environment Variables (.env.local)
```bash
# 🔗 Backend Connection
BACKEND_URL=http://localhost:3001

# 🔥 Firebase Client SDK (NEXT_PUBLIC_ prefix required)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef...

# 🔔 Firebase Cloud Messaging
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BH4dXcs-wlW...  # Web Push Certificate Key

# 🔐 Firebase Admin SDK (Server-side API Routes)
FIREBASE_ADMIN_CONFIG_PATH=./firebase-service-account.json
```

### Service Worker Configuration
```javascript
// public/firebase-messaging-sw.js
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef..."
};
```

## 🐳 Docker Configuration

### Docker Compose (docker-compose.yml)
```yaml
version: '3.8'
services:
  usdt-monitor-backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    env_file:
      - ./backend/.env
    volumes:
      - ./firebase-service-account.json:/app/firebase-service-account.json:ro
    restart: unless-stopped
    
  usdt-monitor-frontend:
    build: ./frontend  
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./frontend/.env.local
    depends_on:
      - usdt-monitor-backend
    restart: unless-stopped
```

## 🔐 Security Configuration

### Production Security
```bash
# File permissions
chmod 600 firebase-service-account.json
chmod 600 .env
chmod 600 .env.local

# Environment validation
npm run validate:config  # Backend
npm run check:env       # Frontend
```

## 🌐 Network Provider Setup

### Alchemy Configuration
1. [Alchemy Dashboard](https://dashboard.alchemy.com/) adresine gidin
2. Yeni uygulama oluşturun (Ethereum Mainnet)
3. WebSocket URL'yi kopyalayın
4. `.env` dosyasında `ETHEREUM_WSS_URL` olarak kullanın

### Infura Configuration
1. [Infura Dashboard](https://infura.io/dashboard) adresine gidin
2. Yeni proje oluşturun (Ethereum Mainnet)
3. WebSocket endpoint'ini alın
4. Formatı: `wss://mainnet.infura.io/ws/v3/YOUR_PROJECT_ID`

## 🔥 Firebase Detailed Setup

### Firebase Console Setup
1. [Firebase Console](https://console.firebase.google.com/) açın
2. Yeni proje oluşturun veya mevcut projeyi seçin
3. **Cloud Messaging** servisini etkinleştirin

### Service Account Setup
1. **Project Settings** → **Service Accounts**
2. **Generate new private key** butonuna tıklayın
3. JSON dosyasını indirin ve `firebase-service-account.json` olarak kaydedin
4. Dosyayı backend klasörüne yerleştirin

### Web App Configuration
1. **Project Settings** → **General** → **Your apps**
2. **Add app** → **Web** seçin
3. App nickname girin ve **Register app**
4. Configuration objesini kopyalayın
5. `.env.local` dosyasında kullanın

### VAPID Key Setup
1. **Project Settings** → **Cloud Messaging**
2. **Web configuration** bölümünde **Generate key pair**
3. Key'i kopyalayın ve `NEXT_PUBLIC_FIREBASE_VAPID_KEY` olarak kullanın

## 🔧 Advanced Configuration

### Transfer Threshold Customization
```typescript
// backend/src/blockchain/blockchain.service.ts
private readonly TRANSFER_THRESHOLD = ethers.parseUnits(
  '50000', // Change this value for different threshold
  this.USDT_DECIMALS,
);
```

### Notification Customization
```typescript
// backend/src/firebase/firebase.service.ts
const message = {
  notification: {
    title: '🚨 Custom Title', // Customize notification title
    body: 'Custom message content' // Customize message body
  },
  // ... other settings
};
```

### Frontend Theme Customization
```typescript
// frontend/tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Add custom colors
        brand: {
          primary: '#your-color',
          secondary: '#your-color'
        }
      }
    }
  }
}
```

## 🚨 Troubleshooting

### Common Issues

#### Backend Connection Issues
```bash
# Check WebSocket connection
curl -I https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY

# Validate environment
npm run check:env

# Check Firebase credentials
ls -la firebase-service-account.json
```

#### Frontend FCM Issues
```bash
# Check Firebase configuration
console.log(process.env.NEXT_PUBLIC_FIREBASE_API_KEY)

# Verify service worker
# Check browser dev tools → Application → Service Workers
```

#### Permission Issues
```bash
# Fix file permissions
chmod 600 firebase-service-account.json
chmod 600 .env*

# Check Firebase IAM permissions
# Ensure service account has Cloud Messaging Admin role
```

## 📊 Monitoring & Logging

### Backend Logging
```typescript
// Enable debug logging
NODE_ENV=development npm run start:dev

// Production logging levels
LOG_LEVEL=info  # info, warn, error
LOG_LEVEL=debug # Detailed debugging
```

### Frontend Debugging
```typescript
// Enable Firebase debugging
localStorage.setItem('debug', 'firebase*');

// Check notification permissions
console.log(Notification.permission);

// Monitor FCM token
getFCMToken().then(token => console.log('FCM Token:', token));
```

---

**🔥 Not**: Bu konfigürasyon ayarları production environment için optimize edilmiştir. Development sırasında daha esnek ayarlar kullanabilirsiniz.
