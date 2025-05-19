import React, { useEffect } from 'react';
import { CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
  type: NotificationType;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoHideDuration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  type,
  message,
  isVisible,
  onClose,
  autoHideDuration = 2000, // Default to 2 seconds
}) => {
  // Auto-hide notification after specified duration
  useEffect(() => {
    if (isVisible && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHideDuration, onClose]);

  // Icon and color based on notification type
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircleIcon className="h-6 w-6 text-white" />,
          bgColor: 'bg-success',
        };
      case 'error':
        return {
          icon: <ExclamationCircleIcon className="h-6 w-6 text-white" />,
          bgColor: 'bg-error',
        };
      case 'info':
      default:
        return {
          icon: <InformationCircleIcon className="h-6 w-6 text-white" />,
          bgColor: 'bg-info',
        };
    }
  };

  const { icon, bgColor } = getTypeStyles();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20, x: 20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <div className={`${bgColor} text-white rounded-lg shadow-lg overflow-hidden flex items-center`}>
            <div className="p-3">{icon}</div>
            <div className="py-3 px-4 flex-1">{message}</div>
            <button
              onClick={onClose}
              className="p-3 text-white hover:bg-black hover:bg-opacity-10 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
