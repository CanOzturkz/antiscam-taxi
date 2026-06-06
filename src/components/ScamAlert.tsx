import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { colors, radius } from '../theme';
import type { FraudAssessment } from '../utils/fraudEngine';
import { OFFICIAL_CONTACTS } from '../utils/fraudEngine';

interface Props {
  assessment: FraudAssessment;
  /** Talep edilen tutarın orijinal gösterimi, ör. "$150" */
  askedDisplay: string;
}

const LEVEL_STYLE = {
  SAFE: { icon: '✅', title: 'FAIR PRICE', color: colors.safe, bg: colors.safeBg },
  WARNING: { icon: '⚠️', title: 'POSSIBLE OVERCHARGE', color: colors.warning, bg: colors.warningBg },
  CRITICAL: { icon: '🚨', title: 'SCAM ALERT', color: colors.critical, bg: colors.criticalBg },
} as const;

function call(number: string) {
  Linking.openURL(`tel:${number}`).catch(() => {});
}

export default function ScamAlert({ assessment, askedDisplay }: Props) {
  const s = LEVEL_STYLE[assessment.level];
  const { estimate } = assessment;
  const showActions = assessment.level !== 'SAFE';

  return (
    <View style={[styles.card, { backgroundColor: s.bg, borderColor: s.color }]}>
      <Text style={styles.icon}>{s.icon}</Text>
      <Text style={[styles.title, { color: s.color }]}>{s.title}</Text>

      {/* Büyük, net karşılaştırma */}
      <View style={styles.compareRow}>
        <View style={styles.compareCol}>
          <Text style={styles.compareLabel}>DRIVER ASKS</Text>
          <Text style={[styles.compareValue, { color: s.color }]}>{askedDisplay}</Text>
          <Text style={styles.compareSub}>≈ ₺{Math.round(assessment.askedTRY)}</Text>
        </View>
        <Text style={styles.vs}>vs</Text>
        <View style={styles.compareCol}>
          <Text style={styles.compareLabel}>METER MAX</Text>
          <Text style={styles.compareValue}>₺{Math.round(estimate.max)}</Text>
          <Text style={styles.compareSub}>legal limit</Text>
        </View>
      </View>

      {assessment.level === 'SAFE' ? (
        <Text style={styles.safeMsg}>The amount matches the legal taxi meter. You can pay safely.</Text>
      ) : (
        <View style={styles.overchargeBox}>
          <Text style={styles.overchargeLabel}>OVERCHARGE</Text>
          <Text style={[styles.overchargeValue, { color: s.color }]}>
            +₺{Math.round(assessment.overchargeTRY)}
          </Text>
          <Text style={styles.overchargePct}>{assessment.overchargePct}% above legal price</Text>
        </View>
      )}

      {showActions && (
        <>
          <Text style={styles.advice}>
            Ask the driver to show the taximeter. You are not required to pay an unmetered price.
          </Text>
          <View style={styles.actions}>
            <ActionButton
              label={`Call ${OFFICIAL_CONTACTS.ibbWhiteDesk.number}`}
              sub="City Help Desk"
              onPress={() => call(OFFICIAL_CONTACTS.ibbWhiteDesk.number)}
              color={s.color}
            />
            <ActionButton
              label={`Call ${OFFICIAL_CONTACTS.police.number}`}
              sub="Police / Emergency"
              onPress={() => call(OFFICIAL_CONTACTS.police.number)}
              color={s.color}
            />
          </View>
          <ActionButton
            label="Call Tourism Police"
            sub="İstanbul Tourism Police"
            onPress={() => call(OFFICIAL_CONTACTS.tourismPolice.number)}
            color={s.color}
            full
          />
        </>
      )}
    </View>
  );
}

function ActionButton({
  label,
  sub,
  onPress,
  color,
  full,
}: {
  label: string;
  sub: string;
  onPress: () => void;
  color: string;
  full?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { borderColor: color }, full && styles.actionBtnFull]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.actionLabel, { color }]}>📞 {label}</Text>
      <Text style={styles.actionSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: 22,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 20,
  },
  icon: { fontSize: 56, marginBottom: 4 },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: 1, marginBottom: 18, textAlign: 'center' },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  compareCol: { flex: 1, alignItems: 'center' },
  compareLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  compareValue: { color: colors.text, fontSize: 32, fontWeight: '900', marginVertical: 2 },
  compareSub: { color: colors.textFaint, fontSize: 13 },
  vs: { color: colors.textFaint, fontSize: 16, fontWeight: '700', marginHorizontal: 8 },
  safeMsg: { color: colors.text, fontSize: 17, textAlign: 'center', lineHeight: 24, marginTop: 4 },
  overchargeBox: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: radius.lg,
    marginBottom: 16,
    width: '100%',
  },
  overchargeLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  overchargeValue: { fontSize: 40, fontWeight: '900', marginVertical: 2 },
  overchargePct: { color: colors.text, fontSize: 15 },
  advice: { color: colors.text, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 10 },
  actionBtn: {
    flex: 1,
    borderWidth: 2,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  actionBtnFull: { width: '100%' },
  actionLabel: { fontSize: 17, fontWeight: '800' },
  actionSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
