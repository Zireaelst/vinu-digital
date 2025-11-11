# 📡 API Documentation

Bu dokümanda USDT Transfer Monitörü projesinin tüm API endpoints ve integration detayları bulunmaktadır.

## 🖥️ Backend API Endpoints (Port 3001)

### Health & Status Endpoints

#### Application Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "uptime": 3600,
  "memory": {
    "used": "45.2 MB",
    "total": "512 MB"
  },
  "blockchain": "connected",
  "firebase": "initialized"
}
```

#### System Status and Metrics
```bash
GET /status  
```

**Response:**
```json
{
  "blockchain": {
    "connected": true,
    "network": "mainnet",
    "blockNumber": 18500000
  },
  "transfers": {
    "totalProcessed": 156,
    "last24Hours": 12,
    "avgAmount": "250000"
  }
}
```

#### Application Root
```bash
GET /
```

**Response:**
```json
{
  "message": "🚀 USDT Monitor Backend - Real-time large USDT transfer monitoring with Firebase notifications",
  "version": "1.0.0",
  "docs": "/api/docs"
}
```

### Transfer Data Endpoints

#### Recent Transfers
```bash
GET /api/recent-transfers?since=<timestamp>
```

**Parameters:**
- `since` (optional): Unix timestamp to filter transfers

**Response:**
```json
{
  "success": true,
  "transfers": [
    {
      "id": "0x1234567890abcdef...",
      "title": "Large USDT Transfer Detected",
      "body": "1,000,000.00 USDT transferred",
      "fromAddress": "0x1234567890123456789012345678901234567890",
      "toAddress": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
      "amount": "1000000.00",
      "txHash": "0x1234567890abcdef...",
      "timestamp": 1640995200000
    }
  ]
}
```

#### Transfer Statistics
```bash
GET /api/transfers/stats
```

**Response:**
```json
{
  "totalCount": 1000,
  "totalVolume": "50000000.00",
  "averageAmount": "500000.00",
  "timeRange": "2024-01-01T00:00:00.000Z - 2024-01-31T23:59:59.999Z"
}
```

## 💻 Frontend API Routes (Port 3000)

### FCM Subscription Management

#### Subscribe FCM Token to Topic
```bash
POST /api/subscribe
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "fcm_registration_token_here"
}
```

**Success Response:**
```json
{
  "success": true,
  "message": "Device successfully subscribed to largeTransfers topic",
  "result": {
    "successCount": 1,
    "failureCount": 0
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "FCM token gerekli"
}
```

### Notification Analytics

#### Get Notification Count
```bash
GET /api/notifications/count
```

**Response:**
```json
{
  "count": 42,
  "lastTransferAt": "2024-01-15T10:30:45.123Z"
}
```

#### Get Recent Transfers from Cache
```bash
GET /api/recent-transfers?lastSync=<timestamp>
```

**Parameters:**
- `lastSync` (optional): Last sync timestamp for incremental updates

**Response:**
```json
{
  "transfers": [
    {
      "id": "0x1234567890abcdef...",
      "fromAddress": "0x1234567890123456789012345678901234567890",
      "toAddress": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
      "amount": "1000000.00",
      "txHash": "0x1234567890abcdef...",
      "timestamp": "2024-01-15T10:30:45.123Z"
    }
  ],
  "lastSync": "2024-01-15T10:30:45.123Z"
}
```

## 🔔 Firebase Cloud Messaging Integration

### Message Format Specification

#### Notification Payload
```json
{
  "notification": {
    "title": "🚨 Large USDT Transfer Detected",
    "body": "1,500,000.00 USDT transferred from 0x1234...5678 to 0xabcd...efgh"
  },
  "data": {
    "fromAddress": "0x1234567890123456789012345678901234567890",
    "toAddress": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
    "amount": "1500000.00", 
    "txHash": "0x9876543210abcdef1234567890abcdef12345678",
    "timestamp": "2024-01-15T10:30:45.123Z",
    "sound": "default",
    "popupEnabled": "true"
  },
  "android": {
    "notification": {
      "sound": "default",
      "channelId": "usdt_transfers",
      "priority": "high",
      "defaultSound": true
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "sound": "default", 
        "badge": 1,
        "category": "TRANSFER_ALERT"
      }
    }
  },
  "webpush": {
    "notification": {
      "icon": "/firebase-logo.png",
      "tag": "usdt-transfer",
      "requireInteraction": true,
      "silent": false,
      "sound": "/notification-sound.mp3",
      "vibrate": [200, 100, 200]
    }
  },
  "topic": "largeTransfers"
}
```

### Topic Management

#### Available Topics
- **`largeTransfers`**: Main topic for USDT transfers ≥ 100,000 USDT
- **`allTransfers`**: All USDT transfers (not implemented)
- **`criticalAlerts`**: System alerts and maintenance notifications

#### Subscription Methods

##### Topic Subscription
```typescript
// Subscribe to topic
await admin.messaging().subscribeToTopic(tokens, 'largeTransfers');

// Unsubscribe from topic  
await admin.messaging().unsubscribeFromTopic(tokens, 'largeTransfers');
```

##### Direct Token Messaging
```typescript
// Send to specific device token
const message = {
  notification: { ... },
  data: { ... },
  token: 'user_device_token'
};
await admin.messaging().send(message);
```

## 📊 WebSocket Events (Internal)

### Blockchain Event Stream

#### USDT Transfer Event Structure
```typescript
interface TransferEvent {
  from: string;           // Sender wallet address
  to: string;            // Recipient wallet address  
  value: bigint;         // Raw transfer amount (in wei, 6 decimals for USDT)
  formattedAmount: string; // Formatted USDT amount (e.g., "1000000.00")
  txHash: string;        // Transaction hash
  blockNumber: number;   // Ethereum block number
  timestamp: Date;       // Transfer timestamp
}
```

#### Event Processing Pipeline
```
Ethereum WebSocket 
    ↓
Event Filter (Transfer events)
    ↓  
Amount Check (≥ 100,000 USDT)
    ↓
Firebase FCM Notification
    ↓
Frontend Update (Real-time)
```

### Contract Configuration

#### USDT Contract Details
```typescript
const USDT_CONFIG = {
  address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  decimals: 6,
  abi: [
    'event Transfer(address indexed from, address indexed to, uint256 value)'
  ],
  network: 'mainnet',
  threshold: '100000' // 100K USDT
};
```

## 🔐 Authentication & Security

### API Security

#### Rate Limiting
```bash
# Default rate limits
GET endpoints: 100 requests/minute
POST endpoints: 20 requests/minute
```

#### CORS Configuration
```typescript
// Allowed origins for development
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://your-domain.com'
  ],
  credentials: true
};
```

### Firebase Security Rules

#### FCM Topic Security
```javascript
// Only authenticated users can subscribe to topics
// Service account has full access for server-side operations
```

## 📈 Monitoring & Analytics

### Performance Metrics

#### Response Times
- Health endpoint: ~5ms
- Status endpoint: ~50ms
- Transfer endpoints: ~100ms
- FCM notifications: ~200ms

#### Error Handling
```typescript
// Standard error response format
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Logging Structure

#### Log Levels
- **ERROR**: System errors, failed notifications
- **WARN**: Connection issues, retry attempts
- **INFO**: Transfer detections, successful operations
- **DEBUG**: Detailed blockchain events (development only)

#### Log Format
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "context": "BlockchainService", 
  "message": "Large USDT transfer detected: 1000000.00 USDT",
  "metadata": {
    "from": "0x...",
    "to": "0x...",
    "txHash": "0x...",
    "amount": "1000000.00"
  }
}
```

## 🧪 Testing Endpoints

### Development Testing

#### Mock Transfer Event
```bash
# Trigger test notification (development only)
POST /api/test/mock-transfer
Content-Type: application/json

{
  "amount": "1000000",
  "from": "0x1234567890123456789012345678901234567890",
  "to": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef"
}
```

#### Health Check Validation
```bash
# Validate all system components
GET /api/test/validate-system

Response: {
  "blockchain": "✅ Connected",
  "firebase": "✅ Initialized", 
  "websocket": "✅ Active",
  "notifications": "✅ Ready"
}
```

---

**📝 Not**: Bu API dokümantasyonu production environment için güncellenmiştir. Development sırasında endpoint'ler değişebilir.
