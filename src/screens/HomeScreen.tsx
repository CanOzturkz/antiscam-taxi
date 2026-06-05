import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [destination, setDestination] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Konum İzni', 'Uygulama konum erişimine ihtiyaç duyuyor.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      setLoading(false);
    })();
  }, []);

  const startTrip = () => {
    if (!location) {
      Alert.alert('Hata', 'Konum alınamadı.');
      return;
    }
    navigation.navigate('Trip', {
      startLat: location.coords.latitude,
      startLon: location.coords.longitude,
      destination,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={styles.loadingText}>Konum alınıyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TaksiGüvenli</Text>
        <Text style={styles.subtitle}>İstanbul'da güvenli seyahat et</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nereye gidiyorsunuz?</Text>
        <TextInput
          style={styles.input}
          placeholder="Örn: Taksim Meydanı"
          placeholderTextColor="#999"
          value={destination}
          onChangeText={setDestination}
        />

        {location && (
          <Text style={styles.locationText}>
            📍 Konumunuz alındı
          </Text>
        )}

        <TouchableOpacity
          style={[styles.button, !location && styles.buttonDisabled]}
          onPress={startTrip}
          disabled={!location}
        >
          <Text style={styles.buttonText}>Yolculuğu Başlat</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Nasıl çalışır?</Text>
        <Text style={styles.infoText}>1. Yolculuğu başlat — GPS rotayı takip eder</Text>
        <Text style={styles.infoText}>2. Varışta taksicinin istediği tutarı gir</Text>
        <Text style={styles.infoText}>3. Dolandırılıyorsan alarm verir</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F5A623',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  locationText: {
    color: '#4CAF50',
    fontSize: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#F5A623',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#555',
  },
  buttonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 18,
  },
  infoTitle: {
    color: '#F5A623',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoText: {
    color: '#bbb',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
});
