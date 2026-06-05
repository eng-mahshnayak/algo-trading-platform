// utils/lotSizeHelper.js

const LOT_SIZE_MAP = {
  'BANKNIFTY': 15,
  'NIFTY': 50,
  'FINNIFTY': 25,
  'MIDCPNIFTY': 75,
  'SENSEX': 10,
  'BANKEX': 15,
  'NIFTYIT': 40,
  'NIFTYPHARMA': 100,
  'NIFTYFMCG': 100,
  'NIFTYMETAL': 100,
  'NIFTYREALTY': 100,
  'NIFTYENERGY': 100,
  'NIFTYPSUBANK': 100,
  'NIFTYAUTO': 100,
  'NIFTYMEDIA': 100,
  'NIFTYFINANCE': 100,
  'NIFTYCONSUMER': 100,
  'NIFTYPRIVATEBANK': 100,
};

export const getLotSize = (symbol) => {
  if (!symbol) return 1;
  
  const upperSymbol = symbol.toUpperCase();
  
  for (const [key, value] of Object.entries(LOT_SIZE_MAP)) {
    if (upperSymbol.includes(key)) {
      return value;
    }
  }
  
  // Check for stock specific lot sizes (usually 1 for stocks)
  if (upperSymbol.match(/[A-Z]{3,5}\d{2,3}[A-Z]{0,3}/)) {
    return 1; // Stock options or futures
  }
  
  return 1; // Default lot size
};

export const calculateLots = (quantity, lotSize) => {
  if (!lotSize) return 0;
  return Math.floor(quantity / lotSize);
};

export const calculateQuantityFromLots = (lots, lotSize) => {
  if (!lotSize) return 0;
  return lots * lotSize;
};

export const validateLotSizeLimit = (quantity, symbol, maxLots = 20) => {
  const lotSize = getLotSize(symbol);
  const lots = calculateLots(quantity, lotSize);
  
  if (lots > maxLots) {
    return {
      valid: false,
      lots,
      maxLots,
      lotSize,
      suggestedQuantity: maxLots * lotSize,
      message: `Quantity exceeds max limit of ${maxLots} lots (${maxLots * lotSize} shares)`
    };
  }
  
  return {
    valid: true,
    lots,
    lotSize,
    quantity,
    message: `Valid quantity: ${lots} lots (${quantity} shares)`
  };
};

export const adjustQuantityToLotSize = (quantity, symbol) => {
  const lotSize = getLotSize(symbol);
  const lots = Math.floor(quantity / lotSize);
  return lots * lotSize;
};