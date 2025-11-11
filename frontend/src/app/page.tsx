'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFCMToken, onMessageListener, playNotificationSound } from '@/lib/firebase/client';
import { useSettings } from '@/contexts/SettingsContext';
import { ControlPanel } from '@/components/ControlPanel';

import { cn } from '@/lib/utils';
import { Bell, Shield, Activity, TrendingUp, ExternalLink, Copy, Check, Settings } from 'lucide-react';

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
  messageId?: string;
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

const USDT_CONTRACT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

export default function Home() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [totalNotifications, setTotalNotifications] = useState<number>(0);
    const [lastTransferAt, setLastTransferAt] = useState<string>('');
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [controlPanelOpen, setControlPanelOpen] = useState(false);

  const { soundEnabled, popupNotificationsEnabled } = useSettings();

  // Load localStorage data and permission state after hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);
      
      // Load notification permission
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }
      
      // Load localStorage data
      try {
        const saved = localStorage.getItem('recentTransfers');
        const parsedData = saved ? JSON.parse(saved) : [];
        
        // Check for valid data format
        const validData = parsedData.filter((item: NotificationData) => 
          item.id && 
          item.timestamp && 
          typeof item.timestamp === 'number'
        );
        
        setNotifications(validData);
      } catch {
        // Clear corrupted localStorage silently
        localStorage.removeItem('recentTransfers');
      }
    }
  }, []);

  const addNotification = useCallback((payload: MessagePayload) => {
    // Create unique ID - use Firebase messageId if available, otherwise timestamp + random
    const uniqueId = payload.messageId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newNotification: NotificationData = {
      id: uniqueId,
      title: payload.notification?.title,
      body: payload.notification?.body,
      fromAddress: payload.data?.fromAddress,
      toAddress: payload.data?.toAddress,
      amount: payload.data?.amount,
      txHash: payload.data?.txHash || 'pending',
      timestamp: Date.now(),
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, 50); // Keep max 50 notifications
      // LocalStorage'a kaydet
      try {
        localStorage.setItem('recentTransfers', JSON.stringify(updated));
      } catch (error) {
        console.error('LocalStorage save error:', error);
      }
      return updated;
    });
    
    // Play sound if enabled
    if (soundEnabled) {
      playNotificationSound();
    }
    
    // Show popup notification if enabled and permission granted
    if (popupNotificationsEnabled && Notification.permission === 'granted') {
      try {
        const notification = new Notification(
          payload.notification?.title || 'USDT Transfer',
          {
            body: payload.notification?.body || 'New transfer detected',
            icon: '/firebase-logo.png',
            tag: 'usdt-transfer-' + Date.now(), // Unique tag to avoid replacement
            requireInteraction: true,
            silent: !soundEnabled,
          }
        );
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        // Auto close after 8 seconds
        setTimeout(() => {
          notification.close();
        }, 8000);
        
      } catch (error) {
        console.error('Error showing popup notification:', error);
      }
    }
    
    // Update total count when new notification arrives
    setTotalNotifications(prev => prev + 1);
    setLastTransferAt(new Date().toISOString());
  }, [soundEnabled, popupNotificationsEnabled]);

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

      await response.json();
      // Successfully subscribed to topic
    } catch (error) {
      console.error('Konuya abone olma hatası:', error);
    }
  }, []);

  // Recent transfers'ı sync et
  const syncRecentTransfers = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/recent-transfers?since=${lastSyncTimestamp}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.transfers.length > 0) {
          setNotifications(prev => {
            // Yeni transfer'ları mevcut liste ile merge et
            const newTransfers = data.transfers.filter(
              (newTransfer: NotificationData) => !prev.some(existing => existing.id === newTransfer.id)
            );
            
            const updated = [...newTransfers, ...prev].slice(0, 50);
            
            // LocalStorage'a kaydet
            try {
              localStorage.setItem('recentTransfers', JSON.stringify(updated));
            } catch (error) {
              console.error('LocalStorage save error:', error);
            }
            
            return updated;
          });
          
          setLastSyncTimestamp(data.timestamp);
        }
      }
    } catch (error) {
      console.error('Error syncing transfers:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [lastSyncTimestamp]);

  // Manual refresh function
  const refreshTransfers = useCallback(async () => {
    await syncRecentTransfers();
  }, [syncRecentTransfers]);

  const initializeFCM = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // FCM token'ını al
      const token = await getFCMToken();
      if (token) {
        setFcmToken(token);
        // FCM Token obtained successfully

        // Token'ı sunucuya gönder (konuya abone et)
        await subscribeToTopic(token);

        // Foreground mesaj dinleyicisini kur
        onMessageListener((payload) => {
          // New notification received and processed
          addNotification(payload as MessagePayload);
        });
      }
    } catch (error) {
      console.error('FCM başlatma hatası:', error);
    } finally {
      setIsLoading(false);
    }
  }, [subscribeToTopic, addNotification]);

  const fetchNotificationCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/count');
      if (response.ok) {
        const data = await response.json();
        setTotalNotifications(data.count);
        setLastTransferAt(data.lastTransferAt);
      }
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  }, []);

  useEffect(() => {
    // Check current notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // If permission is already granted, get token and set up listener
    if (Notification.permission === 'granted') {
      initializeFCM();
    }

    // Fetch total notification count
    fetchNotificationCount();
  }, [initializeFCM, fetchNotificationCount]);

  // Listen for Service Worker messages (for background notifications)
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'FIREBASE_BACKGROUND_MESSAGE') {
        console.log('Background message received in main app:', event.data.payload);
        addNotification(event.data.payload as MessagePayload);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      };
    }
  }, [addNotification]);

  // Otomatik polling - her 30 saniyede bir yeni transfer'ları kontrol et
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncRecentTransfers();
      }
    }, 30000); // 30 saniye

    return () => clearInterval(interval);
  }, [syncRecentTransfers]);

  const requestPermission = async () => {
    try {
      setIsLoading(true);
      
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        await initializeFCM();
      }
    } catch (error) {
      console.error('Notification permission error:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const truncateTxHash = (txHash: string) => {
    if (!txHash || txHash === 'undefined' || txHash === 'null' || txHash === 'unknown' || txHash === 'pending') return 'Pending...';
    if (!txHash.startsWith('0x')) return 'Invalid TX';
    // Transaction hash için daha uzun gösterim (0x + 6 karakter + ... + son 6 karakter)
    return `${txHash.slice(0, 8)}...${txHash.slice(-6)}`;
  };

  const formatAmount = (amount: string) => {
    if (!amount) return '';
    return parseFloat(amount).toLocaleString() + ' USDT';
  };

  const getEtherscanLink = (txHash: string) => {
    return `https://etherscan.io/tx/${txHash}`;
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };



  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Grid Background */}
      <div
        className={cn(
          "absolute inset-0",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)]",
          "opacity-60"
        )}
      />
      
      {/* Header */}
      <header className="relative z-10 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-white">USDT Monitor</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Blockchain Transfer Tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-sm text-zinc-600 dark:text-zinc-300">Live</span>
              </div>
              <motion.button
                onClick={() => setControlPanelOpen(true)}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Settings className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 relative z-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Notifications</p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-white">{totalNotifications.toLocaleString()}</p>
                {lastTransferAt && (
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    Last: {new Date(lastTransferAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Status</p>
                <p className="text-xl font-semibold text-zinc-900 dark:text-white">
                  {!isClient ? 'Loading...' : (permission === 'granted' ? 'Active' : 'Inactive')}
                </p>
              </div>
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center",
                !isClient 
                  ? "bg-gray-50 dark:bg-gray-900/20" 
                  : permission === 'granted' 
                    ? "bg-green-50 dark:bg-green-900/20" 
                    : "bg-red-50 dark:bg-red-900/20"
              )}>
                <Activity className={cn(
                  "w-6 h-6",
                  !isClient 
                    ? "text-gray-600 dark:text-gray-400" 
                    : permission === 'granted' 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-red-600 dark:text-red-400"
                )} />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Recent Activity</p>
                <p className="text-xl font-semibold text-zinc-900 dark:text-white">
                  {!isClient ? 'Loading...' : (notifications.length > 0 ? 'Active' : 'Waiting')}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>



        {/* Permission Card */}
        {permission !== 'granted' && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Enable Notifications</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-md mx-auto">
              Allow notifications to receive real-time alerts about large USDT transfers on the blockchain.
            </p>
            <motion.button
              onClick={requestPermission}
              disabled={isLoading}
              className={cn(
                "px-8 py-3 rounded-lg font-medium text-white transition-all duration-200",
                "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "shadow-sm hover:shadow-md"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Loading...
                </div>
              ) : (
                'Enable Notifications'
              )}
            </motion.button>
          </div>
        )}

        {/* Status Card */}
        {permission === 'granted' && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                <div>
                  <h3 className="text-lg font-medium text-green-800 dark:text-green-200">Notifications Active</h3>
                  <p className="text-sm text-green-600 dark:text-green-400">Monitoring USDT transfers in real-time</p>
                </div>
              </div>

              {fcmToken && (
                <div className="flex items-center space-x-2">
                  <code className="text-xs bg-white dark:bg-zinc-800 px-3 py-1 rounded border text-zinc-600 dark:text-zinc-400">
                    {truncateAddress(fcmToken)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(fcmToken, 'token')}
                    className="p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded transition-colors"
                  >
                    {copiedId === 'token' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-green-600" />
                    )}
                  </button>
                </div>
              )}
            </div>
            
            {/* USDT Contract Info */}
            <div className="bg-white dark:bg-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-green-700 dark:text-green-200">₮</span>
                    </div>
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-200">USDT Token Contract</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs font-mono bg-green-100 dark:bg-green-800/50 px-2 py-1 rounded text-green-800 dark:text-green-200">
                      {truncateAddress(USDT_CONTRACT_ADDRESS)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(USDT_CONTRACT_ADDRESS, 'contract')}
                      className="p-1 hover:bg-green-200 dark:hover:bg-green-700 rounded transition-colors"
                      title="Copy contract address"
                    >
                      {copiedId === 'contract' ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-green-600" />
                      )}
                    </button>
                  </div>
                </div>
                <a
                  href={`https://etherscan.io/address/${USDT_CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <span>View on Etherscan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Recent Transfers</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {notifications.length} total notifications
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={refreshTransfers}
                  disabled={isRefreshing}
                  className="flex items-center space-x-1 text-xs text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
                  title="Refresh transfers"
                >
                  <svg 
                    className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      setNotifications([]);
                      localStorage.removeItem('recentTransfers');
                    }}
                    className="text-xs text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">Live</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">

            <AnimatePresence>
              {notifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-zinc-400" />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
                    No notifications yet
                  </h3>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mx-auto">
                    Large USDT transfers will appear here when they occur on the blockchain
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-4">{
                  notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-medium text-zinc-900 dark:text-white">
                              {notification.title || 'Large Transfer Detected'}
                            </h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                              {new Date(notification.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-medium">
                          New
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
                          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            From
                          </label>
                          <div className="flex items-center justify-between mt-2">
                            <code className="text-sm font-mono text-zinc-900 dark:text-white">
                              {notification.fromAddress ? truncateAddress(notification.fromAddress) : 'Unknown'}
                            </code>
                            {notification.fromAddress && (
                              <button
                                onClick={() => copyToClipboard(notification.fromAddress!, `from-${notification.id}`)}
                                className="ml-2 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                              >
                                {copiedId === `from-${notification.id}` ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3 text-zinc-400" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
                          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            To
                          </label>
                          <div className="flex items-center justify-between mt-2">
                            <code className="text-sm font-mono text-zinc-900 dark:text-white">
                              {notification.toAddress ? truncateAddress(notification.toAddress) : 'Unknown'}
                            </code>
                            {notification.toAddress && (
                              <button
                                onClick={() => copyToClipboard(notification.toAddress!, `to-${notification.id}`)}
                                className="ml-2 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                              >
                                {copiedId === `to-${notification.id}` ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3 text-zinc-400" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                          <label className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wider">
                            Amount
                          </label>
                          <p className="text-lg font-bold text-green-800 dark:text-green-200 mt-2">
                            {notification.amount ? formatAmount(notification.amount) : 'Unknown'}
                          </p>
                        </div>
                      </div>

                      {notification.txHash && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                          <div>
                            <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                              Transaction Hash
                            </label>
                            <code className="text-sm font-mono text-zinc-900 dark:text-white block mt-1">
                              {truncateTxHash(notification.txHash)}
                            </code>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => copyToClipboard(notification.txHash!, `tx-${notification.id}`)}
                              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                              title="Copy transaction hash"
                            >
                              {copiedId === `tx-${notification.id}` ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-zinc-400" />
                              )}
                            </button>
                            <a
                              href={getEtherscanLink(notification.txHash)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors text-blue-600 dark:text-blue-400"
                              title="View on Etherscan"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      )}

                      {notification.body && (
                        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {notification.body}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))
                }
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
      
      {/* Control Panel */}
      <ControlPanel 
        isOpen={controlPanelOpen} 
        onClose={() => setControlPanelOpen(false)} 
      />
    </div>
  );
}
