// Firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config - bu değerleri .env.local'dekilerle aynı tutun
const firebaseConfig = {
  apiKey: "AIzaSyCytAnlNamK8PGKbDA9kC67qxGpC6jmZy8",
  authDomain: "vinu-digital.firebaseapp.com",
  projectId: "vinu-digital",
  storageBucket: "vinu-digital.firebasestorage.app", 
  messagingSenderId: "12431218323",
  appId: "1:12431218323:web:496889db3f6ce01b515f66"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);

// Messaging servisini al
const messaging = firebase.messaging();

// Arka planda (background) gelen mesajları dinle
messaging.onBackgroundMessage(function(payload) {
  console.log('Background mesaj alındı:', payload);
  
  const notificationTitle = payload.notification?.title || 'Yeni Büyük Transfer';
  const notificationOptions = {
    body: payload.notification?.body || 'Yeni bir büyük USDT transferi gerçekleşti',
    icon: '/firebase-logo.png',
    badge: '/firebase-logo.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Bildirime tıklandığında
self.addEventListener('notificationclick', function(event) {
  console.log('Bildirim tıklandı:', event);
  event.notification.close();

  // Ana sayfayı aç veya odakla
  event.waitUntil(
    clients.matchAll().then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url == '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
