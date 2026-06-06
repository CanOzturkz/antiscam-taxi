import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { colors, radius } from '../theme';
import { useTripStore } from '../store/useTripStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useFareStore } from '../store/useFareStore';
import { estimateFareRange } from '../utils/fareCalculator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Trip'>;

export default function TripScreen() {
  const navigation = useNavigation<Nav>();
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
    <View style={styles.container}>
      <View style={styles.statusRow}>
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
  container: { flex: 1, backgroundColor: colors.bg, padding: 20, alignItems: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 24 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  statusText: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: 14, marginBottom: 24 },
  statCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 24, alignItems: 'center', flex: 1 },
  statValue: { color: colors.text, fontSize: 34, fontWeight: '900' },
  statUnit: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  fareCard: {
    backgroundColor: colors.cardDeep, borderRadius: radius.xl, padding: 30,
    alignItems: 'center', width: '100%', marginBottom: 40,
  },
  fareLabel: { color: colors.textMuted, fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  fareRange: { color: colors.accent, fontSize: 46, fontWeight: '900', marginVertical: 10, textAlign: 'center' },
  fareNote: { color: colors.textFaint, fontSize: 13 },
  waitNote: { color: colors.warning, fontSize: 13, marginTop: 6 },
  endBtn: { backgroundColor: colors.critical, borderRadius: radius.lg, paddingVertical: 20, paddingHorizontal: 60 },
  endText: { color: colors.text, fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
});
