// frontend/src/utils/formatters.js
// Create this new file to handle all formatting based on company preferences

/**
 * Format date according to company preferences
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string from preferences (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
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
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`;
  }
};

/**
 * Format number according to company preferences
 * @param {number} num - Number to format
 * @param {string} format - Format type ('indian' or 'international')
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
export const formatNumber = (num, format = 'indian', decimals = 2) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  const rounded = Number(num).toFixed(decimals);
  const [integer, decimal] = rounded.split('.');
  
  let formattedInteger;
  
  if (format === 'indian') {
    // Indian format: 1,00,000.00
    formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    // For Indian lakhs system (last 3 digits, then groups of 2)
    if (integer.length > 3) {
      const lastThree = integer.slice(-3);
      const remaining = integer.slice(0, -3);
      formattedInteger = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
    } else {
      formattedInteger = integer;
    }
  } else {
    // International format: 100,000.00
    formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  return decimals > 0 ? `${formattedInteger}.${decimal}` : formattedInteger;
};

/**
 * Format currency according to company preferences
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (INR, USD, etc.)
 * @param {string} numberFormat - Number format type
 * @returns {string} Formatted currency
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
 * Format invoice date for display on invoice
 * @param {Date|string} date - Date to format
 * @param {string} format - Format preference
 * @returns {string} Formatted date with month name
 */
export const formatInvoiceDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = d.toLocaleString('en-GB', { month: 'short' });
  const year = d.getFullYear();
  
  // For invoices, we typically use: 24-Dec-2024 format
  return `${day}-${month}-${year}`;
};

/**
 * Remove trailing zeros from decimal numbers
 * @param {number} num - Number to clean
 * @returns {string} Number without trailing zeros
 */
export const cleanNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return parseFloat(num.toFixed(10)).toString();
};

/**
 * Round number to specified decimals
 * @param {number} num - Number to round
 * @param {number} decimals - Decimal places
 * @returns {number} Rounded number
 */
export const roundNumber = (num, decimals = 2) => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Get preference-based date format string
 * @param {object} preferences - Company preferences object
 * @returns {string} Date format string
 */
export const getDateFormat = (preferences) => {
  return preferences?.dateFormat || 'DD/MM/YYYY';
};

/**
 * Get preference-based number format string
 * @param {object} preferences - Company preferences object
 * @returns {string} Number format string
 */
export const getNumberFormat = (preferences) => {
  return preferences?.numberFormat || 'indian';
};

/**
 * Get currency symbol from preferences
 * @param {object} preferences - Company preferences object
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (preferences) => {
  const symbols = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };
  
  const currency = preferences?.defaultCurrency || 'INR';
  return symbols[currency] || currency;
};

/**
 * Apply formatting to invoice/challan data based on company settings
 * @param {object} data - Invoice or challan data
 * @param {object} companySettings - Company settings object
 * @returns {object} Data with formatted values
 */
export const applyCompanyFormatting = (data, companySettings) => {
  if (!companySettings || !companySettings.preferences) return data;
  
  const dateFormat = getDateFormat(companySettings.preferences);
  const numberFormat = getNumberFormat(companySettings.preferences);
  
  return {
    ...data,
    // Format dates
    formattedDate: formatDate(data.date, dateFormat),
    formattedInvoiceDate: formatInvoiceDate(data.date, dateFormat),
    
    // Format numbers
    formattedTotalMeters: formatNumber(data.totalMeters, numberFormat, 2),
    formattedRatePerMeter: formatNumber(data.ratePerMeter, numberFormat, 2),
    formattedSubtotal: formatNumber(data.subtotal, numberFormat, 2),
    formattedCgst: formatNumber(data.cgst, numberFormat, 2),
    formattedSgst: formatNumber(data.sgst, numberFormat, 2),
    formattedIgst: formatNumber(data.igst, numberFormat, 2),
    formattedRoundOff: formatNumber(data.roundOff, numberFormat, 2),
    formattedTotalAmount: formatNumber(data.totalAmount, numberFormat, 2),
    
    // Format currency
    formattedTotalWithCurrency: formatCurrency(
      data.totalAmount,
      companySettings.preferences.defaultCurrency,
      numberFormat
    )
  };
};

export default {
  formatDate,
  formatNumber,
  formatCurrency,
  formatInvoiceDate,
  cleanNumber,
  roundNumber,
  getDateFormat,
  getNumberFormat,
  getCurrencySymbol,
  applyCompanyFormatting
};