// frontend/src/utils/formatters.js
// Create this new file to handle formatting based on company preferences

/**
 * Format number according to Indian or International format
 * @param {number} num - The number to format
 * @param {string} format - 'indian' or 'international'
 * @param {number} decimals - Number of decimal places (default 2)
 * @returns {string} Formatted number
 */
export const formatNumber = (num, format = 'indian', decimals = 2) => {
  if (num === null || num === undefined) return '0.00';
  
  const number = parseFloat(num);
  if (isNaN(number)) return '0.00';
  
  const fixed = number.toFixed(decimals);
  const parts = fixed.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];
  
  let formatted;
  
  if (format === 'indian') {
    // Indian format: 1,00,000.00
    formatted = integerPart.replace(/\B(?=(\d{2})+(?=\d{3}))/g, ',');
    formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    // Simpler approach:
    const lastThree = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    if (otherNumbers !== '') {
      formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
    } else {
      formatted = lastThree;
    }
  } else {
    // International format: 100,000.00
    formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  return decimals > 0 ? `${formatted}.${decimalPart}` : formatted;
};

/**
 * Format date according to preference
 * @param {Date|string} date - The date to format
 * @param {string} format - 'DD/MM/YYYY', 'MM/DD/YYYY', or 'YYYY-MM-DD'
 * @returns {string} Formatted date
 */
export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  switch (format) {
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${day}/${month}/${year}`;
  }
};

/**
 * Format currency with symbol
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code ('INR', 'USD', etc.)
 * @param {string} numberFormat - 'indian' or 'international'
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'INR', numberFormat = 'indian') => {
  const symbols = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };
  
  const symbol = symbols[currency] || currency;
  const formatted = formatNumber(amount, numberFormat, 2);
  
  return `${symbol}${formatted}`;
};

/**
 * Get currency symbol
 * @param {string} currency - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currency = 'INR') => {
  const symbols = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };
  
  return symbols[currency] || currency;
};

/**
 * Parse date input to ISO format
 * @param {string} dateStr - Date string in any format
 * @param {string} inputFormat - Expected input format
 * @returns {string} ISO date string
 */
export const parseDate = (dateStr, inputFormat = 'DD/MM/YYYY') => {
  if (!dateStr) return '';
  
  let day, month, year;
  const parts = dateStr.split(/[/-]/);
  
  switch (inputFormat) {
    case 'DD/MM/YYYY':
      [day, month, year] = parts;
      break;
    case 'MM/DD/YYYY':
      [month, day, year] = parts;
      break;
    case 'YYYY-MM-DD':
      [year, month, day] = parts;
      break;
    default:
      [day, month, year] = parts;
  }
  
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

/**
 * Format date for display with month name
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date like "24 Dec 2024"
 */
export const formatDateWithMonth = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  
  return `${day} ${month} ${year}`;
};