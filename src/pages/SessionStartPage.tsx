import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayIcon, ArrowPathIcon, ClockIcon, BanknotesIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { useSession } from '../contexts/SessionContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatCurrency } from '../utils/formatUtils';
import { getAllSessions } from '../firebase/services/sessionService';

const SessionStartPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentSession, isSessionActive, isLoading, startNewSession } = useSession();
  const { showNotification } = useNotification();
  const [userId, setUserId] = useState('default-user'); // In a real app, this would come from authentication
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loadingRecentSessions, setLoadingRecentSessions] = useState(false);

  useEffect(() => {
    // If a session is already active, redirect to tables page
    if (isSessionActive && !isLoading) {
      navigate('/tables');
    }
  }, [isSessionActive, isLoading, navigate]);

  // Load recent sessions
  useEffect(() => {
    const loadRecentSessions = async () => {
      try {
        setLoadingRecentSessions(true);
        const sessions = await getAllSessions();
        // Get the 3 most recent sessions
        setRecentSessions(sessions.slice(0, 3));
      } catch (error) {
        console.error('Error loading recent sessions:', error);
        showNotification('error', 'Failed to load recent sessions');
      } finally {
        setLoadingRecentSessions(false);
      }
    };

    if (!isSessionActive && !isLoading) {
      loadRecentSessions();
    }
  }, [isSessionActive, isLoading, showNotification]);

  // Format date for display
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Format time for display
  const formatTime = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate session duration
  const getSessionDuration = (session: any) => {
    if (!session.endTime || !session.startTime) return '';
    
    const start = session.startTime instanceof Date ? session.startTime : new Date(session.startTime);
    const end = session.endTime instanceof Date ? session.endTime : new Date(session.endTime);
    
    const diffMs = end.getTime() - start.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  };

  const handleStartSession = async () => {
    try {
      await startNewSession(userId);
      showNotification('success', 'Session started successfully');
      navigate('/tables');
    } catch (error) {
      console.error('Failed to start session:', error);
      showNotification('error', 'Failed to start session');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-lg w-full p-6 sm:p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to POS System</h1>
          <p className="text-gray-600">Start a new session to begin taking orders</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6">
            <ArrowPathIcon className="h-12 w-12 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Previous Session Summary */}
            {currentSession && !currentSession.isActive && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-medium text-yellow-800">Previous Session Summary</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-xs text-gray-500">Session Period</p>
                      <p className="font-medium">
                        {formatDate(currentSession.startTime)} {formatTime(currentSession.startTime)} - {formatTime(currentSession.endTime)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-medium">{getSessionDuration(currentSession)}</p>
                    </div>
                  </div>
                  <p className="mt-1 font-medium text-lg text-yellow-800">Total Revenue: {formatCurrency(currentSession.totalRevenue)}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="flex items-center">
                        <BanknotesIcon className="h-4 w-4 text-green-500 mr-1" />
                        <p className="text-xs text-gray-500">Cash</p>
                      </div>
                      <p className="font-medium text-green-700">{formatCurrency(currentSession.cashTotal)}</p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="flex items-center">
                        <CreditCardIcon className="h-4 w-4 text-blue-500 mr-1" />
                        <p className="text-xs text-gray-500">UPI</p>
                      </div>
                      <p className="font-medium text-blue-700">{formatCurrency(currentSession.upiTotal)}</p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <div className="flex items-center">
                        <CreditCardIcon className="h-4 w-4 text-purple-500 mr-1" />
                        <p className="text-xs text-gray-500">Bank</p>
                      </div>
                      <p className="font-medium text-purple-700">{formatCurrency(currentSession.bankTotal)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Recent Sessions */}
            {recentSessions.length > 0 && (
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-medium text-indigo-800 mb-2">Recent Sessions</h3>
                <div className="space-y-2">
                  {recentSessions.map(session => (
                    <div key={session.id} className="bg-white p-3 rounded shadow-sm">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 text-indigo-500 mr-1" />
                            <p className="text-sm font-medium">{formatDate(session.startTime)}</p>
                          </div>
                          <p className="text-xs text-gray-500">{formatTime(session.startTime)} - {session.endTime ? formatTime(session.endTime) : 'Ongoing'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-indigo-700">{formatCurrency(session.totalRevenue)}</p>
                          <p className="text-xs text-gray-500">{session.endTime ? getSessionDuration(session) : 'Active'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleStartSession}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-150"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              Start New Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionStartPage;
