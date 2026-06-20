import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, TextInput,
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
import { hasApiKey, geocode, getRoute, type RouteResult } from '../services/googleDirections';
import { estimateFareRange, type FareEstimate } from '../utils/fareCalculator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { cityId, taxiTypeId, setCity, setTaxiType } = useSettingsStore();
  const refreshRates = useCurrencyStore((s) => s.refresh);

  const [starting, setStarting] = useState(false);
  const [destination, setDestination] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [preRoute, setPreRoute] = useState<RouteResult | null>(null);
  const [preEstimate, setPreEstimate] = useState<FareEstimate | null>(null);

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

  const getCurrentCoords = async (): Promise<Location.LocationObjectCoords | null> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location needed', 'TaxiGuard needs your location to estimate the fare.');
      return null;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return loc.coords;
  };

  // Yola çıkmadan: Google Directions ile anlık trafiğe göre Min-Max tahmin
  const estimateBeforeTrip = async () => {
    if (!destination.trim()) return;
    setEstimating(true);
    setPreRoute(null);
    setPreEstimate(null);
    try {
      const coords = await getCurrentCoords();
      if (!coords) return;

      const dest = await geocode(destination.trim());
      if (!dest) {
        Alert.alert('Not found', 'Could not find that destination. Try a more specific address.');
        return;
      }

      const route = await getRoute(
        `${coords.latitude},${coords.longitude}`,
        `${dest.lat},${dest.lng}`
      );

      const estimate = estimateFareRange({
        distanceKm: route.distanceKm,
        durationMin: route.durationInTrafficMin,
        waitingMin: route.estimatedWaitingMin,
        cityId,
        taxiTypeId,
      });

      setPreRoute(route);
      setPreEstimate(estimate);
    } catch (e: any) {
      const msg = e?.message === 'NO_API_KEY'
        ? 'Google Maps API key is not set yet.'
        : 'Could not calculate the route. Check your connection and try again.';
      Alert.alert('Estimate failed', msg);
    } finally {
      setEstimating(false);
    }
  };

  const startTrip = async () => {
    setStarting(true);
    try {
      const coords = await getCurrentCoords();
      if (!coords) return;
      useTripStore.getState().start(coords.latitude, coords.longitude);
      navigation.navigate('Trip');
    } catch {
      Alert.alert('Error', 'Could not get your location. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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

      {/* Yola çıkmadan tahmin — Google Directions (anlık trafik) */}
      <Text style={styles.sectionLabel}>WHERE ARE YOU GOING?</Text>
      <View style={styles.destRow}>
        <TextInput
          style={styles.destInput}
          placeholder="e.g. Istiklal Street, Taksim"
          placeholderTextColor={colors.textFaint}
          value={destination}
          onChangeText={setDestination}
          returnKeyType="search"
          onSubmitEditing={estimateBeforeTrip}
        />
      </View>

      {hasApiKey() ? (
        <TouchableOpacity
          style={[styles.estimateBtn, (!destination.trim() || estimating) && styles.btnDisabled]}
          onPress={estimateBeforeTrip}
          disabled={!destination.trim() || estimating}
          activeOpacity={0.85}
        >
          {estimating ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Text style={styles.estimateText}>📍  Estimate fare (live traffic)</Text>
          )}
        </TouchableOpacity>
      ) : (
        <Text style={styles.keyNote}>
          ⚙️ Add a Google Maps API key to enable live route + traffic estimates.
        </Text>
      )}

      {preEstimate && preRoute && (
        <View style={styles.preCard}>
          <Text style={styles.preLabel}>EXPECTED FARE (before you ride)</Text>
          <Text style={styles.preRange}>
            ₺{Math.round(preEstimate.min)} – ₺{Math.round(preEstimate.max)}
          </Text>
          <Text style={styles.preMeta}>
            {preRoute.distanceKm.toFixed(1)} km · ~{Math.round(preRoute.durationInTrafficMin)} min in traffic
          </Text>
          {preRoute.estimatedWaitingMin > 1 && (
            <Text style={styles.preTraffic}>🚦 +{Math.round(preRoute.estimatedWaitingMin)} min traffic delay included</Text>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.startBtn, starting && styles.btnDisabled]}
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
        <Text style={styles.infoText}>1.  Enter your destination for a fare estimate</Text>
        <Text style={styles.infoText}>2.  Start the trip — GPS tracks your route</Text>
        <Text style={styles.infoText}>3.  At arrival, enter the price the driver asks</Text>
        <Text style={styles.infoText}>4.  We warn you instantly if it's a scam</Text>
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
  destRow: { flexDirection: 'row' },
  destInput: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md, paddingHorizontal: 16,
    paddingVertical: 16, color: colors.text, fontSize: 17,
  },
  estimateBtn: {
    marginTop: 12, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center',
    borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.card,
  },
  estimateText: { color: colors.accent, fontSize: 17, fontWeight: '800' },
  keyNote: { color: colors.textFaint, fontSize: 13, marginTop: 12, lineHeight: 19 },
  btnDisabled: { opacity: 0.5 },
  preCard: {
    backgroundColor: colors.cardDeep, borderRadius: radius.lg, padding: 20,
    alignItems: 'center', marginTop: 16,
  },
  preLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  preRange: { color: colors.accent, fontSize: 40, fontWeight: '900', marginVertical: 6 },
  preMeta: { color: colors.text, fontSize: 14 },
  preTraffic: { color: colors.warning, fontSize: 13, marginTop: 6 },
  startBtn: {
    backgroundColor: colors.accent, borderRadius: radius.lg, paddingVertical: 22,
    alignItems: 'center', marginTop: 24,
  },
  startText: { color: colors.bg, fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  infoBox: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, marginTop: 28 },
  infoTitle: { color: colors.accent, fontSize: 16, fontWeight: '700', marginBottom: 10 },
  infoText: { color: colors.textMuted, fontSize: 15, marginBottom: 8, lineHeight: 21 },
});
