import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';
import { estimateFare } from '../utils/fareCalculator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Trip'>;
type Route = RouteProp<RootStackParamList, 'Trip'>;

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function TripScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { startLat, startLon } = route.params;

  const [distanceKm, setDistanceKm] = useState(0);
  const [elapsedMin, setElapsedMin] = useState(0);
  const [currentEstimate, setCurrentEstimate] = useState(0);

  const lastPos = useRef({ lat: startLat, lon: startLon });
  const startTime = useRef(Date.now());
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          const added = getDistanceKm(
            lastPos.current.lat,
            lastPos.current.lon,
            latitude,
            longitude
          );
          lastPos.current = { lat: latitude, lon: longitude };
          setDistanceKm((prev) => {
            const next = prev + added;
            return next;
          });
        }
      );
    })();

    timerRef.current = setInterval(() => {
      const mins = (Date.now() - startTime.current) / 60000;
      setElapsedMin(mins);
    }, 10000);

    return () => {
      watchRef.current?.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    setCurrentEstimate(estimateFare(distanceKm, elapsedMin));
  }, [distanceKm, elapsedMin]);

  const endTrip = () => {
    Alert.alert(
      'Yolculuğu Bitir',
      'Varış noktasına ulaştınız mı?',
      [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'Evet',
          onPress: () => {
            watchRef.current?.remove();
            if (timerRef.current) clearInterval(timerRef.current);
            navigation.navigate('Result', {
              distanceKm: parseFloat(distanceKm.toFixed(2)),
              durationMin: parseFloat(elapsedMin.toFixed(1)),
              estimatedFare: parseFloat(currentEstimate.toFixed(0)),
            });
          },
        },
      ]
    );
  };

  const formatTime = (min: number) => {
    const m = Math.floor(min);
    const s = Math.floor((min - m) * 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yolculuk Devam Ediyor</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{distanceKm.toFixed(2)}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatTime(elapsedMin)}</Text>
          <Text style={styles.statLabel}>süre</Text>
        </View>
      </View>

      <View style={styles.estimateCard}>
        <Text style={styles.estimateLabel}>Tahmini Ücret</Text>
        <Text style={styles.estimateValue}>₺{currentEstimate.toFixed(0)}</Text>
        <Text style={styles.estimateNote}>İstanbul tarifesine göre</Text>
      </View>

      <TouchableOpacity style={styles.endButton} onPress={endTrip}>
        <Text style={styles.endButtonText}>Yolculuğu Bitir</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    color: '#F5A623',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 30,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 4,
  },
  estimateCard: {
    backgroundColor: '#0f3460',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  estimateLabel: {
    color: '#aaa',
    fontSize: 16,
  },
  estimateValue: {
    color: '#F5A623',
    fontSize: 56,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  estimateNote: {
    color: '#666',
    fontSize: 13,
  },
  endButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 50,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
