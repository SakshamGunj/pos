import React, { useState, useEffect, useMemo } from 'react';
import { ClockIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const mockKDSOrders = [
  {
    id: 'ORD002',
    table: '2',
    items: [
      { name: 'Latte', qty: 1, prepared: false },
      { name: 'Club Sandwich', qty: 1, prepared: false },
    ],
    status: 'In Progress',
    placedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
  },
  {
    id: 'ORD004',
    table: '4',
    items: [
      { name: 'Espresso', qty: 1, prepared: false },
      { name: 'Blueberry Muffin', qty: 2, prepared: false },
    ],
    status: 'In Progress',
    placedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
  },
];

function timeSince(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

const KDSPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>(mockKDSOrders.filter(o => o.status !== 'Completed' && o.status !== 'Paid')); // Initialize with active orders
  const [now, setNow] = useState(Date.now()); // For timeSince updates

  // Auto-refresh time and simulate new orders/updates
  useEffect(() => {
    const timeInterval = setInterval(() => setNow(Date.now()), 5000); // Update time every 5s for "timeSince"
    const dataRefreshInterval = setInterval(() => {
      // Simulate new orders occasionally or status changes - for demo purposes
      // This part would be replaced by real-time data fetching (e.g., WebSockets)
      setOrders(currentOrders => {
        let updated = [...currentOrders];
        // Example: Randomly mark an item as prepared if not all are
        if (Math.random() < 0.1 && updated.length > 0) {
          const orderToUpdate = updated[Math.floor(Math.random() * updated.length)];
          const itemToUpdate = orderToUpdate.items.find((item:any) => !item.prepared);
          if (itemToUpdate) {
            itemToUpdate.prepared = true;
          }
        }
        return updated.sort((a,b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()); // Keep sorted by oldest
      });
    }, 30000); // Refresh data e.g. every 30s

    return () => {
      clearInterval(timeInterval);
      clearInterval(dataRefreshInterval);
    }
  }, []);

  // Mark item as prepared
  const handleMarkItemPrepared = (orderId: string, idx: number) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId
        ? { ...order, items: order.items.map((item: any, i: number) => i === idx ? { ...item, prepared: true } : item) }
        : order
    ));
  };
  // Mark whole order as ready
  const handleMarkOrderReady = (orderId: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId
        ? { ...order, items: order.items.map((item: any) => ({ ...item, prepared: true })), status: 'Ready' }
        : order
    ));
  };
  // Bump (remove) order - visually only, actual completion is elsewhere
  const handleBumpOrder = (orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
  };

  // Sort orders by placedAt time, oldest first
  const sortedOrders = useMemo(() => 
    orders.sort((a,b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()), 
  [orders]);

  return (
    <div className="p-3 sm:p-4 bg-base-100 min-h-[calc(100vh-4rem)]"> {/* Light KDS theme */}
      <h1 className="text-2xl sm:text-3xl font-bold text-neutral mb-6 text-center">Kitchen Display System</h1>
      
      {sortedOrders.length === 0 ? (
        <div className="col-span-full text-center text-gray-400 py-12">
          <CheckCircleIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <p className="text-xl font-semibold text-neutral">All caught up!</p>
          <p className="text-gray-500">No active orders in the kitchen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {sortedOrders.map(order => {
            const allItemsPrepared = order.items.every((item:any) => item.prepared);
            const cardBorderColor = order.status === 'Ready' || allItemsPrepared ? 'border-success' : 'border-primary';
            const timeElapsed = Math.floor((now - new Date(order.placedAt).getTime()) / (1000 * 60)); // in minutes
            let urgencyColor = 'bg-gray-200 text-gray-700'; // Default for light theme
            if (timeElapsed > 10) urgencyColor = 'bg-error text-white'; // Older than 10 mins
            else if (timeElapsed > 5) urgencyColor = 'bg-warning text-white'; // Older than 5 mins

            return (
              <div key={order.id} className={`bg-white rounded-xl shadow-lg flex flex-col border-t-8 ${cardBorderColor} text-neutral`}>
                {/* Header */}
                <div className="p-3 sm:p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-1.5">
                    <div className={`font-bold text-lg sm:text-xl ${allItemsPrepared ? 'text-success' : 'text-neutral'}`}>Table {order.table}</div>
                    <div className={`px-2 py-1 text-xs rounded-full font-semibold ${urgencyColor}`}>
                      <ClockIcon className="h-3 w-3 inline-block mr-1" />{timeSince(order.placedAt)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 font-mono">Order ID: {order.id}</div>
                </div>
                
                {/* Items List */}
                <ul className="p-3 sm:p-4 space-y-2 flex-grow overflow-y-auto max-h-60 sm:max-h-72">
                  {order.items.map((item: any, idx: number) => (
                    <li key={idx} className={`flex items-center justify-between p-2 rounded-md ${item.prepared ? 'bg-gray-100 opacity-70' : 'bg-gray-50' }`}>
                      <span className={`text-sm sm:text-base ${item.prepared ? 'line-through text-gray-400' : 'text-neutral'}`}>
                        <strong className="mr-1.5">{item.qty}x</strong>{item.name}
                      </span>
                      {!item.prepared && (
                        <button 
                          className="ml-2 px-2.5 py-1 bg-success hover:bg-emerald-600 text-white rounded-md text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          onClick={() => handleMarkItemPrepared(order.id, idx)}
                        >
                          Done
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                
                {/* Footer Actions */}
                <div className="p-3 sm:p-4 border-t border-gray-200 mt-auto">
                  {order.items.some((item: any) => !item.prepared) ? (
                    <button 
                      className="w-full bg-primary hover:bg-indigo-700 text-white font-semibold py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary"
                      onClick={() => handleMarkOrderReady(order.id)}
                    >
                      <CheckCircleIcon className="h-5 w-5" />Mark All Ready
                    </button>
                  ) : (
                    <button 
                      className="w-full bg-success hover:bg-emerald-600 text-white font-semibold py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-success"
                      onClick={() => handleBumpOrder(order.id)}
                    >
                      <XMarkIcon className="h-5 w-5" />Bump Order
                    </button>
                  )}
                </div>
              </div>
            )}
          )}
        </div>
      )}
    </div>
  );
};

export default KDSPage; 