import { create } from 'zustand';
import { estimateFareRange, type FareEstimate, type FareInput } from '../utils/fareCalculator';

interface FareState {
  estimate: FareEstimate | null;
  /** Bu yolculuğun geçmiş kaydının id'si (End Trip'te oluşturulur, CHECK'te güncellenir) */
  historyId: string | null;
  recompute: (input: FareInput) => FareEstimate;
  setEstimate: (e: FareEstimate) => void;
  setHistoryId: (id: string | null) => void;
  clear: () => void;
}

export const useFareStore = create<FareState>((set) => ({
  estimate: null,
  historyId: null,
  recompute: (input) => {
    const estimate = estimateFareRange(input);
    set({ estimate });
    return estimate;
  },
  setEstimate: (estimate) => set({ estimate }),
  setHistoryId: (historyId) => set({ historyId }),
  clear: () => set({ estimate: null, historyId: null }),
}));
