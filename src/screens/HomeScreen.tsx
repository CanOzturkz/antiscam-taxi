import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { colors, radius } from '../theme';
import Segmented, { type SegmentOption } from '../components/Segmented';
import { useSettingsStore } from '../store/useSettingsStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { useTripStore } from '../store/useTripStore';
import { listCities, listTaxiTypes, getTaxiType } from '../config/tariffConfig';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { cityId, taxiTypeId, setCity, setTaxiType } = useSettingsStore();
  const refreshRates = useCurrencyStore((s) => s.refresh);

  const [starting, setStarting] = useState(false);

  // Uygulama açılır açılmaz canlı döviz kurlarını çek
  useEffect(() => {
    refreshRates();
  }, [refreshRates]);

  const cities = listCities();
  const cityOptions: SegmentOption[] = cities.map((c) => ({ id: c.id, label: c.name }));

  const taxiOptions: SegmentOption[] = listTaxiTypes(cityId).map((t) => {
    const tt = getTaxiType(cityId, t.id);
    return { id: t.id, label: t.label.replace(' Taksi', ''), sublabel: `₺${tt.opening} + ₺${tt.perKm}/km` };
  });

  const startTrip = async () => {
    setStarting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location needed', 'TaxiGuard needs your location to track the route.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      useTripStore.getState().start(loc.coords.latitude, loc.coords.longitude);
      navigation.navigate('Trip');
    } catch {
      Alert.alert('Error', 'Could not get your location. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.brand}>🛡️ TaxiGuard</Text>
      <Text style={styles.subtitle}>Don't get scammed by taxis</Text>

      {cityOptions.length > 1 && (
        <>
          <Text style={styles.sectionLabel}>CITY</Text>
          <Segmented options={cityOptions} selectedId={cityId} onSelect={setCity} scroll />
        </>
      )}

      <Text style={styles.sectionLabel}>TAXI TYPE</Text>
      <Segmented options={taxiOptions} selectedId={taxiTypeId} onSelect={setTaxiType} scroll />

      <TouchableOpacity
        style={[styles.startBtn, starting && styles.startBtnDisabled]}
        onPress={startTrip}
        disabled={starting}
        activeOpacity={0.85}
      >
        {starting ? (
          <ActivityIndicator color={colors.bg} />
        ) : (
          <Text style={styles.startText}>▶  START TRIP</Text>
        )}
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How it works</Text>
        <Text style={styles.infoText}>1.  Start the trip — GPS tracks your route</Text>
        <Text style={styles.infoText}>2.  At arrival, enter the price the driver asks</Text>
        <Text style={styles.infoText}>3.  We warn you instantly if it's a scam</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  brand: { fontSize: 34, fontWeight: '900', color: colors.accent, textAlign: 'center', marginTop: 16 },
  subtitle: { fontSize: 16, color: colors.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 24 },
  sectionLabel: {
    color: colors.textMuted, fontSize: 13, fontWeight: '700', letterSpacing: 1,
    marginTop: 22, marginBottom: 10,
  },
  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 22,
    alignItems: 'center',
    marginTop: 30,
  },
  startBtnDisabled: { opacity: 0.6 },
  startText: { color: colors.bg, fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  infoBox: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, marginTop: 28 },
  infoTitle: { color: colors.accent, fontSize: 16, fontWeight: '700', marginBottom: 10 },
  infoText: { color: colors.textMuted, fontSize: 15, marginBottom: 8, lineHeight: 21 },
});
