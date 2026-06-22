import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import { colors, radius } from '../theme';
import type { LatLngPoint } from '../utils/polyline';

// Expo Go'da react-native-maps native modülü yoktur → MapView render edilirse çöker.
// Bu yüzden ortamı kontrol edip Expo Go'da yer tutucu gösteririz; dev build'de gerçek harita.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let PROVIDER_GOOGLE: any = undefined;
if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  } catch {
    MapView = null;
  }
}

interface Props {
  origin?: LatLngPoint | null;
  destination?: LatLngPoint | null;
  /** Çizilecek rota noktaları (decode edilmiş polyline) */
  routePoints?: LatLngPoint[];
  height?: number;
}

function regionFor(points: LatLngPoint[]) {
  const lats = points.map((p) => p.latitude);
  const lngs = points.map((p) => p.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.5),
    longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.5),
  };
}

export default function RouteMap({ origin, destination, routePoints = [], height = 220 }: Props) {
  const allPoints = [
    ...(origin ? [origin] : []),
    ...routePoints,
    ...(destination ? [destination] : []),
  ];

  // Harita yoksa (Expo Go) bilgilendirici yer tutucu
  if (!MapView) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Text style={styles.placeholderIcon}>🗺️</Text>
        <Text style={styles.placeholderText}>
          {isExpoGo ? 'Map shows in the dev build (not Expo Go)' : 'Map unavailable'}
        </Text>
      </View>
    );
  }

  if (allPoints.length === 0) {
    return <View style={[styles.placeholder, { height }]} />;
  }

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={regionFor(allPoints)}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {origin && <Marker coordinate={origin} title="Start" pinColor="#2ecc71" />}
        {destination && <Marker coordinate={destination} title="Destination" pinColor="#e74c3c" />}
        {routePoints.length > 1 && (
          <Polyline coordinates={routePoints} strokeColor={colors.accent} strokeWidth={5} />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', borderRadius: radius.lg, overflow: 'hidden', marginTop: 16 },
  placeholder: {
    width: '100%',
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  placeholderIcon: { fontSize: 36, marginBottom: 6 },
  placeholderText: { color: colors.textMuted, fontSize: 13 },
});
