import { create } from 'zustand';
import { estimateFareRange, type FareEstimate, type FareInput } from '../utils/fareCalculator';

interface FareState {
  estimate: FareEstimate | null;
  recompute: (input: FareInput) => FareEstimate;
  setEstimate: (e: FareEstimate) => void;
  clear: () => void;
}

export const useFareStore = create<FareState>((set) => ({
  estimate: null,
  recompute: (input) => {
    const estimate = estimateFareRange(input);
    set({ estimate });
    return estimate;
  },
  setEstimate: (estimate) => set({ estimate }),
  clear: () => set({ estimate: null }),
}));
