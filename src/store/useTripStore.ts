import { create } from 'zustand';
import { getDistanceKm } from '../utils/geo';

// Bu hızın altındaki anlar "bekleme/trafik" sayılır (m/s). ~9 km/s
const WAITING_SPEED_THRESHOLD = 2.5;

interface TripState {
  active: boolean;
  startLat: number | null;
  startLon: number | null;
  lastLat: number | null;
  lastLon: number | null;
  distanceKm: number;
  durationSec: number;
  waitingSec: number;
  currentSpeed: number; // m/s, bilinmiyorsa -1

  start: (lat: number, lon: number) => void;
  onPosition: (lat: number, lon: number, speed: number | null) => void;
  onTick: (seconds: number) => void;
  stop: () => void;
  reset: () => void;
}

export const useTripStore = create<TripState>((set, get) => ({
  active: false,
  startLat: null,
  startLon: null,
  lastLat: null,
  lastLon: null,
  distanceKm: 0,
  durationSec: 0,
  waitingSec: 0,
  currentSpeed: -1,

  start: (lat, lon) =>
    set({
      active: true,
      startLat: lat,
      startLon: lon,
      lastLat: lat,
      lastLon: lon,
      distanceKm: 0,
      durationSec: 0,
      waitingSec: 0,
      currentSpeed: -1,
    }),

  onPosition: (lat, lon, speed) => {
    const { lastLat, lastLon, distanceKm } = get();
    let added = 0;
    if (lastLat != null && lastLon != null) {
      added = getDistanceKm(lastLat, lastLon, lat, lon);
      // GPS gürültüsünü ele: 2m altı sıçramaları yok say
      if (added < 0.002) added = 0;
    }
    set({
      lastLat: lat,
      lastLon: lon,
      distanceKm: distanceKm + added,
      currentSpeed: speed ?? -1,
    });
  },

  onTick: (seconds) => {
    const { durationSec, waitingSec, currentSpeed, active } = get();
    if (!active) return;
    // Hız biliniyor ve eşik altındaysa bekleme say; hız bilinmiyorsa beklemeye ekleme
    const isWaiting = currentSpeed >= 0 && currentSpeed < WAITING_SPEED_THRESHOLD;
    set({
      durationSec: durationSec + seconds,
      waitingSec: waitingSec + (isWaiting ? seconds : 0),
    });
  },

  stop: () => set({ active: false }),

  reset: () =>
    set({
      active: false,
      startLat: null,
      startLon: null,
      lastLat: null,
      lastLon: null,
      distanceKm: 0,
      durationSec: 0,
      waitingSec: 0,
      currentSpeed: -1,
    }),
}));
