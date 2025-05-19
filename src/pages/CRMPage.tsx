import React, { useState, useEffect, useMemo } from 'react';
import { Customer, OrderSummaryForCustomer } from '../types'; // Assuming types are in ../types
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  UserPlusIcon,
  ChevronDownIcon,
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  BuildingStorefrontIcon, // Example Icon
  GiftIcon, // Example Icon
  TicketIcon, // Example Icon
  UserCircleIcon // Example Icon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Data - Replace with API calls or state management later
const mockCustomersData: Customer[] = [
  {
    id: 'CUST001',
    name: 'Alice Wonderland',
    email: 'alice.wonder@example.com',
    phone: '555-0101',
    joinDate: new Date('2023-01-15'),
    loyaltyPointsBalance: 1250,
    orderHistoryIds: ['ORD001', 'ORD005'],
    associatedCoupons: [
      { couponCode: 'WELCOME10', description: '10% off first order', status: 'used', dateAdded: new Date('2023-01-15'), dateUsed: new Date('2023-01-16') },
      { couponCode: 'SPRINGSALE', description: '15% off seasonal items', status: 'active', dateAdded: new Date('2023-03-01'), expiryDate: new Date('2024-08-30') },
    ],
    associatedGiftCards: [],
    loyaltyPointsHistory: [
        {id: 'LP001', date: new Date('2023-01-16'), type: 'earned', points: 50, description: 'Order ORD001'},
        {id: 'LP002', date: new Date('2023-03-05'), type: 'earned', points: 75, description: 'Order ORD005'},
        {id: 'LP003', date: new Date('2023-04-10'), type: 'redeemed', points: -20, description: 'Redeemed for discount'},
    ],
    address: { street: '123 Main St', city: 'Anytown', state: 'CA', zipCode: '90210', country: 'USA' },
    notes: 'Prefers window seat. Allergic to peanuts.'
  },
  {
    id: 'CUST002',
    name: 'Bob The Builder',
    email: 'bob.builder@example.com',
    phone: '555-0102',
    joinDate: new Date('2023-02-20'),
    loyaltyPointsBalance: 800,
    orderHistoryIds: ['ORD002'],
    associatedCoupons: [],
    associatedGiftCards: [
      { giftCardCode: 'GIFT50BOB', initialBalance: 50, currentBalance: 25.50, issueDate: new Date('2023-02-20'), lastUsedDate: new Date('2023-05-01') }
    ],
    loyaltyPointsHistory: [
        {id: 'LP004', date: new Date('2023-02-22'), type: 'earned', points: 60, description: 'Order ORD002'},
    ],
  },
  // Add more mock customers...
];

const mockOrderSummariesData: OrderSummaryForCustomer[] = [
    {id: 'ORD001', date: new Date('2023-01-16'), itemCount: 3, totalAmount: 52.75, status: 'paid'},
    {id: 'ORD002', date: new Date('2023-02-22'), itemCount: 2, totalAmount: 35.00, status: 'paid'},
    {id: 'ORD005', date: new Date('2023-03-05'), itemCount: 5, totalAmount: 77.20, status: 'paid'},
    // Add more mock orders related to customers
];

const CRMPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomersData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // TODO: Add filtering logic
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchTerm))
    );
  }, [customers, searchTerm]);

  const handleViewCustomerDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedCustomer(null);
  };
  
  // Placeholder for fetching full order details if needed
  const getOrderSummariesForCustomer = (customer: Customer): OrderSummaryForCustomer[] => {
    return mockOrderSummariesData.filter(order => customer.orderHistoryIds.includes(order.id));
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col bg-gray-50">
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral flex items-center">
            <UserCircleIcon className="h-8 w-8 mr-3 text-primary" />
            Customer Management
          </h1>
          <button className="bg-primary text-white px-4 py-2.5 rounded-lg shadow hover:bg-indigo-700 transition flex items-center justify-center text-sm font-medium">
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Add New Customer
          </button>
        </div>
        <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search customers (name, email, phone)..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary shadow-sm text-sm sm:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          <button className="bg-white border border-gray-300 text-neutral px-4 py-2.5 rounded-lg shadow-sm hover:bg-gray-100 transition flex items-center justify-center text-sm font-medium">
            <FunnelIcon className="h-5 w-5 mr-2 text-gray-500" />
            Filters
            <ChevronDownIcon className="h-4 w-4 ml-1.5 text-gray-400" />
          </button>
        </div>
      </header>

      {/* Customer List / Grid */} 
      <div className="flex-grow overflow-y-auto">
        {filteredCustomers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredCustomers.map(customer => (
              <div key={customer.id} className="bg-white p-4 sm:p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                    <div className='min-w-0 pr-2'>
                        <h2 className="text-lg font-semibold text-primary truncate" title={customer.name}>{customer.name}</h2>
                        {customer.email && <p className="text-xs text-gray-500 truncate" title={customer.email}>{customer.email}</p>}
                        {customer.phone && <p className="text-xs text-gray-500 truncate" title={customer.phone}>{customer.phone}</p>}
                    </div>
                    <UserCircleIcon className="h-10 w-10 text-gray-300 flex-shrink-0" /> 
                </div> 

                <div className="space-y-1.5 text-xs text-neutral mb-3">
                    <p>Joined: <span className='font-medium'>{customer.joinDate.toLocaleDateString()}</span></p>
                    <p>Loyalty Points: <span className='font-medium text-accent'>{customer.loyaltyPointsBalance}</span></p>
                    <p>Total Orders: <span className='font-medium'>{customer.orderHistoryIds.length}</span></p>
                </div>
                
                <button 
                  onClick={() => handleViewCustomerDetails(customer)}
                  className="mt-auto w-full bg-indigo-50 text-primary font-medium py-2 px-3 rounded-lg hover:bg-indigo-100 transition text-sm flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                >
                  <EyeIcon className="h-4 w-4"/>
                  View Details
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 flex flex-col items-center justify-center h-full">
            <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-lg font-semibold text-neutral mb-1">No customers found.</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */} 
      <AnimatePresence>
        {isDetailModalOpen && selectedCustomer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleCloseModal} // Close on backdrop click
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              {/* Modal Header */} 
              <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h2 className="text-xl sm:text-2xl font-semibold text-neutral flex items-center">
                    <UserCircleIcon className='h-7 w-7 mr-2.5 text-primary'/> 
                    {selectedCustomer.name}
                </h2>
                <button 
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content (Scrollable) */} 
              <div className="p-5 sm:p-6 overflow-y-auto flex-grow space-y-6 custom-scrollbar">
                {/* Basic Info Section */}
                <section>
                  <h3 className="text-lg font-semibold text-neutral mb-3">Contact Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <p><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {selectedCustomer.phone || 'N/A'}</p>
                    <p><strong>Joined:</strong> {selectedCustomer.joinDate.toLocaleDateString()}</p>
                    {selectedCustomer.address && (
                        <p className="sm:col-span-2"><strong>Address:</strong> 
                            {selectedCustomer.address.street}, {selectedCustomer.address.city}, {selectedCustomer.address.state} {selectedCustomer.address.zipCode}, {selectedCustomer.address.country}
                        </p>
                    )}
                  </div>
                  {selectedCustomer.notes && (
                    <div className="mt-3">
                        <h4 className="text-sm font-semibold text-neutral mb-1">Notes:</h4>
                        <p className="text-sm bg-gray-50 p-3 rounded-md border border-gray-200 whitespace-pre-wrap">{selectedCustomer.notes}</p>
                    </div>
                  )}
                </section>

                {/* Order History Section */}
                <section>
                    <h3 className="text-lg font-semibold text-neutral mb-3 flex items-center">
                        <BuildingStorefrontIcon className="h-5 w-5 mr-2 text-gray-500"/> Order History
                    </h3>
                    {getOrderSummariesForCustomer(selectedCustomer).length > 0 ? (
                        <div className="space-y-2">
                            {getOrderSummariesForCustomer(selectedCustomer).map(order => (
                                <div key={order.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-primary">Order #{order.id}</p>
                                        <p className="text-xs text-gray-500">{order.date.toLocaleDateString()} &bull; {order.itemCount} items</p>
                                    </div>
                                    <div className='text-right'>
                                        <p className="font-semibold text-base">${order.totalAmount.toFixed(2)}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status}</span>
                                    </div>
                                     {/* Future: Button to view full order details */}
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-gray-500">No order history found.</p>}
                </section>

                {/* Loyalty Points Section */}
                 <section>
                    <h3 className="text-lg font-semibold text-neutral mb-3 flex items-center">
                        <GiftIcon className="h-5 w-5 mr-2 text-gray-500"/> Loyalty Program
                    </h3>
                    <p className="text-sm mb-2">Current Balance: <span className="font-bold text-xl text-accent">{selectedCustomer.loyaltyPointsBalance}</span> points</p>
                    {/* TODO: Display loyalty history transactions */}
                    <div className="text-sm text-gray-500 h-20 bg-gray-50 border border-dashed border-gray-300 rounded-md flex items-center justify-center">
                        Loyalty transaction history coming soon...
                    </div>
                </section>

                {/* Coupons & Gift Cards Section */}
                <section>
                    <h3 className="text-lg font-semibold text-neutral mb-3 flex items-center">
                        <TicketIcon className="h-5 w-5 mr-2 text-gray-500"/> Coupons & Gift Cards
                    </h3>
                    {/* TODO: Display coupons and gift cards */}
                     <div className="text-sm text-gray-500 h-20 bg-gray-50 border border-dashed border-gray-300 rounded-md flex items-center justify-center">
                        Assigned coupons & gift cards coming soon...
                    </div>
                </section>

              </div>
              
              {/* Modal Footer (Optional Actions) */}
              <div className="p-5 sm:p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3 sticky bottom-0 z-10">
                  <button 
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-sm font-medium text-neutral bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                      Close
                  </button>
                   <button 
                    className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-primary flex items-center gap-1.5"
                  >
                      <PencilIcon className='h-4 w-4'/>
                      Edit Customer (Soon)
                  </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CRMPage; 