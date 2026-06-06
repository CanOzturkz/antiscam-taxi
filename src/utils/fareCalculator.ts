import { getTaxiType, type TaxiType } from '../config/tariffConfig';

export interface FareInput {
  distanceKm: number;
  /** Toplam yolculuk süresi (dk) */
  durationMin: number;
  /** Trafikte/dururken geçen süre (dk). Bilinmiyorsa undefined bırakılır, tahmin edilir. */
  waitingMin?: number;
  /** Köprü/otoyol/tünel geçiş ücretleri toplamı (TL) */
  tollsTotal?: number;
  cityId?: string;
  taxiTypeId?: string;
}

export interface FareEstimate {
  /** En düşük olası tutar — serbest akış, minimum bekleme (TL) */
  min: number;
  /** En yüksek olası tutar — yoğun trafik, tam zaman ücreti (TL) */
  max: number;
  /** Tek nokta tahmin (orta değer) (TL) */
  point: number;
  currency: string;
  breakdown: {
    opening: number;
    distanceCharge: number;
    waitingChargeMin: number;
    waitingChargeMax: number;
    tolls: number;
    minimumFare: number;
  };
}

/**
 * Türk taksimetresi mantığı:
 * - Araç hareket halindeyken km üzerinden, dururken/yavaşken zaman üzerinden ücret işler.
 * - Toplam ücret hiçbir zaman "indi-bindi" (minimum) ücretin altına inmez.
 * Tek bir hız verisi olmadığından Min-Max aralık üretiriz:
 *   min  = açılış + (km * perKm) + (minimum bekleme * perMinuteWaiting) + geçişler
 *   max  = açılış + (km * perKm) + (tüm süre bekleme sayılırsa) + geçişler
 */
export function estimateFareRange(input: FareInput): FareEstimate {
  const t: TaxiType = getTaxiType(input.cityId, input.taxiTypeId);
  const distanceCharge = input.distanceKm * t.perKm;
  const tolls = input.tollsTotal ?? 0;

  // Bekleme süresi tahmini:
  // - waitingMin verilmişse onu kullan (GPS'ten ölçülen gerçek bekleme)
  // - verilmemişse: min senaryoda bekleme yok, max senaryoda sürenin %60'ı trafik kabul
  const waitMinScenario = input.waitingMin ?? 0;
  const waitMaxScenario = input.waitingMin ?? input.durationMin * 0.6;

  const waitingChargeMin = waitMinScenario * t.perMinuteWaiting;
  const waitingChargeMax = waitMaxScenario * t.perMinuteWaiting;

  let min = t.opening + distanceCharge + waitingChargeMin + tolls;
  let max = t.opening + distanceCharge + waitingChargeMax + tolls;

  // İndi-bindi (minimum ücret) kuralı
  min = Math.max(min, t.minimumFare);
  max = Math.max(max, t.minimumFare);

  const point = (min + max) / 2;

  return {
    min: round(min),
    max: round(max),
    point: round(point),
    currency: 'TRY',
    breakdown: {
      opening: t.opening,
      distanceCharge: round(distanceCharge),
      waitingChargeMin: round(waitingChargeMin),
      waitingChargeMax: round(waitingChargeMax),
      tolls,
      minimumFare: t.minimumFare,
    },
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// ---------------------------------------------------------------------------
// Geriye dönük uyumluluk (mevcut ekranlar bozulmasın diye)
// ---------------------------------------------------------------------------

/** @deprecated estimateFareRange kullanın. Nokta tahmin döner. */
export function estimateFare(distanceKm: number, durationMinutes: number): number {
  return estimateFareRange({ distanceKm, durationMin: durationMinutes }).point;
}

/** @deprecated fraudEngine.assessFraud kullanın. */
export function isScam(estimated: number, asked: number): boolean {
  return asked > estimated * 1.2;
}

/** @deprecated fraudEngine.assessFraud kullanın. */
export function getOvercharge(estimated: number, asked: number): number {
  return Math.max(0, asked - estimated);
}
