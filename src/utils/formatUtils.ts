// Global formatting utilities

// Currency symbol - Indian Rupee (₹)
export const CURRENCY_SYMBOL = '₹';

// Format price/amount to Indian Rupees
export const formatCurrency = (amount: number): string => {
  return `${CURRENCY_SYMBOL}${amount.toFixed(2)}`;
};

// Format date for display
export const formatDate = (date: Date | string): string => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString('en-IN');
};

// Calculate time elapsed since a given date
export const getTimeElapsed = (date: Date | string): string => {
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
