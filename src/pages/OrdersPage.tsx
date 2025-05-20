import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircleIcon, ClockIcon, XMarkIcon, MagnifyingGlassIcon, UserIcon, CurrencyDollarIcon, CalendarIcon, AdjustmentsHorizontalIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { getOrders, getOrdersByStatus, updateOrder, getOrdersBySession, getOrdersByDateRange } from '../firebase/services/orderService';
import { getAllSessions } from '../firebase/services/sessionService';
import { Order, OrderItem } from '../types';
import { Session } from '../types/session';
import { formatCurrency } from '../utils/formatUtils';
import { useNotification } from '../contexts/NotificationContext';
import PrintDialog from '../components/modals/PrintDialog';

// Status colors for different order statuses
const statusColors: Record<string, string> = {
  'paid': 'bg-success text-white',
  'placed': 'bg-info text-white',
  'draft': 'bg-gray-200 text-gray-700',
};

const OrdersPage: React.FC = () => {
  // State management
  const [statusFilter, setStatusFilter] = useState<'All' | Order['status']>('All');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printType, setPrintType] = useState<'KOT' | 'BILL'>('KOT');
  const [dateRange, setDateRange] = useState<{startDate: string; endDate: string}>({
    startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('T')[0], // Today at 00:00
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  const { showNotification } = useNotification();

  // Fetch sessions for the filter dropdown
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const fetchedSessions = await getAllSessions();
        setSessions(fetchedSessions);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        showNotification('error', 'Failed to load sessions');
      }
    };
    
    fetchSessions();
  }, [showNotification]);

  // Fetch orders from Firebase based on filters
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        let fetchedOrders;
        
        // Log current filter state for debugging
        console.log('Current filters:', { 
          statusFilter, 
          selectedSessionId, 
          dateRange: { startDate: dateRange.startDate, endDate: dateRange.endDate },
          search
        });
        
        // Filter by session if a specific session is selected
        if (selectedSessionId !== 'all') {
          console.log('Fetching orders for session:', selectedSessionId);
          fetchedOrders = await getOrdersBySession(selectedSessionId);
          console.log(`Found ${fetchedOrders.length} orders for session ${selectedSessionId}`);
          
          // Apply status filter if needed
          if (statusFilter !== 'All') {
            const beforeCount = fetchedOrders.length;
            fetchedOrders = fetchedOrders.filter(order => order.status === statusFilter);
            console.log(`Filtered by status: ${beforeCount} -> ${fetchedOrders.length} orders`);
          }
          
          if (fetchedOrders.length === 0) {
            showNotification('info', `No orders found for the selected session${statusFilter !== 'All' ? ' and status' : ''}`);
          }
        } 
        // Filter by date range
        else if (dateRange.startDate && dateRange.endDate) {
          console.log('Fetching orders for date range:', dateRange.startDate, 'to', dateRange.endDate);
          const startDate = new Date(dateRange.startDate);
          startDate.setHours(0, 0, 0, 0);
          
          const endDate = new Date(dateRange.endDate);
          endDate.setHours(23, 59, 59, 999);
          
          fetchedOrders = await getOrdersByDateRange(startDate, endDate);
          console.log(`Found ${fetchedOrders.length} orders for date range`);
          
          // Apply status filter if needed
          if (statusFilter !== 'All') {
            const beforeCount = fetchedOrders.length;
            fetchedOrders = fetchedOrders.filter(order => order.status === statusFilter);
            console.log(`Filtered by status: ${beforeCount} -> ${fetchedOrders.length} orders`);
          }
          
          if (fetchedOrders.length === 0) {
            showNotification('info', `No orders found for the selected date range${statusFilter !== 'All' ? ' and status' : ''}`);
          }
        }
        // Apply only status filter
        else {
          if (statusFilter === 'All') {
            fetchedOrders = await getOrders();
            console.log(`Found ${fetchedOrders.length} total orders`);
          } else {
            fetchedOrders = await getOrdersByStatus(statusFilter);
            console.log(`Found ${fetchedOrders.length} orders with status: ${statusFilter}`);
          }
        }
        
        setOrders(fetchedOrders || []);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
        showNotification('error', 'Failed to load orders');
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, [statusFilter, selectedSessionId, dateRange.startDate, dateRange.endDate, showNotification]);

  // Filter orders based on search term
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    
    const searchTerm = search.toLowerCase().trim();
    return orders.filter(order => {
      // Check order ID
      if (order.id?.toLowerCase().includes(searchTerm)) return true;
      
      // Check table ID
      if (order.tableId?.toLowerCase().includes(searchTerm)) return true;
      
      // Check order items
      if (order.orderItems?.some(item => {
        // Check menu item name
        if (item.menuItem?.name?.toLowerCase().includes(searchTerm)) return true;
        
        // Check category
        if (item.menuItem?.category?.toLowerCase().includes(searchTerm)) return true;
        
        return false;
      })) return true;
      
      // Check customer name if available
      if (order.customerName?.toLowerCase().includes(searchTerm)) return true;
      
      // Check order date (formatted as string)
      const orderDate = order.orderDate instanceof Date ? order.orderDate : new Date(order.orderDate);
      const dateStr = orderDate.toLocaleDateString('en-IN');
      if (dateStr.includes(searchTerm)) return true;
      
      return false;
    });
  }, [search, orders]);

  // Handle order status updates
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      // Update order in Firebase
      await updateOrder(orderId, { status: newStatus });
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      // Update selected order if it's the one being modified
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      
      showNotification('success', `Order status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating order status:', err);
      showNotification('error', 'Failed to update order status');
    }
  };

  // Format date for display
  const formatDate = (date: any) => {
    try {
      // Handle Firestore Timestamp objects
      if (date && typeof date === 'object' && 'toDate' in date) {
        return date.toDate().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
      
      // Handle Date objects and strings
      const d = date instanceof Date ? date : new Date(date);
      
      // Check if date is valid
      if (isNaN(d.getTime())) {
        return 'Invalid Date';
      }
      
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid Date';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with filters */}
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-neutral">Orders</h1>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`px-3 py-1.5 rounded-md flex items-center ${showFilters ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-1" />
              Filters
            </button>
            <button 
              onClick={() => setViewMode('grid')} 
              className={`px-3 py-1.5 rounded-md ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Grid
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`px-3 py-1.5 rounded-md ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              List
            </button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1 flex items-center">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div className="flex space-x-2 overflow-x-auto pb-1 w-full sm:w-auto">
            {['All', 'placed', 'paid'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as 'All' | Order['status'])}
                className={`px-3 py-1.5 rounded-md whitespace-nowrap ${statusFilter === status ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Advanced Filters</h3>
              <button 
                onClick={() => {
                  setSelectedSessionId('all');
                  setDateRange({
                    startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0]
                  });
                  setStatusFilter('All');
                  setSearch('');
                  showNotification('success', 'Filters cleared');
                }}
                className="text-xs text-primary hover:text-indigo-700 font-medium"
              >
                Clear All Filters
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Session Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Session</label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                >
                  <option value="all">All Sessions</option>
                  {sessions.map(session => (
                    <option key={session.id} value={session.id}>
                      {new Date(session.startTime).toLocaleDateString('en-IN')} {session.isActive ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Date Range</label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">From</label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => {
                        const newStartDate = e.target.value;
                        setDateRange(prev => ({
                          ...prev,
                          startDate: newStartDate,
                          // Ensure endDate is not before startDate
                          endDate: new Date(newStartDate) > new Date(prev.endDate) ? newStartDate : prev.endDate
                        }));
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      disabled={selectedSessionId !== 'all'}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">To</label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => {
                        const newEndDate = e.target.value;
                        setDateRange(prev => ({
                          ...prev,
                          endDate: newEndDate,
                          // Ensure startDate is not after endDate
                          startDate: new Date(newEndDate) < new Date(prev.startDate) ? newEndDate : prev.startDate
                        }));
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                      disabled={selectedSessionId !== 'all'}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <p className="text-red-500 font-semibold mb-2">{error}</p>
            <button 
              onClick={() => setStatusFilter(statusFilter)} 
              className="px-4 py-2 bg-primary text-white rounded-md"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-semibold text-neutral mb-1">No orders found</p>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map(order => (
              <div 
                key={order.id} 
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold text-neutral">Order #{order.id.slice(-6)}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || 'bg-gray-200 text-gray-700'}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">Table {order.tableId}</div>
                    <div className="text-sm font-semibold text-primary">{formatCurrency(order.totalAmount)}</div>
                  </div>
                </div>
                
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {order.orderItems.map((item, index) => (
                      <div key={index} className="text-sm text-gray-600 flex justify-between">
                        <span>{item.quantity}x {item.menuItem.name}</span>
                        <span>{formatCurrency(item.priceAtAddition * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    {formatDate(order.orderDate)}
                  </div>
                  
                  <div className="mt-3 flex justify-end space-x-2">
                    {order.status === 'pending' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateOrderStatus(order.id, 'preparing');
                        }}
                        className="px-2 py-1 bg-warning text-white rounded-md text-xs"
                      >
                        Start Preparing
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateOrderStatus(order.id, 'ready');
                        }}
                        className="px-2 py-1 bg-primary text-white rounded-md text-xs"
                      >
                        Mark Ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateOrderStatus(order.id, 'served');
                        }}
                        className="px-2 py-1 bg-accent text-white rounded-md text-xs"
                      >
                        Mark Served
                      </button>
                    )}
                    {order.status === 'served' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateOrderStatus(order.id, 'paid');
                        }}
                        className="px-2 py-1 bg-success text-white rounded-md text-xs"
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Table</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map(order => (
                  <tr 
                    key={order.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral">#{order.id.slice(-6)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{order.tableId}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                      {order.orderItems.map(item => `${item.quantity}x ${item.menuItem.name}`).join(', ')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral">{formatCurrency(order.totalAmount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold ${statusColors[order.status] || 'bg-gray-200 text-gray-700'}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {order.status === 'pending' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateOrderStatus(order.id, 'preparing');
                            }}
                            className="px-2 py-1 bg-warning text-white rounded-md text-xs"
                          >
                            Start
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateOrderStatus(order.id, 'ready');
                            }}
                            className="px-2 py-1 bg-primary text-white rounded-md text-xs"
                          >
                            Ready
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateOrderStatus(order.id, 'served');
                            }}
                            className="px-2 py-1 bg-accent text-white rounded-md text-xs"
                          >
                            Served
                          </button>
                        )}
                        {order.status === 'served' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateOrderStatus(order.id, 'paid');
                            }}
                            className="px-2 py-1 bg-success text-white rounded-md text-xs"
                          >
                            Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-neutral">Order Details</h2>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-500">Order ID</div>
                  <div className="text-lg font-semibold">#{selectedOrder.id.slice(-6)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="flex items-center">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${statusColors[selectedOrder.status] || 'bg-gray-200 text-gray-700'}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Table</div>
                  <div className="text-lg font-semibold">{selectedOrder.tableId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Date</div>
                  <div className="text-lg font-semibold">{formatDate(selectedOrder.orderDate)}</div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Order Items</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {selectedOrder.orderItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center pb-2 border-b border-gray-200 last:border-b-0 last:pb-0">
                        <div className="flex items-center">
                          <div className="font-semibold mr-2">{item.quantity}x</div>
                          <div>
                            <div className="font-medium">{item.menuItem.name}</div>
                            {item.menuItem.description && (
                              <div className="text-xs text-gray-500">{item.menuItem.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="font-semibold">{formatCurrency(item.priceAtAddition * item.quantity)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between mb-2">
                  <div className="text-gray-600">Subtotal</div>
                  <div className="font-medium">{formatCurrency(selectedOrder.subtotal)}</div>
                </div>
                <div className="flex justify-between mb-2">
                  <div className="text-gray-600">Tax</div>
                  <div className="font-medium">{formatCurrency(selectedOrder.taxAmount)}</div>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <div className="font-semibold">Total</div>
                  <div className="font-semibold text-lg">{formatCurrency(selectedOrder.totalAmount)}</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
              
              <div className="flex space-x-2">
                {/* Print buttons */}
                <button
                  onClick={() => {
                    setPrintType('KOT');
                    setPrintDialogOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center"
                >
                  <PrinterIcon className="h-5 w-5 mr-1" />
                  Print KOT
                </button>
                <button
                  onClick={() => {
                    setPrintType('BILL');
                    setPrintDialogOpen(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-md flex items-center"
                >
                  <PrinterIcon className="h-5 w-5 mr-1" />
                  Print Bill
                </button>
                {selectedOrder.status === 'pending' && (
                  <button 
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'preparing')}
                    className="px-4 py-2 bg-warning text-white rounded-md"
                  >
                    Start Preparing
                  </button>
                )}
                {selectedOrder.status === 'preparing' && (
                  <button 
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'ready')}
                    className="px-4 py-2 bg-primary text-white rounded-md"
                  >
                    Mark Ready
                  </button>
                )}
                {selectedOrder.status === 'ready' && (
                  <button 
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'served')}
                    className="px-4 py-2 bg-accent text-white rounded-md"
                  >
                    Mark Served
                  </button>
                )}
                {selectedOrder.status === 'served' && (
                  <button 
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'paid')}
                    className="px-4 py-2 bg-success text-white rounded-md"
                  >
                    Mark Paid
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Dialog */}
      {selectedOrder && (
        <PrintDialog
          isOpen={printDialogOpen}
          onClose={() => setPrintDialogOpen(false)}
          type={printType}
          orderData={selectedOrder}
        />
      )}
    </div>
  );
};

export default OrdersPage;
