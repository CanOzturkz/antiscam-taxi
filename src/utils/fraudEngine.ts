import type { FareEstimate } from './fareCalculator';
import { toTRY, type CurrencyCode } from './currency';

export type FraudLevel = 'SAFE' | 'WARNING' | 'CRITICAL';

export interface FraudAssessment {
  level: FraudLevel;
  /** Talep edilen tutarın TRY karşılığı */
  askedTRY: number;
  /** Yasal tavan (estimate.max) üzerine binen fazla tutar (TRY) */
  overchargeTRY: number;
  /** Talep / yasal-tavan oranı (1.0 = tam tavan, 2.0 = iki katı) */
  ratio: number;
  /** Yüzde olarak fazlalık (ör. 150 = %150 fazla) */
  overchargePct: number;
  estimate: FareEstimate;
}

export interface FraudInput {
  estimate: FareEstimate;
  askedAmount: number;
  askedCurrency: CurrencyCode;
  /** Canlı kurlar (currency.fetchRates'ten). Verilmezse fallback kullanılır. */
  rates?: Record<string, number>;
}

// Eşikler — yasal tavanın (estimate.max) katları
const TOLERANCE = 1.10;       // %10 oka kadar normal (yuvarlama, küçük geçişler)
const CRITICAL_RATIO = 1.5;   // tavanın 1.5 katı ve üzeri = kritik dolandırıcılık

/**
 * Dolandırıcılık Tespit Motoru.
 * Talep edilen tutarı (yerel ya da yabancı para) TRY'ye çevirir,
 * yasal taksimetre tavanıyla (estimate.max) karşılaştırır ve seviye belirler.
 *
 *   SAFE      : askedTRY <= max * 1.10
 *   WARNING   : max * 1.10 < askedTRY < max * 1.5
 *   CRITICAL  : askedTRY >= max * 1.5
 */
export function assessFraud(input: FraudInput): FraudAssessment {
  const { estimate, askedAmount, askedCurrency, rates } = input;

  const askedTRY = toTRY(askedAmount, askedCurrency, rates);
  const ceiling = estimate.max;
  const ratio = ceiling > 0 ? askedTRY / ceiling : 0;
  const overchargeTRY = Math.max(0, askedTRY - ceiling);
  const overchargePct = ceiling > 0 ? Math.max(0, (askedTRY / ceiling - 1) * 100) : 0;

  let level: FraudLevel;
  if (ratio <= TOLERANCE) {
    level = 'SAFE';
  } else if (ratio < CRITICAL_RATIO) {
    level = 'WARNING';
  } else {
    level = 'CRITICAL';
  }

  return {
    level,
    askedTRY: Math.round(askedTRY * 100) / 100,
    overchargeTRY: Math.round(overchargeTRY * 100) / 100,
    ratio: Math.round(ratio * 100) / 100,
    overchargePct: Math.round(overchargePct),
    estimate,
  };
}

/** Resmi iletişim kanalları — Scam Alert ekranındaki aksiyon butonları için. */
export const OFFICIAL_CONTACTS = {
  ibbWhiteDesk: { label: 'İBB Beyaz Masa', number: '153' },
  police: { label: 'Polis / Acil', number: '112' },
  tourismPolice: { label: 'Turizm Polisi (İstanbul)', number: '+902125276300' },
};
