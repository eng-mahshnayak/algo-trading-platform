// services/livePriceStore.js

const livePrices = new Map();

export default  {
  setPrice: (symbol, price) => {
    livePrices.set(symbol, price);
  },

  getPrice: (symbolToken) => {
    return livePrices.get(symbolToken);
  },

  getAllPrices: () => {
    return livePrices;
  }
};