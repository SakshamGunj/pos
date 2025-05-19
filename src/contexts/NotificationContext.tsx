import React, { createContext, useContext, useState, ReactNode } from 'react';
import Notification, { NotificationType } from '../components/Notification';

interface NotificationContextProps {
  showNotification: (type: NotificationType, message: string, duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
    isVisible: boolean;
    duration: number;
  }>({ type: 'info', message: '', isVisible: false, duration: 2000 });

  const showNotification = (type: NotificationType, message: string, duration = 2000) => {
    setNotification({ type, message, isVisible: true, duration });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Notification
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={hideNotification}
        autoHideDuration={notification.duration}
      />
    </NotificationContext.Provider>
  );
};
