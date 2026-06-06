import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCity } from '../config/tariffConfig';

export type Language = 'tr' | 'en' | 'ar' | 'ru';

interface SettingsState {
  cityId: string;
  taxiTypeId: string;
  language: Language;
  setCity: (cityId: string) => void;
  setTaxiType: (taxiTypeId: string) => void;
  setLanguage: (lang: Language) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      cityId: 'istanbul',
      taxiTypeId: 'sari',
      language: 'en',
      setCity: (cityId) => {
        // Şehir değişince o şehrin varsayılan taksi tipine geç
        const city = getCity(cityId);
        set({ cityId, taxiTypeId: city.defaultTaxiType });
      },
      setTaxiType: (taxiTypeId) => set({ taxiTypeId }),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'settings.v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
