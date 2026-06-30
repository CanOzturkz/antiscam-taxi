import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, space, type, elevation } from '../theme';
import { useHistoryStore, type TripRecord } from '../store/useHistoryStore';
import type { FraudLevel } from '../utils/fraudEngine';

const LEVEL_BADGE: Record<FraudLevel, { label: string; color: string; bg: string }> = {
  SAFE: { label: 'FAIR', color: colors.safe, bg: colors.safeBg },
  WARNING: { label: 'HIGH', color: colors.warning, bg: colors.warningBg },
  CRITICAL: { label: 'SCAM', color: colors.critical, bg: colors.criticalBg },
};

function formatDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function Record({ r }: { r: TripRecord }) {
  const badge = r.level ? LEVEL_BADGE[r.level] : null;
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.date}>{formatDate(r.date)}</Text>
        {badge && (
          <View style={[styles.badge, { backgroundColor: badge.bg, borderColor: badge.color }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        )}
      </View>
      <Text style={styles.meta}>
        {r.distanceKm.toFixed(1)} km · {Math.round(r.durationMin)} min
      </Text>
      <View style={styles.rowBetween}>
        <Text style={styles.estLabel}>Legal estimate</Text>
        <Text style={styles.estValue}>₺{Math.round(r.estimateMin)} – ₺{Math.round(r.estimateMax)}</Text>
      </View>
      {r.askedDisplay && (
        <View style={styles.rowBetween}>
          <Text style={styles.estLabel}>Driver asked</Text>
          <Text style={[styles.asked, r.level === 'CRITICAL' && { color: colors.critical }]}>
            {r.askedDisplay}{r.askedTRY ? ` (≈₺${Math.round(r.askedTRY)})` : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const records = useHistoryStore((s) => s.records);
  const clear = useHistoryStore((s) => s.clear);

  const confirmClear = () => {
    Alert.alert('Clear history', 'Delete all saved trips?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: clear },
    ]);
  };

  if (records.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🕘</Text>
        <Text style={styles.emptyText}>No trips yet.</Text>
        <Text style={styles.emptySub}>Your checked trips will appear here.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxl }]}
    >
      {records.map((r) => (
        <Record key={r.id} r={r} />
      ))}
      <TouchableOpacity style={styles.clearBtn} onPress={confirmClear} activeOpacity={0.85}>
        <Text style={styles.clearText}>Clear history</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl },
  empty: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: space.xl },
  emptyIcon: { fontSize: 44, marginBottom: space.md },
  emptyText: { ...type.title, color: colors.text },
  emptySub: { ...type.body, color: colors.textMuted, marginTop: space.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
    marginBottom: space.md,
    ...elevation.card,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.sm },
  date: { ...type.caption, color: colors.textMuted },
  badge: { paddingHorizontal: space.md, paddingVertical: 2, borderRadius: radius.pill, borderWidth: 1 },
  badgeText: { ...type.caption, fontWeight: '800', letterSpacing: 0.5 },
  meta: { ...type.bodyStrong, color: colors.text, marginBottom: space.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.xs },
  estLabel: { ...type.caption, color: colors.textMuted },
  estValue: { ...type.bodyStrong, color: colors.accent },
  asked: { ...type.bodyStrong, color: colors.text },
  clearBtn: {
    marginTop: space.lg,
    borderRadius: radius.md,
    paddingVertical: space.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.critical,
  },
  clearText: { ...type.bodyStrong, color: colors.critical },
});
