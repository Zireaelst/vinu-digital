import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Messaging servisi
let messaging: Messaging | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      try {
        messaging = getMessaging(app);
      } catch (error) {
        console.error('Firebase messaging initialization error:', error);
      }
    }
  }).catch((error) => {
    console.error('Firebase messaging support check error:', error);
  });
}

// FCM token getting function
export const getFCMToken = async (): Promise<string | null> => {
  if (!messaging) return null;
  
  try {
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });
    return token;
  } catch (error) {
    console.error('FCM token could not be retrieved:', error);
    return null;
  }
};

// Notification sound playing function
export const playNotificationSound = () => {
  try {
    // First try Web Audio API generated sound
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).generateNotificationSound) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).generateNotificationSound()) {
        return;
      }
    }
    
    // Fallback to simple beep
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.error('Sound playing error:', error);
    // Ultimate fallback - system beep
    try {
      console.log('\x07'); // ASCII bell character
    } catch {
      console.log('🔊 Notification!');
    }
  }
};

// Foreground mesaj dinleyici
export const onMessageListener = (callback: (payload: object) => void) => {
  if (!messaging) return;
  
  try {
    return onMessage(messaging, (payload) => {
      // Foreground message received and processing
      
      // Settings are handled in the component level now
      // to ensure React context is available
      try {
        callback(payload);
      } catch (error) {
        console.error('Message callback error:', error);
      }
    });
  } catch (error) {
    console.error('onMessage listener setup error:', error);
    return undefined;
  }
};



export { messaging };
