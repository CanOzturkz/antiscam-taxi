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
