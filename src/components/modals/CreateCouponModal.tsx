import React, { useState, useEffect } from 'react';
import { XMarkIcon, TicketIcon } from '@heroicons/react/24/outline';
import { Coupon, CouponType, MenuItem, MenuCategory, ComboMeal } from '../../types';

interface CreateCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (coupon: Coupon) => void;
  existingCoupon?: Coupon | null;
  menuItems?: MenuItem[]; // Pass menu items for selection
  categories?: MenuCategory[]; // Pass categories for selection
  combos?: ComboMeal[]; // Pass combos for selection
}

const CreateCouponModal: React.FC<CreateCouponModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingCoupon,
  menuItems = [],
  categories = [],
  combos = [],
}) => {
  const [couponName, setCouponName] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [description, setDescription] = useState('');
  const [couponType, setCouponType] = useState<CouponType>(CouponType.PERCENTAGE);
  const [value, setValue] = useState<number | string>(''); // Can be amount or percentage
  const [minPurchase, setMinPurchase] = useState<number | string>('');
  const [maxDiscount, setMaxDiscount] = useState<number | string>('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [applicableTo, setApplicableTo] = useState<'all' | 'specific_items' | 'specific_categories' | 'specific_combos'>('all');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // BOGO States
  const [bogoBuyItemId, setBogoBuyItemId] = useState('');
  const [bogoGetItemId, setBogoGetItemId] = useState('');
  const [bogoBuyQuantity, setBogoBuyQuantity] = useState<number | string>(1);
  const [bogoGetQuantity, setBogoGetQuantity] = useState<number | string>(1);

  // Free Item States
  const [freeItemId, setFreeItemId] = useState('');
  const [freeItemQuantity, setFreeItemQuantity] = useState<number | string>(1);

  // Applicability States
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedComboIds, setSelectedComboIds] = useState<string[]>([]);

  // Other Coupon Details
  const [occasion, setOccasion] = useState('');
  const [usageLimitPerUser, setUsageLimitPerUser] = useState<number | string>('');
  const [totalUsageLimit, setTotalUsageLimit] = useState<number | string>('');
  const [assignedTo, setAssignedTo] = useState<'all_customers' | 'specific_customer'>('all_customers');
  const [customerId, setCustomerId] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (existingCoupon) {
      setCouponName(existingCoupon.name);
      setCouponCode(existingCoupon.code);
      setDescription(existingCoupon.description || '');
      setCouponType(existingCoupon.type);
      setValue(existingCoupon.value || existingCoupon.percentage || '');
      setMinPurchase(existingCoupon.minPurchaseAmount || '');
      setMaxDiscount(existingCoupon.maxDiscountAmount || '');
      setValidFrom(existingCoupon.validFrom.split('T')[0]); // Format for date input
      setValidUntil(existingCoupon.validUntil.split('T')[0]);
      setApplicableTo(existingCoupon.applicableTo);
      setSelectedItemIds(existingCoupon.applicableItemIds || []);
      
      if (existingCoupon.type === CouponType.BOGO && existingCoupon.bogoDetails) {
        setBogoBuyItemId(existingCoupon.bogoDetails.buyItemId);
        setBogoGetItemId(existingCoupon.bogoDetails.getItemId);
        setBogoBuyQuantity(existingCoupon.bogoDetails.buyQuantity);
        setBogoGetQuantity(existingCoupon.bogoDetails.getQuantity);
      }
      if (existingCoupon.type === CouponType.FREE_ITEM && existingCoupon.freeItemDetails) {
        setFreeItemId(existingCoupon.freeItemDetails.itemId);
        setFreeItemQuantity(existingCoupon.freeItemDetails.quantity);
      }
      setSelectedCategoryIds(existingCoupon.applicableCategoryIds || []);
      setSelectedComboIds(existingCoupon.applicableComboIds || []);
      setOccasion(existingCoupon.occasion || '');
      setUsageLimitPerUser(existingCoupon.usageLimitPerUser || '');
      setTotalUsageLimit(existingCoupon.totalUsageLimit || '');
      setAssignedTo(existingCoupon.assignedTo || 'all_customers');
      setCustomerId(existingCoupon.customerId || '');
      setIsActive(existingCoupon.isActive === undefined ? true : existingCoupon.isActive);
    } else {
      // Reset form for new coupon
      setCouponName('');
      setCouponCode('');
      setDescription('');
      setCouponType(CouponType.PERCENTAGE);
      setValue('');
      setMinPurchase('');
      setMaxDiscount('');
      setValidFrom('');
      setValidUntil('');
      setApplicableTo('all');
      setSelectedItemIds([]);
      setBogoBuyItemId('');
      setBogoGetItemId('');
      setBogoBuyQuantity(1);
      setBogoGetQuantity(1);
      setFreeItemId('');
      setFreeItemQuantity(1);
      setSelectedCategoryIds([]);
      setSelectedComboIds([]);
      setOccasion('');
      setUsageLimitPerUser('');
      setTotalUsageLimit('');
      setAssignedTo('all_customers');
      setCustomerId('');
      setIsActive(true);
    }
  }, [isOpen, existingCoupon]);

  const handleSubmit = () => {
    // Basic validation
    if (!couponName || !couponCode || !couponType || !validFrom || !validUntil) {
      alert('Please fill all required fields.');
      return;
    }

    const newCoupon: Coupon = {
      id: existingCoupon?.id || new Date().toISOString(), // Simple ID generation
      name: couponName,
      code: couponCode,
      type: couponType,
      description,
      value: couponType === CouponType.FIXED_AMOUNT ? Number(value) : undefined,
      percentage: couponType === CouponType.PERCENTAGE ? Number(value) : undefined,
      bogoDetails: couponType === CouponType.BOGO && bogoBuyItemId && bogoGetItemId ? {
        buyItemId: bogoBuyItemId,
        getItemId: bogoGetItemId,
        buyQuantity: Number(bogoBuyQuantity),
        getQuantity: Number(bogoGetQuantity),
      } : undefined,
      freeItemDetails: couponType === CouponType.FREE_ITEM && freeItemId ? {
        itemId: freeItemId,
        quantity: Number(freeItemQuantity),
      } : undefined,
      applicableTo,
      applicableItemIds: applicableTo === 'specific_items' ? selectedItemIds : undefined,
      applicableCategoryIds: applicableTo === 'specific_categories' ? selectedCategoryIds : undefined,
      applicableComboIds: applicableTo === 'specific_combos' ? selectedComboIds : undefined,
      minPurchaseAmount: Number(minPurchase) || undefined,
      maxDiscountAmount: (couponType === CouponType.PERCENTAGE && maxDiscount) ? Number(maxDiscount) : undefined,
      validFrom: new Date(validFrom).toISOString(),
      validUntil: new Date(validUntil).toISOString(),
      occasion: occasion || undefined,
      usageLimitPerUser: Number(usageLimitPerUser) || undefined,
      totalUsageLimit: Number(totalUsageLimit) || undefined,
      timesUsed: existingCoupon?.timesUsed || 0,
      isActive: isActive,
      assignedTo: assignedTo,
      customerId: assignedTo === 'specific_customer' ? customerId : undefined,
      createdAt: existingCoupon?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(newCoupon);
    onClose(); // Close modal after save
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
            <TicketIcon className="h-8 w-8 mr-2 text-purple-600" />
            {existingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-7 w-7" />
          </button>
        </div>

        {/* Form Fields */}
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="couponName" className="block text-sm font-medium text-gray-700">Coupon Name</label>
              <input type="text" id="couponName" value={couponName} onChange={(e) => setCouponName(e.target.value)} required
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="couponCode" className="block text-sm font-medium text-gray-700">Coupon Code</label>
              <input type="text" id="couponCode" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} required
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="couponType" className="block text-sm font-medium text-gray-700">Coupon Type</label>
              <select id="couponType" value={couponType} onChange={(e) => setCouponType(e.target.value as CouponType)} required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                {Object.values(CouponType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {(couponType === CouponType.FIXED_AMOUNT || couponType === CouponType.PERCENTAGE) && (
              <div>
                <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                  {couponType === CouponType.FIXED_AMOUNT ? 'Discount Amount' : 'Percentage (%)'}
                </label>
                <input type="number" id="value" value={value} onChange={(e) => setValue(e.target.value)} required min="0"
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
              </div>
            )}
          </div>

          {/* BOGO Fields */}
          {couponType === CouponType.BOGO && (
            <div className="p-3 my-2 border border-dashed border-purple-300 rounded-md">
              <h4 className="text-sm font-medium text-purple-700 mb-2">BOGO Details (Buy X Get Y Free)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bogoBuyItemId" className="block text-xs font-medium text-gray-600">Buy Item ID</label>
                  <input type="text" id="bogoBuyItemId" value={bogoBuyItemId} onChange={(e) => setBogoBuyItemId(e.target.value)} required
                         className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="bogoBuyQuantity" className="block text-xs font-medium text-gray-600">Buy Quantity</label>
                  <input type="number" id="bogoBuyQuantity" value={bogoBuyQuantity} onChange={(e) => setBogoBuyQuantity(e.target.value)} required min="1"
                         className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="bogoGetItemId" className="block text-xs font-medium text-gray-600">Get Item ID (Free)</label>
                  <input type="text" id="bogoGetItemId" value={bogoGetItemId} onChange={(e) => setBogoGetItemId(e.target.value)} required
                         className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="bogoGetQuantity" className="block text-xs font-medium text-gray-600">Get Quantity (Free)</label>
                  <input type="number" id="bogoGetQuantity" value={bogoGetQuantity} onChange={(e) => setBogoGetQuantity(e.target.value)} required min="1"
                         className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Free Item Fields */}
          {couponType === CouponType.FREE_ITEM && (
             <div className="p-3 my-2 border border-dashed border-green-300 rounded-md">
              <h4 className="text-sm font-medium text-green-700 mb-2">Free Item Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="freeItemId" className="block text-xs font-medium text-gray-600">Item ID to be Free</label>
                  <input type="text" id="freeItemId" value={freeItemId} onChange={(e) => setFreeItemId(e.target.value)} required
                         className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
                </div>
                <div>
                  <label htmlFor="freeItemQuantity" className="block text-xs font-medium text-gray-600">Quantity of Free Item</label>
                  <input type="number" id="freeItemQuantity" value={freeItemQuantity} onChange={(e) => setFreeItemQuantity(e.target.value)} required min="1"
                         className="mt-1 block w-full px-2 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm" />
                </div>
              </div>
            </div>
          )}
          
          {/* TODO: Add fields for Time-based, Occasion-based conditions */}

          {/* Applicability Section */}
          <div className="my-4 p-3 border border-gray-200 rounded-md">
            <label htmlFor="applicableTo" className="block text-sm font-medium text-gray-700 mb-1">Applicable To</label>
            <select id="applicableTo" value={applicableTo} onChange={(e) => setApplicableTo(e.target.value as any)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
              <option value="all">All Products</option>
              <option value="specific_items">Specific Menu Items</option>
              <option value="specific_categories">Specific Categories</option>
              <option value="specific_combos">Specific Combos</option>
            </select>

            {applicableTo === 'specific_items' && (
              <div className="mt-2">
                <label htmlFor="specificItemIds" className="block text-xs font-medium text-gray-600">Menu Item IDs (comma-separated)</label>
                {/* Replace with a proper multi-select component later */}
                <textarea id="specificItemIds" value={selectedItemIds.join(', ')}
                          onChange={(e) => setSelectedItemIds(e.target.value.split(',').map(id => id.trim()).filter(id => id))}
                          rows={2}
                          placeholder="item_id1, item_id2"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
              </div>
            )}
            {applicableTo === 'specific_categories' && (
              <div className="mt-2">
                <label htmlFor="specificCategoryIds" className="block text-xs font-medium text-gray-600">Category IDs (comma-separated)</label>
                <textarea id="specificCategoryIds" value={selectedCategoryIds.join(', ')}
                          onChange={(e) => setSelectedCategoryIds(e.target.value.split(',').map(id => id.trim()).filter(id => id))}
                          rows={2}
                          placeholder="cat_id1, cat_id2"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
              </div>
            )}
            {applicableTo === 'specific_combos' && (
              <div className="mt-2">
                <label htmlFor="specificComboIds" className="block text-xs font-medium text-gray-600">Combo IDs (comma-separated)</label>
                <textarea id="specificComboIds" value={selectedComboIds.join(', ')}
                          onChange={(e) => setSelectedComboIds(e.target.value.split(',').map(id => id.trim()).filter(id => id))}
                          rows={2}
                          placeholder="combo_id1, combo_id2"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
              </div>
            )}
          </div>

          {/* Min Purchase and Max Discount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="minPurchase" className="block text-sm font-medium text-gray-700">Minimum Purchase Amount (Optional)</label>
              <input type="number" id="minPurchase" value={minPurchase} onChange={(e) => setMinPurchase(e.target.value)} min="0"
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
            </div>
            {couponType === CouponType.PERCENTAGE && (
              <div>
                <label htmlFor="maxDiscount" className="block text-sm font-medium text-gray-700">Max Discount Amount (Optional)</label>
                <input type="number" id="maxDiscount" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} min="0"
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
              </div>
            )}
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="usageLimitPerUser" className="block text-sm font-medium text-gray-700">Usage Limit Per User (Optional)</label>
              <input type="number" id="usageLimitPerUser" value={usageLimitPerUser} onChange={(e) => setUsageLimitPerUser(e.target.value)} min="1"
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="totalUsageLimit" className="block text-sm font-medium text-gray-700">Total Usage Limit (Optional)</label>
              <input type="number" id="totalUsageLimit" value={totalUsageLimit} onChange={(e) => setTotalUsageLimit(e.target.value)} min="1"
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
            </div>
          </div>

          {/* Assigned To and Occasion */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Assigned To</label>
              <select id="assignedTo" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value as any)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm">
                <option value="all_customers">All Customers</option>
                <option value="specific_customer">Specific Customer</option>
              </select>
            </div>
            {assignedTo === 'specific_customer' && (
              <div>
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">Customer ID</label>
                <input type="text" id="customerId" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required
                       className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="occasion" className="block text-sm font-medium text-gray-700">Occasion (e.g., Birthday, Anniversary - Optional)</label>
            <input type="text" id="occasion" value={occasion} onChange={(e) => setOccasion(e.target.value)}
                   className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
          </div>

          {/* Is Active Toggle */}
          <div className="flex items-center justify-between mt-4 p-3 border border-gray-200 rounded-md">
            <span className="text-sm font-medium text-gray-700">Coupon Active</span>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`${isActive ? 'bg-purple-600' : 'bg-gray-300'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
            >
              <span className={`${isActive ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="validFrom" className="block text-sm font-medium text-gray-700">Valid From</label>
              <input type="date" id="validFrom" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} required
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">Valid Until</label>
              <input type="date" id="validUntil" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required
                     className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 flex justify-end space-x-3">
            <button type="button" onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
              Cancel
            </button>
            <button type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
              {existingCoupon ? 'Save Changes' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCouponModal;
