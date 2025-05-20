import { PaymentMethod } from './session';

export type TableStatus = 'Available' | 'Occupied';
export type TableArea = 'Main Dining' | 'Patio' | 'Bar' | 'VIP Room' | 'Counter';

export interface Table {
  id: string;
  name: string;
  status: TableStatus;
  area: TableArea;
  capacity: number;
  currentOrderId?: string | null; // Optional: if occupied, might have an order ID
}

// Menu Management Types
export type MenuItemStatus = 'active' | 'inactive' | 'deleted';
export type MenuItemTag = 'spicy' | 'vegan' | 'vegetarian' | 'gluten-free' | 'bestseller' | 'new' | string;

// Inventory Management Types
export type InventoryUnit = 'piece' | 'gram' | 'kilogram' | 'liter' | 'milliliter' | 'ounce' | 'pound' | 'cup' | 'tablespoon' | 'teaspoon';

export interface InventoryItem {
  id: string;
  name: string;
  currentStock: number;
  unit: InventoryUnit;
  minStockLevel: number;
  maxStockLevel: number;
  costPerUnit: number;
  lastRestockDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryUsage {
  inventoryItemId: string;
  quantityUsedPerMenuItem: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  color?: string; // For visual identification
  createdAt: Date;
  updatedAt: Date;
}

export interface VariantOption {
  id: string;
  name: string;
  priceAdjustment: number; // Additional price for this variant
}

export interface VariantGroup {
  id: string;
  name: string; // e.g., "Size", "Crust Type"
  options: VariantOption[];
  required: boolean;
  maxSelections: number; // For multi-select variants
  minSelections: number; // Minimum required selections
}

export interface AddOnItem {
  id: string;
  name: string;
  price: number;
  available: boolean;
}

export interface AddOnGroup {
  id: string;
  name: string; // e.g., "Toppings", "Extra Cheese"
  items: AddOnItem[];
  multiSelect: boolean; // Whether multiple items can be selected
  required: boolean;
  maxSelections?: number; // For multi-select add-ons
  minSelections?: number; // Minimum required selections
}

export interface TaxGroup {
  id: string;
  name: string;
  rate: number; // Percentage
  description?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  costPrice?: number | null;
  category: string;
  imageUrl?: string | null;
  tags: MenuItemTag[];
  status: MenuItemStatus;
  variantGroups?: VariantGroup[] | null;
  addOnGroups?: AddOnGroup[] | null;
  taxGroup?: string | null;
  allergenInfo?: string | null;
  ingredientNotes?: string | null;
  hasInventoryTracking: boolean;
  inventoryUsage?: InventoryUsage[] | null;
  inventoryAvailable?: boolean;
  inventoryUnit?: InventoryUnit;
  startingInventoryQuantity?: number;
  decrementPerOrder?: number;
  preparationTime?: number;
  gstApplicable: boolean; // Whether GST is applicable to this item
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  isPartOfCombo?: boolean | null;
}

// Add other shared types here

export enum CouponType {
  FIXED_AMOUNT = 'Fixed Amount',
  PERCENTAGE = 'Percentage',
  BOGO = 'Buy One Get One Free',
  FREE_ITEM = 'Free Item',
  TIME_BASED = 'Time Based',
  OCCASION_BASED = 'Occasion Based',
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  type: CouponType;
  description?: string;
  value?: number; // For fixed amount or percentage
  percentage?: number; // For percentage discount
  bogoDetails?: {
    buyItemId: string; // ID of the item to buy
    getItemId: string; // ID of the item to get free
    buyQuantity: number;
    getQuantity: number;
  };
  freeItemDetails?: {
    itemId: string; // ID of the item to get free
    quantity: number;
  };
  applicableTo: 'all' | 'specific_items' | 'specific_categories' | 'specific_combos';
  applicableItemIds?: string[];
  applicableCategoryIds?: string[];
  applicableComboIds?: string[];
  minPurchaseAmount?: number;
  maxDiscountAmount?: number; // For percentage coupons
  validFrom: string; // ISO Date string
  validUntil: string; // ISO Date string
  occasion?: string; // e.g., 'Birthday', 'Anniversary'
  usageLimitPerUser?: number;
  totalUsageLimit?: number;
  timesUsed: number;
  isActive: boolean;
  assignedTo?: 'all_customers' | 'specific_customer';
  customerId?: string; // If assigned to a specific customer
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

export enum GiftCardStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  USED = 'Used',
  EXPIRED = 'Expired',
}

export interface GiftCard {
  id: string;
  code: string;
  initialBalance: number;
  currentBalance: number;
  issuedTo?: string; // Customer ID or name
  isUniversal: boolean;
  validFrom?: string; // ISO Date string
  expiresAt?: string; // ISO Date string
  isActive: boolean;
  redemptionHistory: {
    orderId: string;
    amountRedeemed: number;
    redeemedAt: string; // ISO Date string
  }[];
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
}

// Combo meal types
export interface ComboItem {
  id: string;
  menuItemId: string; // Reference to the original menu item
  quantity: number;
  isRequired: boolean; // Whether this item is required in the combo
  categoryChoiceId?: string; // If this is a "choose from category" item
}

export interface ComboCategory {
  id: string;
  name: string; // e.g., "Choose your main", "Choose your side"
  categoryId: string; // Reference to the menu category
  minSelections: number;
  maxSelections: number;
}

export interface ComboMeal {
  id: string;
  name: string;
  description?: string;
  price: number; // Special combo price
  imageUrl?: string;
  items: ComboItem[];
  categoryChoices?: ComboCategory[];
  displayPriority: number; // For sorting
  startTime?: string; // Optional time restriction (e.g., "11:00")
  endTime?: string; // Optional time restriction (e.g., "14:00")
  status: MenuItemStatus;
  tags: MenuItemTag[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // For soft delete
}

export interface OrderItem {
  id: string; // Unique ID for this specific order item instance
  menuItem: MenuItem;
  quantity: number;
  priceAtAddition: number; // Price of menuItem at the time it was added to order
  kotPrinted?: boolean; // Whether KOT has been printed for this item
  // Future: customizations, notes
}

export interface Order {
  id: string;
  tableId: string;
  orderItems: OrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'draft' | 'placed' | 'confirmed' | 'completed' | 'pending' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
  orderDate: Date;
  orderNote?: string;
  sessionId?: string | null; // ID of the session this order belongs to
  customerName?: string; // Name of the customer
  paymentMethod?: PaymentMethod; // Made optional, as it's not known when order is initially placed
  // Future: customerId, paymentDetails, discountsApplied
}

// New types for CRM

export type LoyaltyTransactionType = 'earned' | 'redeemed' | 'adjusted' | 'expired';

export interface LoyaltyTransaction {
  id: string;
  date: Date;
  type: LoyaltyTransactionType;
  points: number;
  description: string; // e.g., "Order #123", "Welcome bonus", "Manual adjustment by admin"
  relatedOrderId?: string;
}

export type CouponStatus = 'active' | 'used' | 'expired';

export interface CustomerCoupon {
  couponCode: string;
  description: string;
  status: CouponStatus;
  expiryDate?: Date;
  dateAdded: Date;
  dateUsed?: Date;
}

export interface CustomerGiftCard {
  giftCardCode: string;
  initialBalance: number;
  currentBalance: number;
  issueDate: Date;
  expiryDate?: Date;
  lastUsedDate?: Date;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  joinDate: Date;
  notes?: string;
  loyaltyPointsBalance: number;
  loyaltyPointsHistory: LoyaltyTransaction[];
  orderHistoryIds: string[]; // Array of Order IDs
  associatedCoupons: CustomerCoupon[];
  associatedGiftCards: CustomerGiftCard[];
  // Future: preferences, tags, communicationHistory
}

// A summary of an order for display in customer history
export interface OrderSummaryForCustomer {
    id: string;
    date: Date;
    itemCount: number;
    totalAmount: number;
    status: Order['status'];
} 