'use client';

import React, { createContext, useContext, useState } from 'react';

interface SettingsContextType {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  popupNotificationsEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setPopupNotificationsEnabled: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  // Initialize state with localStorage values
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundEnabled');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notificationsEnabled');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  const [popupNotificationsEnabled, setPopupNotificationsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('popupNotificationsEnabled');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Save to localStorage whenever settings change
  const handleSetSoundEnabled = (enabled: boolean) => {
    setSoundEnabled(enabled);
    localStorage.setItem('soundEnabled', JSON.stringify(enabled));
  };

  const handleSetNotificationsEnabled = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    localStorage.setItem('notificationsEnabled', JSON.stringify(enabled));
  };

  const handleSetPopupNotificationsEnabled = (enabled: boolean) => {
    setPopupNotificationsEnabled(enabled);
    localStorage.setItem('popupNotificationsEnabled', JSON.stringify(enabled));
  };

  return (
    <SettingsContext.Provider
      value={{
        soundEnabled,
        notificationsEnabled,
        popupNotificationsEnabled,
        setSoundEnabled: handleSetSoundEnabled,
        setNotificationsEnabled: handleSetNotificationsEnabled,
        setPopupNotificationsEnabled: handleSetPopupNotificationsEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
