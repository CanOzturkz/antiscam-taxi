/**
 * Canlı döviz çevirme. Anahtar gerektirmeyen ücretsiz API (open.er-api.com) kullanır.
 * Ağ yoksa son bilinen kurlara, o da yoksa gömülü fallback kurlara düşer.
 *
 * Tüm kurlar "1 birim yabancı para = X TRY" şeklinde tutulur.
 */

export type CurrencyCode = 'TRY' | 'USD' | 'EUR' | 'GBP' | 'RUB' | 'SAR' | 'AED';

export const SUPPORTED_CURRENCIES: CurrencyCode[] = [
  'TRY', 'USD', 'EUR', 'GBP', 'RUB', 'SAR', 'AED',
];

export const CURRENCY_META: Record<CurrencyCode, { symbol: string; label: string }> = {
  TRY: { symbol: '₺', label: 'Türk Lirası' },
  USD: { symbol: '$', label: 'US Dollar' },
  EUR: { symbol: '€', label: 'Euro' },
  GBP: { symbol: '£', label: 'British Pound' },
  RUB: { symbol: '₽', label: 'Russian Ruble' },
  SAR: { symbol: '﷼', label: 'Saudi Riyal' },
  AED: { symbol: 'د.إ', label: 'UAE Dirham' },
};

// Gömülü fallback: yaklaşık kurlar (1 birim = X TRY). Ağ yoksa son çare.
// NOT: Bunlar yaklaşık değerlerdir; canlı API çağrısı her zaman önceliklidir.
const FALLBACK_RATES_TO_TRY: Record<CurrencyCode, number> = {
  TRY: 1,
  USD: 41,
  EUR: 45,
  GBP: 53,
  RUB: 0.45,
  SAR: 11,
  AED: 11.2,
};

interface RateCache {
  ratesToTry: Record<string, number>;
  fetchedAt: number;
}

let cache: RateCache | null = null;
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 saat

/**
 * USD bazlı kurları çekip TRY'ye normalize eder.
 * open.er-api.com/v6/latest/USD -> { rates: { TRY: 41, EUR: 0.9, ... } }
 */
export async function fetchRates(): Promise<Record<string, number>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.ratesToTry;
  }
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error('rate fetch failed');
    const data = await res.json();
    const usdRates: Record<string, number> = data.rates;
    const usdToTry = usdRates.TRY;
    if (!usdToTry) throw new Error('no TRY rate');

    // her para birimi için "1 birim = X TRY"
    const ratesToTry: Record<string, number> = { TRY: 1 };
    for (const code of SUPPORTED_CURRENCIES) {
      if (code === 'TRY') continue;
      const usdToCode = usdRates[code];
      if (usdToCode) {
        // 1 code = (1/usdToCode) USD = (usdToTry/usdToCode) TRY
        ratesToTry[code] = usdToTry / usdToCode;
      } else {
        ratesToTry[code] = FALLBACK_RATES_TO_TRY[code];
      }
    }
    cache = { ratesToTry, fetchedAt: Date.now() };
    return ratesToTry;
  } catch {
    // ağ yoksa cache varsa onu, yoksa fallback'i ver
    return cache?.ratesToTry ?? { ...FALLBACK_RATES_TO_TRY };
  }
}

/** Verilen tutarı TRY'ye çevirir. rates verilmezse fallback kullanır. */
export function toTRY(amount: number, currency: CurrencyCode, rates?: Record<string, number>): number {
  const r = rates ?? cache?.ratesToTry ?? FALLBACK_RATES_TO_TRY;
  const rate = r[currency] ?? FALLBACK_RATES_TO_TRY[currency] ?? 1;
  return amount * rate;
}

/** Kur kaynağı canlı mı yoksa fallback mı kullanıldı bilgisini verir. */
export function isLiveRates(): boolean {
  return cache !== null;
}
