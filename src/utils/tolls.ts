import type { Toll } from '../config/tariffConfig';

export interface TollDetection {
  /** Rotada tespit edilen geçişler */
  matched: Toll[];
  /** Toplam geçiş ücreti (TL) */
  total: number;
  /** İçlerinden en az biri yaklaşık (mesafe-bazlı) mı */
  approximate: boolean;
}

/**
 * Google Directions rota metninde (özet + adım talimatları + adresler)
 * config'teki geçişlerin anahtar kelimelerini arar ve eşleşenlerin ücretini toplar.
 * Directions API geçiş FİYATI vermediğinden, fiyatlar config'ten gelir.
 */
export function detectTolls(routeText: string, tolls: Toll[]): TollDetection {
  const text = (routeText || '').toLowerCase();
  const matched: Toll[] = [];
  for (const toll of tolls) {
    const kws = toll.keywords ?? [];
    if (kws.some((k) => k && text.includes(k.toLowerCase()))) {
      matched.push(toll);
    }
  }
  const total = matched.reduce((sum, t) => sum + (t.fee || 0), 0);
  const approximate = matched.some((t) => t.approximate === true);
  return { matched, total, approximate };
}

// Boğaziçi yaklaşık boylamı (Avrupa < bu < Asya), İstanbul enlem aralığında.
// 29.01: Taksim/Sultanahmet/Eminönü (Avrupa, <29.01) ile Kadıköy/Üsküdar (Asya, >29.01) ayrımı.
// Kıyıya çok yakın semtlerde (Ortaköy vb.) hata payı olabilir; kesin toll için Routes API gerekir.
const BOSPHORUS_LNG = 29.01;
const inIstanbulLat = (lat: number) => lat > 40.8 && lat < 41.4;

/**
 * İki nokta Boğaz'ın iki farklı yakasındaysa (kıta geçişi) true döner.
 * Google talimatları köprüyü adıyla yazmadığı için (sadece O-1/O-2 der),
 * köprü geçiş ücreti bu coğrafi testle tespit edilir.
 */
export function crossesBosphorus(aLat: number, aLng: number, bLat: number, bLng: number): boolean {
  if (!inIstanbulLat(aLat) || !inIstanbulLat(bLat)) return false;
  return aLng > BOSPHORUS_LNG !== bLng > BOSPHORUS_LNG;
}
