import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { AppConfig } from '../config/configuration';

export interface NotificationPayload {
  from: string;
  to: string;
  amount: string;
  txHash: string;
}

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private readonly configService: ConfigService<AppConfig>) {}

  onModuleInit(): void {
    try {
      const configPath = this.configService.get(
        'firebaseAdminConfigPath',
      ) as string;

      if (!configPath) {
        this.logger.warn(
          'Firebase config path not provided. Skipping initialization.',
        );
        return;
      }

      // Initialize Firebase Admin SDK
      const serviceAccountContent = readFileSync(configPath, 'utf8');
      const serviceAccount = JSON.parse(
        serviceAccountContent,
      ) as admin.ServiceAccount;

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }

      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }

  async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      const message = {
        notification: {
          title: '🚨 Large USDT Transfer Detected',
          body: `${payload.amount} USDT transferred from ${payload.from.slice(0, 6)}...${payload.from.slice(-4)} to ${payload.to.slice(0, 6)}...${payload.to.slice(-4)}`,
        },
        data: {
          fromAddress: payload.from,
          toAddress: payload.to,
          amount: payload.amount,
          txHash: payload.txHash,
          timestamp: new Date().toISOString(),
          sound: 'default',
          popupEnabled: 'true', // Default olarak popup açık
        },
        android: {
          notification: {
            sound: 'default',
            channelId: 'usdt_transfers',
            priority: 'high' as const,
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              'content-available': 1,
            },
          },
        },
        webpush: {
          notification: {
            requireInteraction: true,
            silent: false,
            sound: '/notification-sound.mp3',
            vibrate: [200, 100, 200],
            tag: 'usdt-transfer',
          },
        },
        topic: 'largeTransfers', // Send to topic subscribers
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Notification sent successfully: ${response}`);
      this.logger.log(
        `Large transfer notification sent: ${payload.amount} USDT (${payload.txHash})`,
      );

      // Increment notification counter
      await this.incrementNotificationCount();
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  async incrementNotificationCount(): Promise<void> {
    try {
      const db = admin.firestore();
      const counterRef = db.collection('counters').doc('notifications');

      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(counterRef);
        const currentData = doc.data() as { count?: number } | undefined;
        const newCount = doc.exists ? (currentData?.count || 0) + 1 : 1;
        const updatedAt = admin.firestore.FieldValue.serverTimestamp();

        transaction.set(
          counterRef,
          {
            count: newCount,
            updatedAt,
            lastTransferAt: updatedAt,
          },
          { merge: true },
        );
      });

      this.logger.log('Notification counter incremented');
    } catch (error) {
      this.logger.error('Failed to increment notification counter:', error);
    }
  }

  async getNotificationCount(): Promise<{
    count: number;
    lastTransferAt?: admin.firestore.Timestamp;
  }> {
    try {
      const db = admin.firestore();
      const counterRef = db.collection('counters').doc('notifications');
      const doc = await counterRef.get();

      if (doc.exists) {
        const data = doc.data() as {
          count?: number;
          lastTransferAt?: admin.firestore.Timestamp;
        };
        return {
          count: data?.count || 0,
          lastTransferAt: data?.lastTransferAt || undefined,
        };
      }

      return { count: 0 };
    } catch (error) {
      this.logger.error('Failed to get notification count:', error);
      return { count: 0 };
    }
  }

  async sendToToken(
    token: string,
    payload: NotificationPayload,
  ): Promise<void> {
    try {
      const message = {
        notification: {
          title: '🚨 Large USDT Transfer Detected',
          body: `${payload.amount} USDT transferred from ${payload.from.slice(0, 6)}...${payload.from.slice(-4)} to ${payload.to.slice(0, 6)}...${payload.to.slice(-4)}`,
        },
        data: {
          fromAddress: payload.from,
          toAddress: payload.to,
          amount: payload.amount,
          txHash: payload.txHash,
          timestamp: new Date().toISOString(),
        },
        token: token,
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Notification sent to token successfully: ${response}`);

      // Increment notification counter
      await this.incrementNotificationCount();
    } catch (error) {
      this.logger.error('Failed to send notification to token:', error);
      throw error;
    }
  }
}
