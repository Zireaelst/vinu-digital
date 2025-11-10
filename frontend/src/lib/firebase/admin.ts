import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Singleton deseni - Admin SDK'yı sadece bir kez başlat
let adminApp: admin.app.App | null = null;

const initializeAdmin = () => {
  // Eğer zaten bir app varsa onu kullan
  if (admin.apps.length > 0) {
    adminApp = admin.apps[0] as admin.app.App;
    return adminApp;
  }

  if (adminApp) {
    return adminApp;
  }

  try {
    // .env.local'deki FIREBASE_ADMIN_CONFIG_PATH'den dosyayı oku
    const serviceAccountPath = process.env.FIREBASE_ADMIN_CONFIG_PATH;
    
    if (!serviceAccountPath) {
      throw new Error('FIREBASE_ADMIN_CONFIG_PATH ortam değişkeni bulunamadı');
    }

    // Service account dosyasını oku
    const serviceAccountKey = JSON.parse(
      readFileSync(join(process.cwd(), serviceAccountPath), 'utf8')
    );

    // Admin SDK'yı başlat (sadece eğer henüz başlatılmamışsa)
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountKey),
    });

    console.log('Firebase Admin SDK başarıyla başlatıldı');
    return adminApp;
  } catch (error) {
    console.error('Firebase Admin SDK başlatılamadı:', error);
    throw error;
  }
};

// Admin messaging servisini export et
export const getAdminMessaging = () => {
  const app = initializeAdmin();
  return admin.messaging(app);
};

export default initializeAdmin;
