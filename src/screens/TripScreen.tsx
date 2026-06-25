import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { colors, radius, space, type, elevation } from '../theme';
import { useTripStore } from '../store/useTripStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useFareStore } from '../store/useFareStore';
import { estimateFareRange } from '../utils/fareCalculator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Trip'>;

export default function TripScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { cityId, taxiTypeId } = useSettingsStore();

  const distanceKm = useTripStore((s) => s.distanceKm);
  const durationSec = useTripStore((s) => s.durationSec);
  const waitingSec = useTripStore((s) => s.waitingSec);
  const currentSpeed = useTripStore((s) => s.currentSpeed);

  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 2000 },
        (loc) => {
          if (!mounted) return;
          useTripStore.getState().onPosition(
            loc.coords.latitude,
            loc.coords.longitude,
            loc.coords.speed ?? null
          );
        }
      );
    })();

    timerRef.current = setInterval(() => {
      useTripStore.getState().onTick(1);
    }, 1000);

    return () => {
      mounted = false;
      watchRef.current?.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const durationMin = durationSec / 60;
  const waitingMin = waitingSec / 60;

  const estimate = useMemo(
    () => estimateFareRange({ distanceKm, durationMin, waitingMin, cityId, taxiTypeId }),
    [distanceKm, durationMin, waitingMin, cityId, taxiTypeId]
  );

  const moving = currentSpeed >= 2.5;

  const endTrip = () => {
    Alert.alert('End trip', 'Have you arrived at your destination?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        onPress: () => {
          watchRef.current?.remove();
          if (timerRef.current) clearInterval(timerRef.current);
          useTripStore.getState().stop();
          useFareStore.getState().setEstimate(estimate);
          navigation.navigate('Result');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + space.xl }]}>
      <View style={styles.statusPill}>
        <View style={[styles.dot, { backgroundColor: moving ? colors.safe : colors.warning }]} />
        <Text style={styles.statusText}>{moving ? 'Moving' : 'Stopped / traffic'}</Text>
      </View>

      <View style={styles.statsGrid}>
        <Stat value={distanceKm.toFixed(2)} unit="km" />
        <Stat value={formatTime(durationSec)} unit="time" />
      </View>

      <View style={styles.fareCard}>
        <Text style={styles.fareLabel}>ESTIMATED FARE</Text>
        <Text style={styles.fareRange}>
          ₺{Math.round(estimate.min)} – ₺{Math.round(estimate.max)}
        </Text>
        <Text style={styles.fareNote}>based on the live taxi meter tariff</Text>
        {waitingMin > 0.2 && (
          <Text style={styles.waitNote}>incl. {Math.round(waitingMin)} min in traffic</Text>
        )}
      </View>

      <TouchableOpacity style={styles.endBtn} onPress={endTrip} activeOpacity={0.85}>
        <Text style={styles.endText}>■  END TRIP</Text>
      </TouchableOpacity>
    </View>
  );
}

function Stat({ value, unit }: { value: string; unit: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
    </View>
  );
}

function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: space.xl, alignItems: 'center' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm + 2,
    marginTop: space.xxl,
    marginBottom: space.xxl,
  },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: space.sm },
  statusText: { ...type.body, color: colors.text, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: space.lg, marginBottom: space.xxl, width: '100%' },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xxl - 4,
    alignItems: 'center',
    flex: 1,
    ...elevation.card,
  },
  statValue: { ...type.numericM, color: colors.text },
  statUnit: { ...type.caption, color: colors.textMuted, marginTop: space.xs },
  fareCard: {
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: space.xxl,
    alignItems: 'center',
    width: '100%',
    marginBottom: space.xxxl,
    ...elevation.raised,
  },
  fareLabel: { ...type.sectionLabel, color: colors.textMuted, textTransform: 'uppercase' },
  fareRange: { ...type.numericXL, color: colors.accent, marginVertical: space.sm + 2, textAlign: 'center' },
  fareNote: { ...type.caption, color: colors.textFaint },
  waitNote: { ...type.caption, color: colors.warning, marginTop: space.xs + 2 },
  endBtn: {
    backgroundColor: colors.critical,
    borderRadius: radius.lg,
    paddingVertical: space.xl,
    paddingHorizontal: space.xxxl + space.xl,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.critical,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  endText: { ...type.button, color: colors.text, fontSize: 20 },
});
