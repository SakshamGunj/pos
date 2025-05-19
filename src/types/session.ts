// Session types for POS system

export interface Session {
  id: string;
  startTime: Date | string;
  endTime?: Date | string;
  isActive: boolean;
  cashTotal: number;
  upiTotal: number;
  bankTotal: number;
  totalRevenue: number;
  transactions: Transaction[];
  userId: string; // The user who started the session
  notes?: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  timestamp: Date | string;
  status: 'completed' | 'refunded' | 'failed';
}

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK';
