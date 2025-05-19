import React from 'react';
import { PaperAirplaneIcon, CheckCircleIcon } from '@heroicons/react/24/outline'; // Example icons

// Mock Data for Kitchen Orders - Replace with actual data later
const mockKitchenOrders = [
  {
    id: 'KO1',
    table: 'T2',
    orderNumber: 'ORD10021',
    timestamp: Date.now() - 5 * 60 * 1000, // 5 minutes ago
    items: [
      { name: 'Espresso', quantity: 2, notes: 'Extra hot' },
      { name: 'Croissant', quantity: 1, notes: 'Toasted' },
      { name: 'Club Sandwich', quantity: 1, notes: 'No mayo' },
    ],
    status: 'Pending' as 'Pending' | 'Preparing' | 'Ready',
  },
  {
    id: 'KO2',
    table: 'P3',
    orderNumber: 'ORD10022',
    timestamp: Date.now() - 2 * 60 * 1000, // 2 minutes ago
    items: [
      { name: 'Latte', quantity: 1, notes: '' },
      { name: 'Muffin', quantity: 2, notes: 'Blueberry' },
    ],
    status: 'Preparing' as 'Pending' | 'Preparing' | 'Ready',
  },
  {
    id: 'KO3',
    table: 'B3',
    orderNumber: 'ORD10023',
    timestamp: Date.now() - 10 * 60 * 1000, // 10 minutes ago
    items: [
      { name: 'Caesar Salad', quantity: 1, notes: 'Extra dressing on side' },
      { name: 'Sparkling Water', quantity: 1, notes: '' },
    ],
    status: 'Pending' as 'Pending' | 'Preparing' | 'Ready',
  },
];

const formatTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const seconds = Math.round((now - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return `${hours}h ago`;
};

const KitchenDisplayPage: React.FC = () => {
  // Add state for orders, e.g., using useState and useEffect to fetch
  const [orders, setOrders] = React.useState(mockKitchenOrders);

  const handleMarkAsCompleted = (orderId: string) => {
    // Placeholder: In a real app, this would update the backend and then refresh state
    setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    console.log(`Order ${orderId} marked as completed`);
  };

  const getStatusColor = (status: string) => {
    if (status === 'Pending') return 'bg-red-100 text-red-700';
    if (status === 'Preparing') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-neutral mb-8">Kitchen Display</h1>
      {orders.length === 0 ? (
         <div className="text-center py-20">
            <CheckCircleIcon className="h-24 w-24 text-emerald-400 mx-auto mb-6" />
            <p className="text-2xl font-semibold text-neutral mb-2">All Caught Up!</p>
            <p className="text-gray-500">No pending orders in the kitchen.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {orders.sort((a,b) => a.timestamp - b.timestamp).map((order) => (
            <div key={order.id} className="bg-white p-5 rounded-xl shadow-xl border border-gray-200 flex flex-col">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
                <h2 className="text-xl font-bold text-primary">{order.table} <span className="text-sm font-normal text-gray-500">- #{order.orderNumber.slice(-4)}</span></h2>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>{order.status}</span>
              </div>
              <div className="space-y-2.5 mb-4 flex-grow min-h-[100px]">
                {order.items.map((item, index) => (
                  <div key={index} className="pb-1.5">
                    <div className="flex justify-between items-start">
                        <p className="font-semibold text-neutral text-sm">{item.name} <span className="text-gray-600">(x{item.quantity})</span></p>
                    </div>
                    {item.notes && <p className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded inline-block mt-0.5">Note: {item.notes}</p>}
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-3 mt-auto">
                <p className="text-xs text-gray-500 mb-3 text-right">Received: {formatTimeAgo(order.timestamp)}</p>
                <button 
                    onClick={() => handleMarkAsCompleted(order.id)}
                    className="w-full bg-accent hover:bg-emerald-600 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-150 ease-in-out flex items-center justify-center text-sm"
                >
                  <PaperAirplaneIcon className="h-4 w-4 mr-2" /> Mark as Ready
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KitchenDisplayPage; 