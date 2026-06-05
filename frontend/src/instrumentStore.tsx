import { create } from "zustand";


// First store - for main instrument data
interface InstrumentStoreState {
  dataRedish: any[] | null;
  lastFetchedAt: number | null;
  setDataRedish: (payload: any[]) => void;
  shouldFetchRedish: () => boolean;
}

export const useInstrumentStore = create<InstrumentStoreState>((set, get) => ({
  dataRedish: null,
  lastFetchedAt: null,

  setDataRedish: (payload: any[]) =>
    set({
      dataRedish: payload,
      lastFetchedAt: Date.now(),
    }),

  shouldFetchRedish: () => {
    const { lastFetchedAt } = get();
    if (!lastFetchedAt) return true;

    const THREE_HOURS = 3 * 60 * 60 * 1000; // Fixed: 3 hours, not 15 hours
    return Date.now() - lastFetchedAt > THREE_HOURS;
  },
}));

// Second store - for options symbols data (table data)
interface InstrumentStoreTwoState {
  optionsSymbolsData: any[] | null;
  lastFetchedAt: number | null;
  selectedIndex: string | null;
  selectedOptionType: string | null;
  setOptionsSymbolsData: (payload: any[], index: string, optionType: string) => void;
  shouldFetchOptionsSymbols: (index: string, optionType: string) => boolean;
  clearOptionsSymbolsData: () => void;
}

export const useInstrumentStoreTwo = create<InstrumentStoreTwoState>((set, get) => ({
  optionsSymbolsData: null,
  lastFetchedAt: null,
  selectedIndex: null,
  selectedOptionType: null,

  setOptionsSymbolsData: (payload: any[], index: string, optionType: string) =>
    set({
      optionsSymbolsData: payload,
      lastFetchedAt: Date.now(),
      selectedIndex: index,
      selectedOptionType: optionType,
    }),

  shouldFetchOptionsSymbols: (index: string, optionType: string) => {
    const { lastFetchedAt, selectedIndex, selectedOptionType } = get();
    
    // Agar koi data nahi hai to fetch karo
    if (!lastFetchedAt) return true;
    
    // Agar index ya option type change hua hai to fetch karo
    if (selectedIndex !== index || selectedOptionType !== optionType) return true;

    const FIFTEEN_MINUTES = 15 * 60 * 1000; // 15 minutes cache
    return Date.now() - lastFetchedAt > FIFTEEN_MINUTES;
  },

  clearOptionsSymbolsData: () =>
    set({
      optionsSymbolsData: null,
      lastFetchedAt: null,
      selectedIndex: null,
      selectedOptionType: null,
    }),
}));

// Optional: Third store for LTP data
interface LTPStoreState {
  ltpData: Record<string, { value: number; timestamp: number }>;
  setLTP: (symbol: string, ltp: number) => void;
  getLTP: (symbol: string) => number | null;
  shouldFetchLTP: (symbol: string) => boolean;
}

export const useLTPStore = create<LTPStoreState>((set, get) => ({
  ltpData: {},

  setLTP: (symbol: string, ltp: number) =>
    set((state) => ({
      ltpData: {
        ...state.ltpData,
        [symbol]: {
          value: ltp,
          timestamp: Date.now(),
        },
      },
    })),

  getLTP: (symbol: string) => {
    const data = get().ltpData[symbol];
    return data ? data.value : null;
  },

  shouldFetchLTP: (symbol: string) => {
    const data = get().ltpData[symbol];
    if (!data) return true;
    
    const FIVE_SECONDS = 5 * 1000; // 5 seconds cache for LTP
    return Date.now() - data.timestamp > FIVE_SECONDS;
  },
}));