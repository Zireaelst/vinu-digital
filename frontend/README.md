# 🔍 USDT Transfer Monitörü - Frontend

Bu proje, Ethereum blockchain'deki büyük USDT transferlerini Firebase Cloud Messaging (FCM) ile gerçek zamanlı olarak izleyen, modern ve responsive bir Next.js frontend uygulamasıdır.

## ✨ Özellikler

### 🔔 Bildirim Sistemi
- **Gerçek zamanlı bildirimler**: Firebase Cloud Messaging ile büyük USDT transferleri anında bildirilir
- **Foreground & Background**: Hem uygulama açıkken hem de kapalıyken bildirim alabilir
- **Özelleştirilebilir bildirimler**: Ses ve popup bildirimleri ayrı ayrı açılıp kapatılabilir
- **Otomatik ses efektleri**: Web Audio API ile oluşturulan bildirim sesi

### 🎨 Modern UI/UX
- **Tailwind CSS v4**: Utility-first CSS framework ile modern tasarım
- **Framer Motion**: Buttery smooth animasyonlar ve geçişler
- **Responsive Design**: Mobil ve desktop uyumlu tasarım
- **Dark Theme**: Koyu tema odaklı modern görünüm
- **Gradient Background**: Dinamik slate-to-purple gradient arka plan

### 📊 Transfer Takibi
- **Transfer detayları**: Gönderen, alıcı, miktar ve işlem hash bilgilerini görüntüler
- **Etherscan entegrasyonu**: İşlem hash'lerine tıklayarak Etherscan'de detay görülebilir
- **Transfer geçmişi**: Son 50 transfer kaydı localStorage'da saklanır
- **İstatistikler**: Toplam bildirim sayısı ve son transfer zamanı
- **Yenileme özelliği**: Manuel ve otomatik veri yenileme

### ⚙️ Kontrol Paneli
- **Ses kontrolü**: Bildirim seslerini açma/kapatma
- **Popup kontrolü**: Browser notification'larını açma/kapatma
- **Ayarlar yönetimi**: Kullanıcı tercihlerinin localStorage'da saklanması

## 🛠️ Teknoloji Stack'i

### Core Framework
- **Next.js 16.0.1**: React framework (App Router)
- **React 19.2.0**: Modern React hooks ve concurrent features
- **TypeScript 5**: Type safety ve developer experience

### UI & Styling
- **Tailwind CSS 4**: Modern utility-first CSS framework
- **Framer Motion 12.23.24**: High-performance animasyon kütüphanesi
- **Lucide React**: Modern SVG icon library
- **Radix UI Icons**: Accessible icon set

### Firebase Integration
- **Firebase 12.5.0**: Client-side Firebase SDK
- **Firebase Admin 13.6.0**: Server-side Firebase admin operations
- **FCM**: Firebase Cloud Messaging

### Utilities
- **clsx + tailwind-merge**: CSS class yönetimi
- **Motion**: Enhanced animation utilities

## 📋 Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
cd frontend
npm install
```

### 2. Firebase Yapılandırması

#### Firebase Console Ayarları
1. [Firebase Console](https://console.firebase.google.com/)'da yeni proje oluşturun
2. **Authentication** > **Sign-in method** > **Anonymous** aktif edin (opsiyonel)
3. **Cloud Messaging**'i etkinleştirin
4. **Project Settings** > **General** > **Your apps** > Web app ekleyin
5. **Project Settings** > **Cloud Messaging** > **Web push certificates** > **Generate key pair**

#### Environment Variables
`.env.local` dosyasını oluşturun ve Firebase config'inizi girin:

```bash
# Backend URL
BACKEND_URL=http://localhost:3001

# Firebase Client Configuration (NEXT_PUBLIC_ öneki zorunludur)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=1:your_sender_id:web:your_app_id

# Firebase VAPID Key (FCM Web Push için gerekli)
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here

# Firebase Admin SDK (Server-side API routes için)
FIREBASE_ADMIN_CONFIG_PATH=./firebase-service-account.json
```

### 3. Firebase Service Account

1. Firebase Console > **Project Settings** > **Service Accounts**
2. **Generate new private key** butonuna tıklayın
3. İndirilen JSON dosyasını `firebase-service-account.json` adıyla frontend klasörünün kök dizinine koyun

### 4. Service Worker Yapılandırması

`public/firebase-messaging-sw.js` dosyasındaki Firebase config'ini kendi projenizin bilgileriyle güncelleyin:

```javascript
const firebaseConfig = {
  apiKey: "your_api_key_here",
  authDomain: "your_project_id.firebaseapp.com",
  projectId: "your_project_id",
  storageBucket: "your_project_id.firebasestorage.app",
  messagingSenderId: "your_sender_id_here",
  appId: "1:your_sender_id:web:your_app_id"
};
```

### 5. Uygulamayı Çalıştırın

```bash
# Development server
npm run dev

# Production build
npm run build
npm start
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## � Kullanım Kılavuzu

### İlk Kurulum
1. **Bildirim İzni**: Uygulama açıldığında "Bildirimlere İzin Ver" butonuna tıklayın
2. **Otomatik Abone**: İzin verildikten sonra cihazınız otomatik olarak `largeTransfers` konusuna abone edilir
3. **FCM Token**: Token başarıyla alındıktan sonra yeşil durum göstergesi görünür

### Ayarlar Yönetimi
- **Kontrol Paneli**: Sağ üst köşedeki ⚙️ butonuna tıklayarak açın
- **Ses Ayarları**: 🔊/🔇 toggle ile bildirim seslerini açın/kapatın
- **Popup Bildirimleri**: 🖥️ toggle ile browser notification'larını kontrol edin

### Transfer Bildirimleri
- **Foreground**: Uygulama açıkken bildirimler sayfada görünür
- **Background**: Uygulama kapalıyken browser notification olarak gelir
- **Transfer Detayları**: Her bildirimde şu bilgiler gösterilir:
  - Gönderen adres (kısaltılmış)
  - Alıcı adres (kısaltılmış)
  - Transfer miktarı (formatlanmış)
  - İşlem hash'i (Etherscan linki)

### İstatistikler
- **Toplam Bildirim**: Alınan toplam bildirim sayısı
- **Son Transfer**: En son alınan transfer zamanı
- **Bildirim Geçmişi**: Son 50 bildirim localStorage'da saklanır

## 🏗️ Proje Yapısı

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx               # Root layout (SettingsProvider)
│   │   ├── page.tsx                 # Ana sayfa komponenti
│   │   ├── globals.css              # Global CSS styles
│   │   └── api/                     # API Routes
│   │       ├── notifications/count/ # Bildirim sayısı API
│   │       ├── recent-transfers/    # Son transferler API
│   │       └── subscribe/           # FCM subscribe API
│   ├── components/                  # React komponenleri
│   │   ├── ClientOnly.tsx          # Client-side render wrapper
│   │   ├── ControlPanel.tsx        # Ayarlar kontrol paneli
│   │   ├── ErrorBoundary.tsx       # Hata yakalama komponenti
│   │   └── grid-background.tsx     # Animated grid background
│   ├── contexts/                   # React Context'leri
│   │   └── SettingsContext.tsx     # Kullanıcı ayarları context
│   └── lib/                        # Utility libraries
│       ├── utils.ts                # CSS class utilities (cn)
│       └── firebase/              # Firebase konfigürasyonları
│           ├── client.ts          # Firebase client SDK
│           └── admin.ts           # Firebase admin SDK
├── public/                        # Static assets
│   ├── firebase-messaging-sw.js   # FCM Service Worker
│   ├── notification-sound.mp3     # Bildirim ses dosyası
│   ├── notification-sound.js      # Web Audio API ses generator
│   └── *.png, *.svg              # Icons ve görseller
├── .env.local                     # Environment variables
├── firebase-service-account.json  # Firebase service account
├── package.json                   # Dependencies
├── next.config.ts                 # Next.js configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind CSS configuration
└── postcss.config.mjs             # PostCSS configuration
```

## 🔧 API Endpoints

### `/api/subscribe` (POST)
FCM token'ını `largeTransfers` topic'ine abone eder.

**Request Body:**
```json
{
  "token": "fcm_token_string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device successfully subscribed to largeTransfers topic",
  "result": {...}
}
```

### `/api/notifications/count` (GET)
Toplam bildirim sayısını döner.

**Response:**
```json
{
  "count": 42
}
```

### `/api/recent-transfers` (GET)
Son transfer bilgilerini döner.

**Response:**
```json
{
  "transfers": [...],
  "lastSync": "2024-01-01T00:00:00.000Z"
}
```

## 🔄 Firebase Cloud Messaging

### Message Format
Backend'den beklenen bildirim formatı:

```json
{
  "notification": {
    "title": "Büyük USDT Transferi",
    "body": "1,000,000 USDT transferi tespit edildi"
  },
  "data": {
    "fromAddress": "0x1234...abcd",
    "toAddress": "0x5678...efgh", 
    "amount": "1000000",
    "txHash": "0x9876...5432"
  },
  "topic": "largeTransfers"
}
```

### Service Worker
- **Background Messages**: `firebase-messaging-sw.js` ile background bildirimleri
- **Notification Actions**: Bildirime tıklanınca uygulamaya odaklanma
- **Custom Sound**: Web Audio API ile özel bildirim sesi

## 🎨 UI/UX Özellikleri

### Animasyonlar (Framer Motion)
- **Entrance animations**: Fade-in ve slide-up animasyonları
- **Hover effects**: Button ve card hover efektleri
- **Loading states**: Skeleton loading ve spinner animasyonları
- **Page transitions**: Smooth geçişler

### Responsive Design
- **Mobile-first**: Mobil odaklı tasarım yaklaşımı
- **Breakpoints**: Tailwind CSS breakpoint'leri
- **Touch-friendly**: Mobil dokunmatik deneyim

### Accessibility
- **ARIA labels**: Screen reader uyumluluğu
- **Keyboard navigation**: Klavye ile gezinme
- **High contrast**: Renk kontrastı standartları

## 🔐 Güvenlik

### Environment Variables
- **Client-side**: `NEXT_PUBLIC_` prefix ile güvenli client vars
- **Server-side**: API route'larda private environment variables
- **Firebase Admin**: Service account JSON dosyası `.gitignore`'da

### Data Protection
- **LocalStorage**: Sadece notification preferences saklanır
- **No PII**: Kişisel veri saklanmaz
- **HTTPS**: Production'da HTTPS zorunlu

## 🚀 Deployment

### Vercel (Önerilen)
```bash
# Vercel CLI ile deploy
npm i -g vercel
vercel

# Environment variables'ları Vercel dashboard'dan ekleyin
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
Production ortamında aşağıdaki environment variables'ları ayarlayın:
- Tüm `NEXT_PUBLIC_*` değişkenleri
- `FIREBASE_ADMIN_CONFIG_PATH` veya service account JSON content

## 🐛 Debugging

### Common Issues

1. **FCM Token alınamıyor**
   - VAPID key'i kontrol edin
   - HTTPS kullanıp kullanmadığınızı kontrol edin
   - Browser console'da hataları inceleyin

2. **Service Worker çalışmıyor**
   - Browser dev tools > Application > Service Workers kontrol edin
   - `firebase-messaging-sw.js` config'ini kontrol edin
   - Hard refresh yapın (Ctrl+Shift+R)

3. **Bildirimler gelmiyor**
   - Notification permission'ını kontrol edin
   - FCM token subscription'ını kontrol edin
   - Backend'in mesaj gönderip göndermediğini kontrol edin

### Debug Mode
Development'ta detaylı logging aktiftir:
```typescript
// client.ts'de
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info...');
}
```

## 📊 Performance

### Optimizasyonlar
- **Code Splitting**: Next.js otomatik code splitting
- **Tree Shaking**: Kullanılmayan kodları eleme
- **Bundle Analysis**: `npm run build` ile bundle boyutu analizi
- **Image Optimization**: Next.js Image component

### Bundle Size
- **Main bundle**: ~300KB (gzipped)
- **Firebase SDK**: Lazy loaded
- **Framer Motion**: Tree shaken

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Style
- **ESLint**: Kod standartları
- **Prettier**: Kod formatı
- **TypeScript**: Type safety

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

Sorularınız için:
- GitHub Issues açın
- Dokumentasyonu inceleyin
- Code comments'leri okuyun
