import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCardIcon, ClockIcon, EyeIcon } from '@heroicons/react/24/outline';
import { getConfirmedUnpaidOrders, updateOrder } from '../firebase/services/orderService';
import { Order } from '../types';

// Status colors for different order statuses
const statusColors: Record<string, string> = {
  'confirmed': 'bg-warning text-white',
  'paid': 'bg-success text-white',
  'placed': 'bg-info text-white',
  'draft': 'bg-gray-200 text-gray-700',
};

const OrdersDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fetch confirmed but unpaid orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedOrders = await getConfirmedUnpaidOrders();
        setOrders(fetchedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
    
    // Set up a refresh interval (every 30 seconds)
    const intervalId = setInterval(fetchOrders, 30000);
    
    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  // Handle viewing order details
  const handleViewOrder = (orderId: string) => {
    navigate(`/order/${orders.find(o => o.id === orderId)?.tableId}`);
  };

  // Handle payment process
  const handleProcessPayment = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      navigate(`/order/${order.tableId}`);
    }
  };

  // Format date for display
  const formatDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString();
  };

  // Calculate time elapsed since order was placed
  const getTimeElapsed = (date: Date | string) => {
    const orderDate = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours} hr${hours !== 1 ? 's' : ''} ${mins} min${mins !== 1 ? 's' : ''}`;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
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

  if (orders.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-1">No Pending Orders</h3>
        <p className="text-gray-500">All orders have been processed</p>
      </div>
    );
  }

  // Return null to hide the pending orders dashboard
  return null;
};

export default OrdersDashboard;
