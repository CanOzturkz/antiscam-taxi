import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FraudLevel } from '../utils/fraudEngine';

export interface TripRecord {
  id: string;
  date: number; // epoch ms
  distanceKm: number;
  durationMin: number;
  estimateMin: number;
  estimateMax: number;
  // Dolandırıcılık kontrolü yapıldıysa doldurulur
  currency?: string;
  askedDisplay?: string;
  askedTRY?: number;
  overchargeTRY?: number;
  level?: FraudLevel;
}

interface HistoryState {
  records: TripRecord[];
  addTrip: (rec: Omit<TripRecord, 'id' | 'date'>) => string;
  updateTrip: (id: string, patch: Partial<TripRecord>) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      records: [],
      addTrip: (rec) => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        const record: TripRecord = { id, date: Date.now(), ...rec };
        set((s) => ({ records: [record, ...s.records].slice(0, 100) }));
        return id;
      },
      updateTrip: (id, patch) =>
        set((s) => ({
          records: s.records.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      clear: () => set({ records: [] }),
    }),
    {
      name: 'tripHistory.v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
