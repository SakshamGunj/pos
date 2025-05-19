import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MenuItem, OrderItem as OrderItemType, MenuCategory } from '../types';
import {
  PlusCircleIcon, MinusCircleIcon, TrashIcon, ShoppingCartIcon, 
  ChevronLeftIcon, MagnifyingGlassIcon, XMarkIcon, CheckCircleIcon, CreditCardIcon, PrinterIcon
} from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import MobileOrderSummaryToggle from '../components/MobileOrderSummaryToggle';
import { AnimatePresence, motion } from 'framer-motion';
import { getActiveMenuItems, getCategories } from '../firebase/services/menuService';

type OrderStatus = 'draft' | 'placed' | 'confirmed' | 'completed' | 'cancelled';

const mockCustomers = [
  { id: 'C1', name: 'Alice Johnson', phone: '555-1234', email: 'alice@example.com' },
  { id: 'C2', name: 'Bob Smith', phone: '555-5678', email: 'bob@example.com' },
  { id: 'C3', name: 'Charlie Lee', phone: '555-8765', email: 'charlie@example.com' },
  { id: 'C4', name: 'David Wang', phone: '555-4321', email: 'david@example.com' },
  { id: 'C5', name: 'Eve Brown', phone: '555-8765', email: 'eve@example.com' },
];

const OrderPage: React.FC = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  
  // Menu state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Order state
  const [orderItems, setOrderItems] = useState<OrderItemType[]>([]);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('draft');
  const [orderNote, setOrderNote] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
  
  // Load menu items and categories from Firebase
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [menuItemsData, categoriesData] = await Promise.all([
          getActiveMenuItems(),
          getCategories()
        ]);
        
        setMenuItems(menuItemsData);
        setCategories(categoriesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching menu data:', err);
        setError('Failed to load menu items. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter menu items based on search and category
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, searchTerm, selectedCategory]);
  
  // Handle adding item to order
  const handleAddItemToOrder = useCallback((menuItem: MenuItem) => {
    setOrderItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.menuItem.id === menuItem.id);
      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += 1;
        return updatedItems;
      } else {
        return [...prevItems, { id: uuidv4(), menuItem, quantity: 1, priceAtAddition: menuItem.price }];
      }
    });
    if (orderStatus === 'placed' || orderStatus === 'confirmed') {
      setOrderStatus('draft'); // Revert to draft if order is modified after being placed or confirmed
    }
  }, [orderStatus]);
  
  // Handle removing item from order
  const handleRemoveItemFromOrder = useCallback((itemId: string) => {
    setOrderItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === itemId);
      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        if (updatedItems[existingItemIndex].quantity > 1) {
          updatedItems[existingItemIndex].quantity -= 1;
          return updatedItems;
        } else {
          return prevItems.filter(item => item.id !== itemId);
        }
      }
      return prevItems;
    });
  }, []);
  
  // Handle deleting item from order
  const handleDeleteItemFromOrder = useCallback((itemId: string) => {
    setOrderItems(prevItems => prevItems.filter(item => item.id !== itemId));
  }, []);
  
  // Calculate order totals
  const orderTotal = useMemo(() => {
    return orderItems.reduce((total, item) => {
      return total + (item.priceAtAddition * item.quantity);
    }, 0);
  }, [orderItems]);
  
  // Handle order placement
  const handlePlaceOrder = useCallback(() => {
    if (orderItems.length === 0) {
      alert('Please add items to the order before placing it.');
      return;
    }
    
    setOrderStatus('placed');
    // Here you would typically send the order to the server
    // For now, we'll just update the local state
    
    alert('Order placed successfully!');
  }, [orderItems]);
  
  // Handle order confirmation
  const handleConfirmOrder = useCallback(() => {
    setOrderStatus('confirmed');
    // Here you would typically update the order status on the server
    
    alert('Order confirmed!');
  }, []);
  
  // Handle order completion
  const handleCompleteOrder = useCallback(() => {
    setOrderStatus('completed');
    // Here you would typically update the order status on the server
    
    alert('Order completed!');
    // Navigate back to table selection
    navigate('/tables');
  }, [navigate]);
  
  // Handle order cancellation
  const handleCancelOrder = useCallback(() => {
    setOrderStatus('cancelled');
    // Here you would typically update the order status on the server
    
    setShowConfirmCancelModal(false);
    alert('Order cancelled!');
    // Navigate back to table selection
    navigate('/tables');
  }, [navigate]);
  
  // Handle payment
  const handlePayment = useCallback(() => {
    setShowPaymentModal(false);
    handleCompleteOrder();
  }, [handleCompleteOrder]);
  
  // Render category buttons
  const renderCategoryButtons = () => {
    const categoryButtons = [
      <button
        key="all"
        className={`px-4 py-2 text-sm rounded-full ${selectedCategory === 'All' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}`}
        onClick={() => setSelectedCategory('All')}
      >
        All
      </button>
    ];
    
    // Add buttons for each category from Firebase
    categories.forEach(category => {
      categoryButtons.push(
        <button
          key={category.id}
          className={`px-4 py-2 text-sm rounded-full ${selectedCategory === category.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}`}
          onClick={() => setSelectedCategory(category.id)}
        >
          {category.name}
        </button>
      );
    });
    
    return categoryButtons;
  };
  
  // Render menu items
  const renderMenuItems = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      );
    }
    
    if (filteredMenuItems.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">No menu items found. Try a different search or category.</div>
        </div>
      );
    }
    
    return filteredMenuItems.map(item => (
      <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between">
            <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
            <span className="text-lg font-medium text-primary">${item.price.toFixed(2)}</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{item.description}</p>
          <div className="mt-2 flex items-center">
            {item.tags && item.tags.map(tag => (
              <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-1">
                {tag}
              </span>
            ))}
          </div>
          <button
            className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            onClick={() => handleAddItemToOrder(item)}
          >
            <PlusCircleIcon className="-ml-0.5 mr-1 h-4 w-4" aria-hidden="true" />
            Add to Order
          </button>
        </div>
      </div>
    ));
  };
  
  // Render order items
  const renderOrderItems = () => {
    if (orderItems.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <ShoppingCartIcon className="h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">Your order is empty</p>
        </div>
      );
    }
    
    return orderItems.map(item => (
      <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-200">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">{item.menuItem.name}</h4>
          <p className="text-sm text-gray-500">${item.priceAtAddition.toFixed(2)} each</p>
        </div>
        <div className="flex items-center">
          <button
            className="p-1 rounded-full text-gray-400 hover:text-gray-500"
            onClick={() => handleRemoveItemFromOrder(item.id)}
          >
            <MinusCircleIcon className="h-5 w-5" />
          </button>
          <span className="mx-2 text-gray-700">{item.quantity}</span>
          <button
            className="p-1 rounded-full text-gray-400 hover:text-gray-500"
            onClick={() => handleAddItemToOrder(item.menuItem)}
          >
            <PlusCircleIcon className="h-5 w-5" />
          </button>
          <button
            className="ml-2 p-1 rounded-full text-gray-400 hover:text-red-500"
            onClick={() => handleDeleteItemFromOrder(item.id)}
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    ));
  };
  
  // Render order summary
  const renderOrderSummary = () => {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
          <p className="text-sm text-gray-500">Table {tableId}</p>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
          {renderOrderItems()}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between">
            <span className="text-base font-medium text-gray-900">Total</span>
            <span className="text-base font-medium text-gray-900">${orderTotal.toFixed(2)}</span>
          </div>
          
          <div className="mt-4">
            <label htmlFor="orderNote" className="block text-sm font-medium text-gray-700">Order Notes</label>
            <textarea
              id="orderNote"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              rows={2}
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              placeholder="Special instructions or notes..."
            />
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2">
            {orderStatus === 'draft' && (
              <button
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                onClick={handlePlaceOrder}
              >
                Place Order
              </button>
            )}
            
            {orderStatus === 'placed' && (
              <button
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                onClick={handleConfirmOrder}
              >
                <CheckCircleIcon className="-ml-1 mr-2 h-5 w-5" />
                Confirm
              </button>
            )}
            
            {(orderStatus === 'confirmed' || orderStatus === 'placed') && (
              <button
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setShowPaymentModal(true)}
              >
                <CreditCardIcon className="-ml-1 mr-2 h-5 w-5" />
                Payment
              </button>
            )}
            
            {orderStatus !== 'completed' && orderStatus !== 'cancelled' && (
              <button
                className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                onClick={() => setShowConfirmCancelModal(true)}
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/tables" className="mr-4 text-gray-500 hover:text-gray-700">
              <ChevronLeftIcon className="h-6 w-6" />
            </Link>
            <h1 className="text-xl font-semibold text-gray-900">Table {tableId} - Order</h1>
          </div>
          <MobileOrderSummaryToggle 
            showOrderSummary={showOrderSummary} 
            setShowOrderSummary={setShowOrderSummary} 
            itemCount={orderItems.length} 
            total={orderTotal}
          />
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Menu section */}
          <div className="lg:col-span-2">
            {/* Search and filters */}
            <div className="mb-6">
              <div className="relative rounded-md shadow-sm mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-500"
                      onClick={() => setSearchTerm('')}
                    >
                      <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {renderCategoryButtons()}
              </div>
            </div>
            
            {/* Menu items grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {renderMenuItems()}
            </div>
          </div>
          
          {/* Order summary section - desktop */}
          <div className="hidden lg:block">
            {renderOrderSummary()}
          </div>
          
          {/* Order summary section - mobile */}
          <AnimatePresence>
            {showOrderSummary && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-40 lg:hidden"
              >
                <div className="absolute inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowOrderSummary(false)}></div>
                <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-xl max-h-[80vh] overflow-y-auto">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium text-gray-900">Your Order</h2>
                      <button
                        className="text-gray-400 hover:text-gray-500"
                        onClick={() => setShowOrderSummary(false)}
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>
                    {renderOrderSummary()}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Payment Modal */}
          {showPaymentModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowPaymentModal(false)}></div>
                </div>
                
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Process Payment</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Total amount: ${orderTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handlePayment}
                    >
                      Complete Payment
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm"
                      onClick={() => setShowPaymentModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Confirm Cancel Modal */}
          {showConfirmCancelModal && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                  <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowConfirmCancelModal(false)}></div>
                </div>
                
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Cancel Order</h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Are you sure you want to cancel this order? This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                      onClick={handleCancelOrder}
                    >
                      Cancel Order
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:w-auto sm:text-sm"
                      onClick={() => setShowConfirmCancelModal(false)}
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrderPage;
