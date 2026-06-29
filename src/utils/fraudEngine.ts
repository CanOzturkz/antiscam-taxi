import type { FareEstimate } from './fareCalculator';
import { toTRY, type CurrencyCode } from './currency';
import { getFraudThresholds } from '../config/tariffConfig';

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

/**
 * Dolandırıcılık Tespit Motoru.
 * Talep edilen tutarı (yerel ya da yabancı para) TRY'ye çevirir,
 * yasal taksimetre tavanıyla (estimate.max) karşılaştırır ve seviye belirler.
 * Eşikler config'ten gelir (getFraudThresholds): varsayılan
 *   SAFE     : ratio <= safeMax (1.10)
 *   WARNING  : safeMax < ratio < criticalMin
 *   CRITICAL : ratio >= criticalMin (1.40)
 */
export function assessFraud(input: FraudInput): FraudAssessment {
  const { estimate, askedAmount, askedCurrency, rates } = input;
  const { safeMax, criticalMin } = getFraudThresholds();

  const askedTRY = toTRY(askedAmount, askedCurrency, rates);
  const ceiling = estimate.max;
  const ratio = ceiling > 0 ? askedTRY / ceiling : 0;
  const overchargeTRY = Math.max(0, askedTRY - ceiling);
  const overchargePct = ceiling > 0 ? Math.max(0, (askedTRY / ceiling - 1) * 100) : 0;

  let level: FraudLevel;
  if (ratio <= safeMax) {
    level = 'SAFE';
  } else if (ratio < criticalMin) {
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
