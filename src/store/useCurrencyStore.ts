import { create } from 'zustand';
import { fetchRates, toTRY, type CurrencyCode } from '../utils/currency';

interface CurrencyState {
  rates: Record<string, number> | null;
  selectedCurrency: CurrencyCode;
  isLive: boolean;
  lastUpdated: number | null;
  loading: boolean;
  setCurrency: (c: CurrencyCode) => void;
  refresh: () => Promise<void>;
  convertToTRY: (amount: number, currency?: CurrencyCode) => number;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  rates: null,
  selectedCurrency: 'TRY',
  isLive: false,
  lastUpdated: null,
  loading: false,
  setCurrency: (selectedCurrency) => set({ selectedCurrency }),
  refresh: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const rates = await fetchRates();
      set({ rates, isLive: true, lastUpdated: Date.now(), loading: false });
    } catch {
      set({ loading: false });
    }
  },
  convertToTRY: (amount, currency) => {
    const cur = currency ?? get().selectedCurrency;
    return toTRY(amount, cur, get().rates ?? undefined);
  },
}));
