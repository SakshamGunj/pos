import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, Transaction, PaymentMethod } from '../types/session';
import { 
  startSession, 
  endSession, 
  getActiveSession, 
  getAllSessions,
  addTransaction,
  getSessionById
} from '../firebase/services/sessionService';
import { useNotification } from './NotificationContext';

interface SessionContextType {
  currentSession: Session | null;
  isSessionActive: boolean;
  isLoading: boolean;
  error: string | null;
  startNewSession: (userId: string) => Promise<void>;
  closeCurrentSession: (notes?: string) => Promise<void>;
  processPayment: (orderId: string, amount: number, paymentMethod: PaymentMethod) => Promise<Transaction>;
  refreshSession: () => Promise<void>;
  sessionStats: {
    totalTransactions: number;
    duration: string;
  };
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState({ totalTransactions: 0, duration: '' });
  const { showNotification } = useNotification();

  const isSessionActive = !!currentSession?.isActive;

  // Calculate session duration and update stats
  useEffect(() => {
    if (currentSession) {
      // Calculate duration
      const start = currentSession.startTime instanceof Date ? currentSession.startTime : new Date(currentSession.startTime);
      const end = currentSession.endTime ? 
        (currentSession.endTime instanceof Date ? currentSession.endTime : new Date(currentSession.endTime)) : 
        new Date();
      
      const diffMs = end.getTime() - start.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      setSessionStats({
        totalTransactions: currentSession.transactions?.length || 0,
        duration: `${diffHrs}h ${diffMins}m`
      });
    }
  }, [currentSession]);

  // Load active session on component mount and check localStorage for persistence
  useEffect(() => {
    const loadActiveSession = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // First check if there's a session ID in localStorage
        const savedSessionId = localStorage.getItem('activeSessionId');
        let session = null;
        
        if (savedSessionId) {
          // Try to load the specific session first
          try {
            session = await getSessionById(savedSessionId);
            // If session is not active anymore, clear localStorage
            if (session && !session.isActive) {
              localStorage.removeItem('activeSessionId');
              session = null;
            }
          } catch (err) {
            console.error('Error loading saved session:', err);
            localStorage.removeItem('activeSessionId');
          }
        }
        
        // If no saved session found or it failed to load, get any active session
        if (!session) {
          session = await getActiveSession();
          // If found an active session, save its ID to localStorage
          if (session) {
            localStorage.setItem('activeSessionId', session.id);
          }
        }
        
        setCurrentSession(session);
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Failed to load session data');
        showNotification('error', 'Failed to load session data');
      } finally {
        setIsLoading(false);
      }
    };

    loadActiveSession();
  }, [showNotification]);

  // Start a new session
  const startNewSession = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const newSession = await startSession(userId);
      setCurrentSession(newSession);
      
      // Save session ID to localStorage for persistence
      if (newSession) {
        localStorage.setItem('activeSessionId', newSession.id);
      }
      
      showNotification('success', 'Session started successfully');
    } catch (err: any) {
      console.error('Error starting session:', err);
      setError(err.message || 'Failed to start session');
      showNotification('error', err.message || 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  };

  // Close the current session
  const closeCurrentSession = async (notes?: string) => {
    try {
      if (!currentSession) {
        throw new Error('No active session to close');
      }

      setIsLoading(true);
      setError(null);
      const closedSession = await endSession(notes);
      setCurrentSession(closedSession);
      
      // Remove session ID from localStorage
      localStorage.removeItem('activeSessionId');
      
      showNotification('success', 'Session closed successfully');
    } catch (err: any) {
      console.error('Error closing session:', err);
      setError(err.message || 'Failed to close session');
      showNotification('error', err.message || 'Failed to close session');
    } finally {
      setIsLoading(false);
    }
  };

  // Process a payment and add it to the current session
  const processPayment = async (orderId: string, amount: number, paymentMethod: PaymentMethod) => {
    try {
      if (!currentSession || !isSessionActive) {
        throw new Error('No active session. Please start a session before processing payments.');
      }

      const transaction = await addTransaction(orderId, amount, paymentMethod);
      
      // Refresh the session to get updated totals
      await refreshSession();
      
      return transaction;
    } catch (err: any) {
      console.error('Error processing payment:', err);
      throw new Error(err.message || 'Failed to process payment');
    }
  };

  // Refresh the current session data
  const refreshSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const session = await getActiveSession();
      setCurrentSession(session);
    } catch (err) {
      console.error('Error refreshing session:', err);
      setError('Failed to refresh session data');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentSession,
    isSessionActive,
    isLoading,
    error,
    startNewSession,
    closeCurrentSession,
    processPayment,
    refreshSession,
    sessionStats
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
