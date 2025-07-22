// Helper functions for calculations and formatting

export const roundUpToMultiple = (num, multiple) => {
  if (multiple === 0) return num;
  return Math.ceil(num / multiple) * multiple;
};

export const formatNumber = (num, allowDecimals, decimalPlaces = 2) => {
  const number = parseFloat(num);
  if (isNaN(number)) return "0";
  
  if (allowDecimals) {
    // Limitar a máximo 2 decimales para evitar números muy largos
    const limitedNumber = Math.round(number * 100) / 100;
    return limitedNumber.toFixed(Math.min(decimalPlaces, 2));
  } else {
    return Math.round(number).toString();
  }
};

export const getDaysUntilExpiry = (expiryDateString) => {
  if (!expiryDateString) return null;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const expiryDate = new Date(expiryDateString);
  if (isNaN(expiryDate.getTime())) return null;
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};