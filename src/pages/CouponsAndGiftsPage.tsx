import React, { useState } from 'react';
import { PlusCircleIcon, TicketIcon, GiftIcon, EyeIcon, CheckCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Coupon, GiftCard, CouponType, MenuItem, MenuCategory, ComboMeal } from '../types'; // Assuming types for items, categories, combos
import CreateCouponModal from '../components/modals/CreateCouponModal'; // Import the modal
import CreateGiftCardModal from '../components/modals/CreateGiftCardModal';
import GiftCardList from '../components/GiftCardList'; // Import the new component
import RedemptionConfirmationModal from '../components/modals/RedemptionConfirmationModal'; // Import the new modal

// Mock data for display - replace with actual data fetching

const CouponsAndGiftsPage: React.FC = () => {
  const [couponsData, setCouponsData] = useState<Coupon[]>([
    {
      id: 'COUP001',
      code: 'SUMMER20',
      name: 'Summer Sale 20% Off',
      type: CouponType.PERCENTAGE,
      description: 'Get 20% off on all items.',
      percentage: 20,
      applicableTo: 'all',
      validFrom: '2024-06-01T00:00:00Z',
      validUntil: '2024-08-31T23:59:59Z',
      timesUsed: 0,
      isActive: true,
      assignedTo: 'all_customers',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'COUP002',
      code: 'SAVE10',
      name: 'Save $10 on $50+ Purchase',
      type: CouponType.FIXED_AMOUNT,
      value: 10,
      description: 'Get $10 off when you spend $50 or more.',
      applicableTo: 'all',
      minPurchaseAmount: 50,
      validFrom: '2024-01-01T00:00:00Z',
      validUntil: '2024-12-31T23:59:59Z',
      timesUsed: 5,
      totalUsageLimit: 100,
      isActive: true,
      assignedTo: 'all_customers',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'COUP003',
      code: 'EXPIREDWINTER',
      name: 'Winter Special (Expired)',
      type: CouponType.FIXED_AMOUNT,
      value: 5,
      description: 'An old winter special.',
      applicableTo: 'all',
      validFrom: '2023-12-01T00:00:00Z',
      validUntil: '2024-02-28T23:59:59Z',
      timesUsed: 10,
      isActive: false, // Inactive
      assignedTo: 'all_customers',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
  const [giftCardsData, setGiftCardsData] = useState<GiftCard[]>([
    {
      id: 'GC001',
      code: 'GIFT50XYZ',
      initialBalance: 50,
      currentBalance: 25.50,
      isUniversal: true,
      isActive: true,
      redemptionHistory: [
        {
          orderId: 'ORDER123',
          amountRedeemed: 10,
          redeemedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
        },
        {
          orderId: 'ORDER124',
          amountRedeemed: 14.50,
          redeemedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'GC002',
      code: 'GIFTZEROABC',
      initialBalance: 20,
      currentBalance: 0,
      isUniversal: false,
      issuedTo: 'cust_001', // Alice Wonderland
      isActive: true, // Still active, but zero balance
      redemptionHistory: [
        {
          orderId: 'ORDER200',
          amountRedeemed: 20,
          redeemedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'GC003',
      code: 'GIFTINACTIVE',
      initialBalance: 100,
      currentBalance: 100,
      isUniversal: true,
      isActive: false, // Inactive
      redemptionHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
  const [activeTab, setActiveTab] = useState<'create' | 'available' | 'redeemed'>('create');
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isGiftCardModalOpen, setIsGiftCardModalOpen] = useState(false);
  const [editingGiftCard, setEditingGiftCard] = useState<GiftCard | null>(null);

  // State for redemption flow
  const [redemptionCodeInput, setRedemptionCodeInput] = useState('');
  const [itemToRedeem, setItemToRedeem] = useState<Coupon | GiftCard | null>(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [selectedCustomerForRedemption, setSelectedCustomerForRedemption] = useState<string>(''); // Or Customer object

  // Mock customer data - replace with actual data fetching later
  const mockCustomers = [
    { id: 'cust_001', name: 'Alice Wonderland' },
    { id: 'cust_002', name: 'Bob The Builder' },
    { id: 'cust_003', name: 'Charlie Chaplin' },
  ];

  const handleEditGiftCard = (giftCard: GiftCard) => {
    setEditingGiftCard(giftCard);
    // Assuming 'isGiftCardModalOpen' and 'setIsGiftCardModalOpen' are used for the CreateGiftCardModal
    // If using 'showCreateGiftCardModal', adjust accordingly
    setIsGiftCardModalOpen(true); 
  };

  // Handler to toggle gift card active status
  const handleToggleGiftCardActive = (giftCardToToggle: GiftCard) => {
    setGiftCardsData(prevGiftCards => 
      prevGiftCards.map(gc => 
        gc.id === giftCardToToggle.id ? { ...gc, isActive: !gc.isActive, updatedAt: new Date().toISOString() } : gc
      )
    );
  };

  const handleSaveCoupon = (coupon: Coupon) => {
    console.log('Saving coupon:', coupon);
    // Here you would typically call an API to save the coupon
    // For now, let's add/update it in a local state or log it
    if (editingCoupon) {
      setCouponsData(couponsData.map(c => c.id === coupon.id ? coupon : c));
    } else {
      setCouponsData([...couponsData, { ...coupon, id: `coup_${new Date().getTime()}` }]);
    }
    setIsCouponModalOpen(false);
    setEditingCoupon(null);
  };

  const handleSaveGiftCard = (giftCard: GiftCard) => {
    console.log('Saving gift card:', giftCard);
    if (editingGiftCard) {
      setGiftCardsData(giftCardsData.map(gc => gc.id === giftCard.id ? giftCard : gc));
    } else {
      setGiftCardsData([...giftCardsData, { ...giftCard, id: `gc_${new Date().getTime()}` }]);
    }
    setIsGiftCardModalOpen(false);
    setEditingGiftCard(null);
  };

  const handleFindCode = () => {
    console.log('Attempting to find code:', redemptionCodeInput);
    // TODO: Search in couponsData and giftCardsData
    // TODO: Validate (active, not expired, usage limits, balance)
    // TODO: If found and valid, setItemToRedeem and setShowRedemptionModal(true)
    // TODO: Else, show error message
    const foundCoupon = couponsData.find(c => c.code === redemptionCodeInput && c.isActive);
    if (foundCoupon) {
      // Basic validation, more can be added (dates, usage limits)
      setItemToRedeem(foundCoupon);
      setShowRedemptionModal(true);
      return;
    }

    const foundGiftCard = giftCardsData.find(gc => gc.code === redemptionCodeInput && gc.isActive && gc.currentBalance > 0);
    if (foundGiftCard) {
      // Basic validation
      setItemToRedeem(foundGiftCard);
      setShowRedemptionModal(true);
      return;
    }

    // If no valid item found
    alert('Coupon or Gift Card code not found, is invalid, or has no balance.'); // Replace with better UX later
    setRedemptionCodeInput('');
  };

  const renderRedemptionSection = () => (
    <div className="mb-8 p-6 bg-white rounded-xl shadow-lg">
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Redeem Coupon or Gift Card</h3>
      <div className="flex items-stretch space-x-2">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input 
            type="text"
            value={redemptionCodeInput}
            onChange={(e) => setRedemptionCodeInput(e.target.value.toUpperCase())}
            placeholder="Enter Code (e.g., SUMMER20, GIFT50XYZ)"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm placeholder-gray-400"
          />
        </div>
        <button
          onClick={handleFindCode}
          disabled={!redemptionCodeInput.trim()}
          className="px-6 py-2.5 bg-purple-600 text-white font-semibold rounded-md shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 ease-in-out flex items-center justify-center"
        >
          <TicketIcon className="h-5 w-5 mr-2 opacity-90" />
          Find & Redeem
        </button>
      </div>
    </div>
  );

  const handleConfirmRedemption = (customerId: string, redeemedItem: Coupon | GiftCard) => {
    console.log(`Redeeming item ${redeemedItem.code} for customer ${customerId}`);

    if ('type' in redeemedItem) { // It's a Coupon
      setCouponsData(prevCoupons => 
        prevCoupons.map(c => 
          c.id === redeemedItem.id ? { 
            ...c, 
            timesUsed: (c.timesUsed || 0) + 1, 
            // Potentially update customer specific usage if applicable
            updatedAt: new Date().toISOString() 
          } : c
        )
      );
      alert(`Coupon ${redeemedItem.code} redeemed successfully!`);
    } else { // It's a GiftCard
      const redeemAmount = Math.min(redeemedItem.currentBalance, 10); // Example: redeem $10 or remaining balance
      if (redeemAmount <= 0) {
        alert('Gift card has no balance to redeem.');
        setShowRedemptionModal(false);
        setItemToRedeem(null);
        setRedemptionCodeInput('');
        return;
      }
      setGiftCardsData(prevGiftCards => 
        prevGiftCards.map(gc => 
          gc.id === redeemedItem.id ? { 
            ...gc, 
            currentBalance: gc.currentBalance - redeemAmount, 
            redemptionHistory: [
              ...(gc.redemptionHistory || []),
              {
                orderId: `order_${new Date().getTime()}`, // Placeholder orderId
                amountRedeemed: redeemAmount,
                redeemedAt: new Date().toISOString(),
              }
            ],
            updatedAt: new Date().toISOString(),
            // If balance becomes 0, optionally set isActive to false
            isActive: (gc.currentBalance - redeemAmount > 0) ? gc.isActive : false,
          } : gc
        )
      );
      alert(`Gift Card ${redeemedItem.code} redeemed by $${redeemAmount.toFixed(2)}! New Balance: $${(redeemedItem.currentBalance - redeemAmount).toFixed(2)}`);
    }

    setShowRedemptionModal(false);
    setItemToRedeem(null);
    setRedemptionCodeInput('');
    setSelectedCustomerForRedemption('');
  };

  const renderCreateSection = () => (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Create Coupons & Gift Cards</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setIsCouponModalOpen(true)}
          className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-lg shadow-lg hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
        >
          <TicketIcon className="h-12 w-12 mb-3" />
          <span className="text-xl font-medium">Create New Coupon</span>
          <p className="text-sm text-indigo-200 mt-1">Offer discounts and special deals</p>
        </button>
        <button
          onClick={() => setIsGiftCardModalOpen(true)}
          className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-lg shadow-lg hover:from-green-600 hover:to-teal-700 transition-all duration-300 transform hover:scale-105"
        >
          <GiftIcon className="h-12 w-12 mb-3" />
          <span className="text-xl font-medium">Create New Gift Card</span>
          <p className="text-sm text-teal-200 mt-1">Offer store credit to customers</p>
        </button>
      </div>

      {/* Modals for creating coupon and gift card will be added here */}
      <CreateCouponModal 
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        onSave={handleSaveCoupon}
        // Pass menuItems, categories, combos if needed for selection
      />
      <CreateGiftCardModal 
        isOpen={isGiftCardModalOpen}
        onClose={() => setIsGiftCardModalOpen(false)}
        onSave={handleSaveGiftCard}
        existingGiftCard={editingGiftCard} // Ensure existingGiftCard is passed
      />
      {itemToRedeem && (
        <RedemptionConfirmationModal 
          isOpen={showRedemptionModal}
          onClose={() => {
            setShowRedemptionModal(false);
            setItemToRedeem(null);
            setRedemptionCodeInput('');
          }}
          onConfirm={handleConfirmRedemption}
          item={itemToRedeem}
          customers={mockCustomers}
        />
      )}
    </div>
  );

  const renderAvailableSection = () => (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Available Coupons & Gift Cards</h2>
      {/* Listing for available coupons and gift cards */}
      <p className="text-gray-500">Display available coupons and gift cards here...</p>
      {/* Display existing gift cards */}
      <GiftCardList 
        giftCards={giftCardsData} 
        onEdit={handleEditGiftCard} // Added missing onEdit prop
        onToggleActive={handleToggleGiftCardActive} 
      />
    </div>
  );

  const renderRedeemedSection = () => (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">Redeemed Coupons & Gift Cards</h2>
      {/* Listing for redeemed coupons and gift cards */}
      <p className="text-gray-500">Display redeemed coupons and gift cards here...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-red-500">
          Coupons & Gifts Management
        </h1>
      </header>

      {renderRedemptionSection()} {/* Moved redemption section here */}

      <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
        <nav className="flex border-b border-gray-200">
          {[
            { id: 'create', label: 'Create New', icon: PlusCircleIcon },
            { id: 'available', label: 'Available', icon: EyeIcon },
            { id: 'redeemed', label: 'Redeemed', icon: CheckCircleIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'create' | 'available' | 'redeemed')}
              className={`flex-1 py-4 px-6 text-center font-medium border-b-4 transition-colors duration-300 
                ${activeTab === tab.id 
                  ? 'border-purple-500 text-purple-600' 
                  : 'border-transparent text-gray-500 hover:text-purple-500 hover:border-purple-300'}
              `}
            >
              <tab.icon className={`h-6 w-6 mx-auto mb-1 ${activeTab === tab.id ? 'text-purple-500' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          ))}
        </nav>

        <main>
          {activeTab === 'create' && renderCreateSection()}
          {activeTab === 'available' && renderAvailableSection()}
          {activeTab === 'redeemed' && renderRedeemedSection()}
        </main>
      </div>
      
      {/* {showCreateGiftCardModal && <CreateGiftCardModal onClose={() => setShowCreateGiftCardModal(false)} />} */}
    </div>
  );
};

export default CouponsAndGiftsPage;
