# 🔍 USDT Transfer Monitörü

Bu proje, Ethereum blockchain'de büyük USDT transferlerini gerçek zamanlı olarak izleyen ve Firebase Cloud Messaging (FCM) ile bildirim gönderen full-stack bir uygulamadır.

## 🏗️ Proje Yapısı

```
vinu-digital/
├── backend/                    # NestJS Backend API
│   ├── src/
│   │   ├── blockchain/         # Ethereum monitoring servisleri
│   │   ├── firebase/          # Firebase FCM servisleri
│   │   ├── config/            # Konfigürasyon yönetimi
│   │   └── main.ts            # Ana uygulama
│   ├── .env                   # Backend environment variables
│   └── package.json
│
├── frontend/                   # Next.js Frontend
│   ├── src/
│   │   ├── app/               # Next.js App Router
│   │   ├── lib/firebase/      # Firebase istemci/admin config
│   │   └── lib/utils.ts       # Yardımcı fonksiyonlar
│   ├── public/
│   │   └── firebase-messaging-sw.js  # Service Worker
│   ├── .env.local             # Frontend environment variables
│   └── package.json
│
└── vinu-digital-firebase-adminsdk-*.json  # Firebase Service Account
```

## 🚀 Hızlı Başlangıç

### 1. Projeyi Klonla
```bash
git clone <repository-url>
cd vinu-digital
```

### 2. Firebase Kurulumu
1. Firebase Console'da yeni proje oluşturun
2. Cloud Messaging'i etkinleştirin
3. Service Account JSON dosyasını indirin
4. Web app için config bilgilerini alın
5. VAPID key oluşturun

### 3. Backend Kurulumu
```bash
cd backend
npm install

# .env dosyasını düzenleyin:
# - ETHEREUM_WSS_URL (Alchemy/Infura)
# - FIREBASE_ADMIN_CONFIG_PATH
# - PORT=3001

npm start
```

### 4. Frontend Kurulumu
```bash
cd frontend
npm install

# .env.local dosyasını düzenleyin:
# - Firebase config değerleri
# - NEXT_PUBLIC_FIREBASE_VAPID_KEY

npm run dev
```

## 📱 Kullanım

1. **Frontend'i açın**: http://localhost:3000
2. **Bildirim iznini verin**: "Bildirimlere İzin Ver" butonuna tıklayın
3. **Otomatik abone olma**: Cihazınız `largeTransfers` konusuna abone olur
4. **Gerçek zamanlı izleme**: Backend büyük USDT transferlerini tespit eder
5. **Anında bildirimler**: FCM ile hem browser hem background bildirimleri alırsınız

## 🔧 Konfigürasyon

### Backend (.env)
```bash
PORT=3001
ETHEREUM_WSS_URL=wss://eth-mainnet.ws.alchemyapi.io/v2/YOUR_API_KEY
FIREBASE_ADMIN_CONFIG_PATH=../vinu-digital-firebase-adminsdk-*.json
```

### Frontend (.env.local)
```bash
# Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key

# Firebase Admin Config
FIREBASE_ADMIN_CONFIG_PATH=./firebase-service-account.json
```

## 🎯 Özellikler

### Backend
- ✅ **Gerçek zamanlı blockchain monitoring** (WebSocket)
- ✅ **USDT transfer tespit sistemi** (>= 100,000 USDT)
- ✅ **Firebase Cloud Messaging** entegrasyonu
- ✅ **RESTful API endpoints** (/health, /status)
- ✅ **Graceful shutdown** desteği
- ✅ **Error handling** ve reconnection logic

### Frontend
- ✅ **Modern React UI** (Next.js 14 + TypeScript)
- ✅ **Tailwind CSS** + **Framer Motion** animasyonlar
- ✅ **Real-time notifications** (foreground/background)
- ✅ **Responsive design** (mobil uyumlu)
- ✅ **Etherscan integration** (transaction links)
- ✅ **Service Worker** background support

## 🔍 API Endpoints

### Backend (http://localhost:3001)
- `GET /` - Ana sayfa
- `GET /health` - Sağlık kontrolü
- `GET /status` - Sistem durumu

### Frontend (http://localhost:3000)
- `POST /api/subscribe` - FCM token konuya abone etme

## 🛡️ Güvenlik

- ✅ Environment variables ile sensitive data
- ✅ Firebase Admin SDK server-side only
- ✅ VAPID key ile güvenli messaging
- ✅ `.gitignore` ile credential koruması

## 📊 Monitoring

### Transfer Tespit Kriterleri:
- **Minimum miktar**: 100,000 USDT
- **Contract**: USDT (0xdAC17F958D2ee523a2206206994597C13D831ec7)
- **Network**: Ethereum Mainnet
- **Method**: Real-time WebSocket monitoring

### Bildirim Formatı:
```json
{
  "notification": {
    "title": "🚨 Büyük USDT Transferi",
    "body": "1,000,000 USDT transferi tespit edildi"
  },
  "data": {
    "fromAddress": "0x1234...abcd",
    "toAddress": "0x5678...efgh", 
    "amount": "1000000",
    "txHash": "0x9876...5432"
  }
}
```

## 🚀 Production Deployment

### Backend
```bash
npm run build
npm run start:prod
```

### Frontend
```bash
npm run build
npm start
```

## 🛠️ Geliştirme

```bash
# Backend development
cd backend
npm run start:dev

# Frontend development  
cd frontend
npm run dev

# Linting
npm run lint

# Testing
npm test
```

## 📋 Gereksinimler

- **Node.js** >= 18.x
- **NPM** >= 9.x
- **Firebase** project with FCM enabled
- **Ethereum API key** (Alchemy/Infura)

## 🤝 Katkıda Bulunma

1. Fork the project
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

**🔥 Canlı İzleme**: Backend başlatıldığında Ethereum blockchain'i gerçek zamanlı olarak izlemeye başlar ve büyük USDT transferlerini anında tespit eder!
