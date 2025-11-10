# USDT Transfer Monitörü - FrontendBu proje, büyük USDT transferlerini Firebase Cloud Messaging (FCM) ile gerçek zamanlı olarak izleyen bir Next.js frontend uygulamasıdır.## 🚀 Özellikler- **Gerçek zamanlı bildirimler**: Firebase Cloud Messaging ile büyük USDT transferleri anında bildirilir- **Modern UI**: Tailwind CSS ve Framer Motion ile tasarlanmış modern ve responsive arayüz- **Aceternity UI uyumlu**: Gelecekte Aceternity UI komponenleri kolayca entegre edilebilir- **Foreground & Background**: Hem uygulama açıkken hem de kapalıyken bildirim alabilir- **Transfer detayları**: Gönderen, alıcı, miktar ve işlem hash bilgilerini görüntüler- **Etherscan entegrasyonu**: İşlem hash'lerine tıklayarak Etherscan'de detay görülebilir## 📋 Kurulum### 1. Firebase YapılandırmasıÖnce `.env.local` dosyasındaki Firebase değişkenlerini kendi Firebase projenizin bilgileriyle güncelleyin:```bash# İstemci TarafıNEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_hereNEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.comNEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_hereNEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.comNEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_hereNEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here# Firebase VAPID Key (FCM için gerekli)NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here# Sunucu Tarafı (firebase-service-account.json dosya yolu)FIREBASE_ADMIN_CONFIG_PATH=./firebase-service-account.json```### 2. Firebase Service Account
Firebase konsolundan indirdiğiniz service account JSON dosyasını `firebase-service-account.json` adıyla frontend klasörünün kök dizinine koyun.

### 3. Service Worker Güncelleme

`public/firebase-messaging-sw.js` dosyasındaki Firebase config'ini de kendi projenizin bilgileriyle güncelleyin.

### 4. Paketleri Yükle ve Çalıştır

```bash
npm install
npm run dev
```

## 🔧 Kullanım

1. **Bildirim İzni**: İlk açılışta "Bildirimlere İzin Ver" butonuna tıklayın
2. **Otomatik Abone**: İzin verildikten sonra cihazınız otomatik olarak `largeTransfers` konusuna abone edilir
3. **Bildirim Alma**: Backend'den gönderilen büyük transfer bildirimleri anlık olarak görünür
4. **Transfer Detayları**: Her bildirimde gönderen, alıcı, miktar ve işlem hash bilgileri gösterilir

## 📁 Proje Yapısı

```
src/
├── app/
│   ├── api/subscribe/route.ts     # FCM token'ı konuya abone etme API
│   ├── page.tsx                   # Ana sayfa komponenti
│   └── ...
├── lib/
│   ├── firebase/
│   │   ├── client.ts             # Firebase istemci konfigürasyonu
│   │   └── admin.ts              # Firebase admin konfigürasyonu
│   └── utils.ts                  # Utility fonksiyonları
public/
└── firebase-messaging-sw.js      # Service Worker (background bildirimleri)
```

## 🎨 UI Komponenleri

- **Gradient Background**: Slate'den purple'a geçişli modern arka plan
- **Animasyonlar**: Framer Motion ile smooth geçişler ve hover efektleri
- **Responsive**: Mobil ve desktop uyumlu tasarım
- **Dark Theme**: Koyu tema odaklı modern görünüm
- **Status Indicators**: Bildirim durumu için görsel göstergeler

## 🔐 Güvenlik

- Service account dosyası `.gitignore`'da yer alır
- Ortam değişkenleri `.env.local` ile yönetilir
- VAPID key ile güvenli FCM iletişimi

## 🔄 Backend Entegrasyonu

Bu frontend, aşağıdaki formatta bildirimler bekler:

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
  }
}
```

## 🚀 Geliştirme

```bash
# Geliştirme sunucusu
npm run dev

# Production build
npm run build
npm start

# Linting
npm run lint
```

## 📦 Kullanılan Teknolojiler

- **Next.js 14**: React framework (App Router)
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animasyon kütüphanesi
- **Firebase**: Cloud Messaging (FCM)
- **clsx + tailwind-merge**: CSS sınıf yönetimi

## ⚡ Performans

- Service Worker ile background bildirimler
- Optimized bundle size
- Modern ES6+ syntax
- Tree shaking ile gereksiz kodları eleme
