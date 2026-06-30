import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { colors, radius, space, type, elevation } from '../theme';
import Segmented, { type SegmentOption } from '../components/Segmented';
import { useSettingsStore } from '../store/useSettingsStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { useTripStore } from '../store/useTripStore';
import { listCities, listTaxiTypes, getTaxiType, getTolls, getCity } from '../config/tariffConfig';
import { hasApiKey, getRoute, type RouteResult } from '../services/googleDirections';
import { estimateFareRange, type FareEstimate } from '../utils/fareCalculator';
import { detectTolls, crossesBosphorus, type TollDetection } from '../utils/tolls';
import RouteMap from '../components/RouteMap';
import { decodePolyline } from '../utils/polyline';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { cityId, taxiTypeId, setCity, setTaxiType } = useSettingsStore();
  const refreshRates = useCurrencyStore((s) => s.refresh);

  const [starting, setStarting] = useState(false);
  const [destination, setDestination] = useState('');
  const [destFocused, setDestFocused] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [preRoute, setPreRoute] = useState<RouteResult | null>(null);
  const [preEstimate, setPreEstimate] = useState<FareEstimate | null>(null);
  const [preTolls, setPreTolls] = useState<TollDetection | null>(null);

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

  const city = getCity(cityId);
  const cityVerified = city.verified !== false; // sadece açıkça false → uyarı

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
    setPreTolls(null);
    try {
      const coords = await getCurrentCoords();
      if (!coords) return;

      // Directions hedefi düz metin adres olarak kabul eder (Geocoding API gerekmez)
      const route = await getRoute(
        `${coords.latitude},${coords.longitude}`,
        destination.trim()
      );

      // Rota köprü/tünel/otoyoldan geçiyorsa geçiş ücretini tespit et (havalimanı yanlış-alarmını önler)
      // O-7 / Avrasya Tüneli: yol adı keyword'üyle. Boğaz köprüsü: coğrafi kıta geçişiyle.
      const cityTolls = getTolls(cityId);
      const det = detectTolls(route.tollText, cityTolls);
      const matched = [...det.matched];
      let total = det.total;
      const hasO7 = det.matched.some((m) => m.id === 'northmarmara');
      const hasTunnel = det.matched.some((m) => m.id === 'eurasia');
      // O-7 zaten Y.S.S. köprüsünü, tünel de geçişi içerir → coğrafi köprüyü tekrar ekleme
      if (!hasO7 && !hasTunnel &&
          crossesBosphorus(route.startLocation.lat, route.startLocation.lng, route.endLocation.lat, route.endLocation.lng)) {
        const bridge = cityTolls.find((t) => t.id === 'bosphorus');
        if (bridge) { matched.push(bridge); total += bridge.fee; }
      }
      const tolls: TollDetection = { matched, total, approximate: det.approximate };

      const estimate = estimateFareRange({
        distanceKm: route.distanceKm,
        durationMin: route.durationInTrafficMin,
        waitingMin: route.estimatedWaitingMin,
        tollsTotal: tolls.total,
        cityId,
        taxiTypeId,
      });

      // Yola çıkmadan tahminde belirsizlik payı: gerçek rota/mesafe/trafik
      // Google'ın tahmininden sapabilir. Mantıklı bir Min-Max bandı göster.
      const point = estimate.point;
      const banded = {
        ...estimate,
        min: Math.round(point * 0.95),
        max: Math.round(point * 1.15),
      };

      setPreRoute(route);
      setPreEstimate(banded);
      setPreTolls(tolls);
    } catch (e: any) {
      const code = e?.message;
      const msg = code === 'NO_API_KEY'
        ? 'Google Maps API key is not set yet.'
        : code === 'NOT_FOUND' || code === 'ZERO_RESULTS'
        ? 'Could not find that destination. Try a more specific address.'
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

  const startDisabled = starting;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxxl }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.brand}>🛡️ TaxiGuard</Text>
      <Text style={styles.subtitle}>Don't get scammed by taxis</Text>

      <TouchableOpacity style={styles.historyLink} onPress={() => navigation.navigate('History')} activeOpacity={0.7}>
        <Text style={styles.historyLinkText}>🕘  Trip history</Text>
      </TouchableOpacity>

      {cityOptions.length > 1 && (
        <>
          <Text style={styles.sectionLabel}>CITY</Text>
          <Segmented options={cityOptions} selectedId={cityId} onSelect={setCity} scroll />
        </>
      )}

      <Text style={styles.sectionLabel}>TAXI TYPE</Text>
      <Segmented options={taxiOptions} selectedId={taxiTypeId} onSelect={setTaxiType} scroll />

      {!cityVerified && (
        <View style={styles.betaBanner}>
          <Text style={styles.betaText}>
            ⚠️ {city.name} fares are not officially verified yet (beta) — treat estimates as approximate.
          </Text>
        </View>
      )}

      {/* Yola çıkmadan tahmin — Google Directions (anlık trafik) */}
      <Text style={styles.sectionLabel}>WHERE ARE YOU GOING?</Text>
      <View style={styles.destRow}>
        <TextInput
          style={[styles.destInput, destFocused && styles.destInputFocused]}
          placeholder="e.g. Istiklal Street, Taksim"
          placeholderTextColor={colors.textFaint}
          value={destination}
          onChangeText={setDestination}
          onFocus={() => setDestFocused(true)}
          onBlur={() => setDestFocused(false)}
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
          <Text style={styles.preLabel}>EXPECTED FARE (BEFORE YOU RIDE)</Text>
          <Text style={styles.preRange}>
            ₺{Math.round(preEstimate.min)} – ₺{Math.round(preEstimate.max)}
          </Text>
          <Text style={styles.preMeta}>
            {preRoute.distanceKm.toFixed(1)} km · ~{Math.round(preRoute.durationInTrafficMin)} min in traffic
          </Text>
          {preRoute.estimatedWaitingMin > 1 && (
            <Text style={styles.preTraffic}>🚦 +{Math.round(preRoute.estimatedWaitingMin)} min traffic delay included</Text>
          )}
          {preTolls && preTolls.total > 0 && (
            <Text style={styles.preToll}>
              🛣️ incl. tolls ₺{Math.round(preTolls.total)}{preTolls.approximate ? '≈' : ''} — {preTolls.matched.map((t) => t.label).join(', ')}
            </Text>
          )}
          <RouteMap
            origin={{ latitude: preRoute.startLocation.lat, longitude: preRoute.startLocation.lng }}
            destination={{ latitude: preRoute.endLocation.lat, longitude: preRoute.endLocation.lng }}
            routePoints={preRoute.polyline ? decodePolyline(preRoute.polyline) : []}
            height={200}
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.startBtn, startDisabled ? styles.startBtnDisabled : elevation.cta]}
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
  content: { padding: space.xl },
  brand: { ...type.hero, color: colors.accent, textAlign: 'center', marginTop: space.lg },
  subtitle: { ...type.body, color: colors.textMuted, textAlign: 'center', marginTop: space.xs },
  historyLink: { alignSelf: 'center', marginTop: space.md, marginBottom: space.lg, paddingVertical: space.xs, paddingHorizontal: space.md },
  historyLinkText: { ...type.caption, color: colors.accent, fontWeight: '700' },
  sectionLabel: {
    ...type.sectionLabel,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: space.xxl - 6,
    marginBottom: space.md - 2,
  },
  betaBanner: {
    marginTop: space.md,
    backgroundColor: colors.warningBg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  betaText: { ...type.caption, color: colors.warning, lineHeight: 18 },
  destRow: { flexDirection: 'row' },
  destInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: space.lg,
    paddingVertical: space.lg,
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  destInputFocused: { borderColor: colors.borderStrong },
  estimateBtn: {
    marginTop: space.md,
    borderRadius: radius.md,
    paddingVertical: space.lg,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  estimateText: { ...type.bodyStrong, color: colors.accent },
  keyNote: { ...type.caption, color: colors.textFaint, marginTop: space.md, lineHeight: 19 },
  btnDisabled: { opacity: 0.45 },
  preCard: {
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: space.xxl,
    alignItems: 'center',
    marginTop: space.lg,
    ...elevation.raised,
  },
  preLabel: { ...type.sectionLabel, color: colors.textMuted, textTransform: 'uppercase' },
  preRange: { ...type.numericXL, color: colors.accent, marginVertical: space.sm, textAlign: 'center' },
  preMeta: { ...type.caption, color: colors.textMuted },
  preTraffic: { ...type.caption, color: colors.warning, marginTop: space.xs + 2 },
  preToll: { ...type.caption, color: colors.textMuted, marginTop: space.xs + 2, textAlign: 'center', paddingHorizontal: space.md },
  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: space.xl,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.xxl,
  },
  startBtnDisabled: { opacity: 0.45 },
  startText: { ...type.button, color: colors.bg, fontSize: 20 },
  infoBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    marginTop: space.xxl,
    ...elevation.card,
  },
  infoTitle: { ...type.bodyStrong, color: colors.accent, marginBottom: space.md - 2 },
  infoText: { ...type.body, color: colors.textMuted, marginBottom: space.sm, lineHeight: 22 },
});
