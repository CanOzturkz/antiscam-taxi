// Istanbul taxi tariff (2025)
const TARIFF = {
  opening: 50,    // TL - açılış ücreti
  perKm: 45,      // TL/km - km başına ücret
  perMinute: 3,   // TL/dk - bekleme ücreti
  tolerance: 0.20, // %20 tolerans
};

export function estimateFare(distanceKm: number, durationMinutes: number): number {
  return TARIFF.opening + distanceKm * TARIFF.perKm + durationMinutes * TARIFF.perMinute;
}

export function isScam(estimated: number, asked: number): boolean {
  return asked > estimated * (1 + TARIFF.tolerance);
}

export function getOvercharge(estimated: number, asked: number): number {
  return Math.max(0, asked - estimated);
}
