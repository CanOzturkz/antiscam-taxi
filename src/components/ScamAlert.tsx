import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { colors, radius, space, type, elevation } from '../theme';
import type { FraudAssessment } from '../utils/fraudEngine';
import { OFFICIAL_CONTACTS } from '../utils/fraudEngine';

interface Props {
  assessment: FraudAssessment;
  /** Talep edilen tutarın orijinal gösterimi, ör. "$150" */
  askedDisplay: string;
}

const LEVEL_STYLE = {
  SAFE: { icon: '✅', title: 'FAIR PRICE', color: colors.safe, bg: colors.safeBg, border: colors.safeBorder },
  WARNING: { icon: '⚠️', title: 'POSSIBLE OVERCHARGE', color: colors.warning, bg: colors.warningBg, border: colors.warningBorder },
  CRITICAL: { icon: '🚨', title: 'SCAM ALERT', color: colors.critical, bg: colors.criticalBg, border: colors.criticalBorder },
} as const;

function call(number: string) {
  Linking.openURL(`tel:${number}`).catch(() => {});
}

export default function ScamAlert({ assessment, askedDisplay }: Props) {
  const s = LEVEL_STYLE[assessment.level];
  const { estimate } = assessment;
  const showActions = assessment.level !== 'SAFE';

  return (
    <View style={[styles.card, { backgroundColor: s.bg, borderColor: s.border }]}>
      <View style={[styles.rail, { backgroundColor: s.color }]} />

      <View style={[styles.iconChip, { backgroundColor: colors.scrim, borderColor: s.color }]}>
        <Text style={styles.icon}>{s.icon}</Text>
      </View>
      <Text style={[styles.title, { color: s.color }]}>{s.title}</Text>

      {/* Büyük, net karşılaştırma */}
      <View style={styles.compareRow}>
        <View style={styles.compareCol}>
          <Text style={styles.compareLabel}>DRIVER ASKS</Text>
          <Text style={[styles.compareValue, { color: s.color }]}>{askedDisplay}</Text>
          <Text style={styles.compareSub}>≈ ₺{Math.round(assessment.askedTRY)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.compareCol}>
          <Text style={styles.compareLabel}>METER MAX</Text>
          <Text style={[styles.compareValue, styles.compareValueMeter]}>₺{Math.round(estimate.max)}</Text>
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
    padding: space.xxl,
    paddingTop: space.xxl + 6,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: space.xl,
    overflow: 'hidden',
    ...elevation.raised,
  },
  rail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  iconChip: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  icon: { fontSize: 48, textAlign: 'center' },
  title: { ...type.title, fontSize: 28, fontWeight: '900', letterSpacing: 1, marginBottom: space.lg, textAlign: 'center' },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: space.lg,
  },
  compareCol: { flex: 1, alignItems: 'center' },
  compareLabel: { ...type.sectionLabel, color: colors.textMuted, textTransform: 'uppercase' },
  compareValue: { ...type.numericM, marginVertical: space.xs },
  compareValueMeter: { color: colors.text },
  compareSub: { ...type.caption, color: colors.textFaint },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border, marginHorizontal: space.sm },
  safeMsg: { ...type.bodyStrong, color: colors.text, textAlign: 'center', lineHeight: 24, marginTop: space.xs },
  overchargeBox: {
    alignItems: 'center',
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    backgroundColor: colors.scrim,
    borderRadius: radius.lg,
    marginBottom: space.lg,
    width: '100%',
  },
  overchargeLabel: { ...type.sectionLabel, color: colors.textMuted, textTransform: 'uppercase' },
  overchargeValue: { ...type.numericL, marginVertical: space.xs },
  overchargePct: { ...type.caption, color: colors.text },
  advice: { ...type.body, color: colors.text, textAlign: 'center', lineHeight: 22, marginBottom: space.lg },
  actions: { flexDirection: 'row', gap: space.sm + 2, width: '100%', marginBottom: space.sm + 2 },
  actionBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: space.md,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scrim,
  },
  actionBtnFull: { width: '100%', flex: undefined },
  actionLabel: { ...type.bodyStrong },
  actionSub: { ...type.caption, color: colors.textMuted, marginTop: 2 },
});
