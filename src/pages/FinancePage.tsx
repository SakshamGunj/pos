import React, { useState, useEffect } from 'react';
import { BanknotesIcon, CreditCardIcon, CalculatorIcon, ClockIcon } from '@heroicons/react/24/outline';
import { getAllSessions, getSessionTransactions } from '../firebase/services/sessionService';
import { Session, Transaction } from '../types/session';
import { formatCurrency } from '../utils/formatUtils';

const FinancePage: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedSessions = await getAllSessions();
        setSessions(fetchedSessions);
        
        // Select the most recent session by default
        if (fetchedSessions.length > 0) {
          setSelectedSession(fetchedSessions[0]);
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to load session data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Fetch transactions when a session is selected
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!selectedSession) return;
      
      try {
        setIsLoading(true);
        const fetchedTransactions = await getSessionTransactions(selectedSession.id);
        setTransactions(fetchedTransactions);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transaction data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedSession]);

  // Format date for display
  const formatDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString('en-IN');
  };

  // Calculate session duration
  const getSessionDuration = (session: Session) => {
    if (!session.endTime) return 'Ongoing';
    
    const start = session.startTime instanceof Date ? session.startTime : new Date(session.startTime);
    const end = session.endTime instanceof Date ? session.endTime : new Date(session.endTime);
    
    const diffMs = end.getTime() - start.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  };

  // Format date range for session
  const getSessionDateRange = (session: Session) => {
    const start = session.startTime instanceof Date ? session.startTime : new Date(session.startTime);
    const end = session.endTime ? (session.endTime instanceof Date ? session.endTime : new Date(session.endTime)) : null;
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    };
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };
    
    if (!end) {
      return `${formatDate(start)} ${formatTime(start)} - Ongoing`;
    }
    
    // If same day
    if (start.toDateString() === end.toDateString()) {
      return `${formatDate(start)}: ${formatTime(start)} - ${formatTime(end)}`;
    }
    
    // Different days
    return `${formatDate(start)} ${formatTime(start)} - ${formatDate(end)} ${formatTime(end)}`;
  };

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error && sessions.length === 0) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500 font-semibold mb-2">{error}</p>
        <button 
          onClick={() => setIsLoading(true)} 
          className="px-4 py-2 bg-primary text-white rounded-md"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-1">No Sessions Found</h3>
        <p className="text-gray-500">Start a new session to begin tracking finances</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Financial Reports</h1>
      
      {/* Session Selector */}
      <div className="mb-6">
        <label htmlFor="sessionSelect" className="block text-sm font-medium text-gray-700 mb-2">
          Select Session
        </label>
        <select
          id="sessionSelect"
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          value={selectedSession?.id || ''}
          onChange={(e) => {
            const session = sessions.find(s => s.id === e.target.value);
            setSelectedSession(session || null);
          }}
        >
          {sessions.map(session => (
            <option key={session.id} value={session.id}>
              {formatDate(session.startTime)} {session.isActive ? '(Active)' : ''}
            </option>
          ))}
        </select>
      </div>
      
      {selectedSession && (
        <div className="space-y-6">
          {/* Session Overview */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Session Overview</h2>
            </div>
            <div className="p-4">
              {/* Session timeline display */}
              <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Session Timeline</p>
                <p className="font-medium text-indigo-800">{getSessionDateRange(selectedSession)}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium text-green-800">{getSessionDuration(selectedSession)}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${selectedSession.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {selectedSession.isActive ? 'Active' : 'Closed'}
                    </span>
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-500">Transactions</p>
                  <p className="font-medium text-purple-800">{transactions.length}</p>
                </div>
              </div>
              
              {selectedSession.notes && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-500">Session Notes</p>
                  <p className="font-medium text-yellow-800">{selectedSession.notes}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Revenue Breakdown */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Revenue Breakdown</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CalculatorIcon className="h-8 w-8 text-indigo-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Total Revenue</p>
                      <p className="text-xl font-bold text-indigo-600">{formatCurrency(selectedSession.totalRevenue)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <BanknotesIcon className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Cash</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(selectedSession.cashTotal)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CreditCardIcon className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">UPI</p>
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(selectedSession.upiTotal)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CreditCardIcon className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Bank</p>
                      <p className="text-xl font-bold text-purple-600">{formatCurrency(selectedSession.bankTotal)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Transactions */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        Loading transactions...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No transactions found for this session
                      </td>
                    </tr>
                  ) : (
                    transactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {transaction.orderId.slice(-6)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.paymentMethod === 'CASH' ? 'bg-green-100 text-green-800' :
                            transaction.paymentMethod === 'UPI' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {transaction.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(transaction.timestamp)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'refunded' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
