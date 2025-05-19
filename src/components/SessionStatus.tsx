import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import { useNotification } from '../contexts/NotificationContext';
import { ClockIcon, StopCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SessionStatus: React.FC = () => {
  const { currentSession, isSessionActive, closeCurrentSession } = useSession();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Show confirmation modal
  const handleShowConfirmModal = () => {
    setShowConfirmModal(true);
  };

  // Close session after confirmation
  const handleCloseSession = async () => {
    try {
      await closeCurrentSession();
      showNotification('success', 'Session closed successfully');
      navigate('/');
    } catch (error) {
      console.error('Error closing session:', error);
      showNotification('error', 'Failed to close session');
    } finally {
      setShowConfirmModal(false);
    }
  };

  if (!isSessionActive) return null;

  // Format session start time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  // Get session duration in hours and minutes
  const getSessionDuration = () => {
    if (!currentSession) return '';
    
    const start = currentSession.startTime instanceof Date ? currentSession.startTime : new Date(currentSession.startTime);
    const now = new Date();
    
    const diffMs = now.getTime() - start.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  };

  return (
    <>
      <div className="flex items-center ml-4">
        <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-l-md">
          <ClockIcon className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium hidden md:inline">Session Active</span>
          <span className="text-xs font-medium md:ml-1">
            {currentSession && 
              <span className="whitespace-nowrap">
                {formatTime(new Date(currentSession.startTime))} • {getSessionDuration()}
              </span>
            }
          </span>
        </div>
        <button 
          onClick={handleShowConfirmModal}
          className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-r-md hover:bg-red-200 transition-colors"
        >
          <StopCircleIcon className="h-4 w-4 mr-1" />
          <span className="text-xs font-medium">End Session</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Close Session</h3>
              <button 
                onClick={() => setShowConfirmModal(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-600 mb-4">
                Are you sure you want to close the current session? This will end the current shift and finalize all financial records.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloseSession}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Close Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionStatus;
