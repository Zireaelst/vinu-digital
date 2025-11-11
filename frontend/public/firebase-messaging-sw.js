// Firebase messaging service worker
try {
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');
} catch (error) {
  console.error('[firebase-messaging-sw.js] Error loading Firebase scripts:', error);
}

// Firebase config
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

// Arka plan mesajlarını handle et
messaging.onBackgroundMessage((payload) => {
  // Only log when debugging - reduce console noise
  if (self.location.hostname === 'localhost') {
    console.log('[firebase-messaging-sw.js] Background message received:', payload);
  }

  // Main app'e bildirim gönder (Recent Transfers güncellemesi için)
  self.clients.matchAll({ type: 'window' }).then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'FIREBASE_BACKGROUND_MESSAGE',
        payload: payload
      });
    });
  });

  // Popup ayarını kontrol et - eğer payload'da popupEnabled false ise popup gösterme
  const shouldShowPopup = payload.data?.popupEnabled !== 'false';
  
  if (!shouldShowPopup) {
    console.log('[firebase-messaging-sw.js] Popup disabled, not showing notification');
    return;
  }

  const notificationTitle = payload.notification?.title || payload.data?.title || 'USDT Transfer Alert';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'New USDT transfer detected',
    icon: '/firebase-logo.png',
    badge: '/firebase-logo.png',
    tag: 'usdt-transfer',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/view-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/close-icon.png'
      }
    ],
    data: {
      url: payload.data?.url || '/',
      ...payload.data
    }
  };

  // Show notification only if popup is enabled
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Bildirime tıklandığında
self.addEventListener('notificationclick', function(event) {
  console.log('Bildirim tıklandı:', event);
  event.notification.close();

  if (event.action === 'view') {
    // View action - open transaction on Etherscan
    const txHash = event.notification.data?.txHash;
    if (txHash) {
      event.waitUntil(
        clients.openWindow(`https://etherscan.io/tx/${txHash}`)
      );
    }
  } else if (event.action === 'close') {
    // Close action - just close
    return;
  } else {
    // Default click - focus main page
    event.waitUntil(
      clients.matchAll().then(function(clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});
