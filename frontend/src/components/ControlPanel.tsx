'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Volume2, VolumeX, Bell, BellOff, Monitor, MonitorX, X } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import { playNotificationSound } from '@/lib/firebase/client';

interface ControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ isOpen, onClose }) => {
  const {
    soundEnabled,
    notificationsEnabled,
    popupNotificationsEnabled,
    setSoundEnabled,
    setNotificationsEnabled,
    setPopupNotificationsEnabled,
  } = useSettings();



  const handleSoundToggle = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    
    // Test sound when enabling
    if (newState) {
      playNotificationSound();
    }
  };

  const handleNotificationToggle = async () => {
    const newState = !notificationsEnabled;
    
    if (newState) {
      // İzin kontrolü
      if (Notification.permission === 'default') {
        try {
          const permission = await Notification.requestPermission();
          console.log('Notification permission result:', permission);
          
          if (permission === 'granted') {
            setNotificationsEnabled(true);
          } else {
            console.log('Notification permission denied');
            return;
          }
        } catch (error) {
          console.error('Notification permission error:', error);
          return;
        }
      } else if (Notification.permission === 'denied') {
        console.log('Notification permission was previously denied');
        alert('Bildirim izni reddedilmiş. Tarayıcı ayarlarından manuel olarak açmanız gerekiyor.');
        return;
      } else {
        setNotificationsEnabled(true);
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handlePopupToggle = () => {
    setPopupNotificationsEnabled(!popupNotificationsEnabled);
  };



  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-md z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Kontrol Paneli
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Bildirim ayarları
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5 text-zinc-500" />
              </button>
            </div>

            {/* Settings */}
            <div className="space-y-4">
              {/* Sound Settings */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                    <div>
                      <h3 className="font-medium text-zinc-900 dark:text-white">
                        Bildirim Sesleri
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Transfer bildirimleri için ses
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSoundToggle}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                      soundEnabled
                        ? 'bg-green-500'
                        : 'bg-zinc-300 dark:bg-zinc-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                        soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

              </div>

              {/* Firebase Notifications */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {notificationsEnabled ? (
                      <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <BellOff className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                    <div>
                      <h3 className="font-medium text-zinc-900 dark:text-white">
                        Firebase Bildirimleri
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Gerçek zamanlı bildirimler
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleNotificationToggle}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                      notificationsEnabled
                        ? 'bg-blue-500'
                        : 'bg-zinc-300 dark:bg-zinc-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                        notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
                {notificationsEnabled && Notification.permission !== 'granted' && (
                  <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                    ⚠️ Tarayıcı izni gerekli
                  </div>
                )}
              </div>

              {/* Popup Notifications */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {popupNotificationsEnabled ? (
                      <Monitor className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <MonitorX className="w-5 h-5 text-red-600 dark:text-red-400" />
                    )}
                    <div>
                      <h3 className="font-medium text-zinc-900 dark:text-white">
                        Popup Bildirimleri
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Masaüstü bildirim popup&apos;ları
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handlePopupToggle}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                      popupNotificationsEnabled
                        ? 'bg-purple-500'
                        : 'bg-zinc-300 dark:bg-zinc-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                        popupNotificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                Ayarlar otomatik olarak kaydedilir
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
