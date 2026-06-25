import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  // Base surfaces — deep navy, layered for depth
  bg: '#0B1020', // app background (deepest)
  surface: '#141B30', // primary card surface
  card: '#141B30', // alias of surface (back-compat)
  surfaceDeep: '#1C2742', // raised/inner surface
  cardDeep: '#1C2742', // alias of surfaceDeep (back-compat)
  surfaceAlt: '#0F1525', // inputs / recessed wells

  // Brand / accent — premium amber
  accent: '#F6B23C', // primary amber (brand, CTAs)
  accentDeep: '#D8941F', // pressed / gradient end
  accentSoft: 'rgba(246,178,60,0.14)', // tint fills, chip-active bg

  // Text — high contrast on dark
  text: '#F4F6FB', // primary (near-white)
  textMuted: '#A7B0C4', // secondary labels
  textFaint: '#5E6C82', // placeholders, captions, disabled

  // Borders / dividers
  border: '#26314F', // hairline border on surfaces
  borderStrong: '#36456B', // emphasized / focused border

  // Fraud semantic set (traffic-light)
  safe: '#34D399',
  safeBg: '#0C2A22',
  safeBorder: '#1E5C49',
  warning: '#FBBF24',
  warningBg: '#2E2410',
  warningBorder: '#7A5A12',
  critical: '#F75555',
  criticalBg: '#2C1015',
  criticalBorder: '#7A2230',

  // Status helpers
  scrim: 'rgba(0,0,0,0.30)',
  shadow: '#000000',
};

export const type = {
  hero: { fontSize: 34, fontWeight: '900', letterSpacing: 0.3 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: 0.2 },
  sectionLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  numericXL: { fontSize: 52, fontWeight: '900', letterSpacing: -0.5 },
  numericL: { fontSize: 40, fontWeight: '900', letterSpacing: -0.5 },
  numericM: { fontSize: 30, fontWeight: '900', letterSpacing: -0.3 },
  body: { fontSize: 16, fontWeight: '600', letterSpacing: 0 },
  bodyStrong: { fontSize: 17, fontWeight: '700' },
  caption: { fontSize: 13, fontWeight: '600' },
  button: { fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
} satisfies Record<string, TextStyle>;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 } as const;

export const radius = { sm: 10, md: 14, lg: 18, xl: 24, pill: 999 };

export const elevation = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  raised: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  cta: {
    shadowColor: '#F6B23C',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
} satisfies Record<string, ViewStyle>;
