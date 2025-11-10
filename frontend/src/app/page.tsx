'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFCMToken, onMessageListener } from '@/lib/firebase/client';
import { cn } from '@/lib/utils';

interface NotificationData {
  id: string;
  title?: string;
  body?: string;
  fromAddress?: string;
  toAddress?: string;
  amount?: string;
  txHash?: string;
  timestamp: number;
}

interface MessagePayload {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: {
    fromAddress?: string;
    toAddress?: string;
    amount?: string;
    txHash?: string;
  };
}

export default function Home() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  const addNotification = useCallback((payload: MessagePayload) => {
    const newNotification: NotificationData = {
      id: Date.now().toString(),
      title: payload.notification?.title,
      body: payload.notification?.body,
      fromAddress: payload.data?.fromAddress,
      toAddress: payload.data?.toAddress,
      amount: payload.data?.amount,
      txHash: payload.data?.txHash,
      timestamp: Date.now(),
    };

    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const subscribeToTopic = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new Error('Konuya abone olma başarısız');
      }

      const result = await response.json();
      console.log('Konuya abone olma başarılı:', result);
    } catch (error) {
      console.error('Konuya abone olma hatası:', error);
    }
  }, []);

  const initializeFCM = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // FCM token'ını al
      const token = await getFCMToken();
      if (token) {
        setFcmToken(token);
        console.log('FCM Token:', token);

        // Token'ı sunucuya gönder (konuya abone et)
        await subscribeToTopic(token);

        // Foreground mesaj dinleyicisini kur
        onMessageListener((payload) => {
          console.log('Yeni bildirim alındı:', payload);
          addNotification(payload as MessagePayload);
        });
      }
    } catch (error) {
      console.error('FCM başlatma hatası:', error);
    } finally {
      setIsLoading(false);
    }
  }, [subscribeToTopic, addNotification]);

  useEffect(() => {
    // Mevcut bildirim iznini kontrol et
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Eğer izin zaten verilmişse, token'ı al ve dinleyiciyi kur
    if (Notification.permission === 'granted') {
      initializeFCM();
    }
  }, [initializeFCM]);



  const requestPermission = async () => {
    try {
      setIsLoading(true);
      
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        await initializeFCM();
      }
    } catch (error) {
      console.error('Bildirim izni hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: string) => {
    if (!amount) return '';
    return parseFloat(amount).toLocaleString() + ' USDT';
  };

  const getEtherscanLink = (txHash: string) => {
    return `https://etherscan.io/tx/${txHash}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            USDT Transfer Monitörü
          </h1>
          <p className="text-slate-300">
            Büyük USDT transferlerini gerçek zamanlı takip edin
          </p>
        </div>

        {/* Permission Button */}
        {permission !== 'granted' && (
          <div className="flex justify-center mb-8">
            <motion.button
              onClick={requestPermission}
              disabled={isLoading}
              className={cn(
                "px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200",
                "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "shadow-lg hover:shadow-xl transform hover:scale-105"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLoading ? 'Yükleniyor...' : 'Bildirimlere İzin Ver'}
            </motion.button>
          </div>
        )}

        {/* Status */}
        {permission === 'granted' && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Bildirimler Aktif
            </div>
            {fcmToken && (
              <p className="text-xs text-slate-400 mt-2">
                Token: {truncateAddress(fcmToken)}
              </p>
            )}
          </div>
        )}

        {/* Notifications Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-2">
            Bildirim Listesi
          </h2>
          <p className="text-slate-400">
            Toplam {notifications.length} bildirim
          </p>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          <AnimatePresence>
            {notifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">📱</div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">
                  Henüz bildirim yok
                </h3>
                <p className="text-slate-500">
                  Büyük USDT transferleri gerçekleştiğinde burada görünecek
                </p>
              </motion.div>
            ) : (
              notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-6 backdrop-blur-sm hover:bg-zinc-900/90 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {notification.title || 'Büyük Transfer'}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {new Date(notification.timestamp).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
                      Yeni
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Gönderen
                      </label>
                      <p className="text-white font-mono text-sm mt-1">
                        {notification.fromAddress ? truncateAddress(notification.fromAddress) : 'Bilinmiyor'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Alıcı
                      </label>
                      <p className="text-white font-mono text-sm mt-1">
                        {notification.toAddress ? truncateAddress(notification.toAddress) : 'Bilinmiyor'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Miktar
                      </label>
                      <p className="text-green-400 font-bold text-lg mt-1">
                        {notification.amount ? formatAmount(notification.amount) : 'Bilinmiyor'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        İşlem Hash
                      </label>
                      {notification.txHash ? (
                        <a
                          href={getEtherscanLink(notification.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 font-mono text-sm mt-1 block transition-colors"
                        >
                          {truncateAddress(notification.txHash)} ↗
                        </a>
                      ) : (
                        <p className="text-white font-mono text-sm mt-1">Bilinmiyor</p>
                      )}
                    </div>
                  </div>

                  {notification.body && (
                    <div className="mt-4 pt-4 border-t border-zinc-700">
                      <p className="text-slate-300 text-sm">
                        {notification.body}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
