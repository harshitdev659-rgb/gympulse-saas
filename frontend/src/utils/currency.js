// Centralized currency formatting utility for GymPulse SaaS.
// Defaults all financial representations to Indian Rupee (₹ / INR) with en-IN number formatting.

export const getCurrencySymbol = (currency = 'INR') => {
  switch ((currency || 'INR').toUpperCase()) {
    case 'INR':
      return '₹';
    case 'USD':
      return '$';
    case 'EUR':
      return '€';
    case 'GBP':
      return '£';
    case 'CAD':
    case 'AUD':
      return '$';
    default:
      return '₹';
  }
};

export const formatCurrency = (amount, currency = 'INR', showDecimals = false) => {
  const num = Number(amount) || 0;
  const symbol = getCurrencySymbol(currency);
  
  // Format with standard Indian Numbering system (Lakhs / Crores grouping)
  const isINR = (currency || 'INR').toUpperCase() === 'INR';
  const locale = isINR ? 'en-IN' : 'en-US';

  const formatted = num.toLocaleString(locale, {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 2
  });

  return `${symbol}${formatted}`;
};
