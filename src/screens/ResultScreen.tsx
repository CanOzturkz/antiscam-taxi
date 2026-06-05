import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';
import { isScam, getOvercharge } from '../utils/fareCalculator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Result'>;
type Route = RouteProp<RootStackParamList, 'Result'>;

export default function ResultScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { distanceKm, durationMin, estimatedFare } = route.params;

  const [askedAmount, setAskedAmount] = useState('');
  const [result, setResult] = useState<'scam' | 'fair' | null>(null);
  const [overcharge, setOvercharge] = useState(0);

  useEffect(() => {
    if (result === 'scam') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else if (result === 'fair') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [result]);

  const checkFare = () => {
    const asked = parseFloat(askedAmount);
    if (isNaN(asked) || asked <= 0) return;
    const scam = isScam(estimatedFare, asked);
    setResult(scam ? 'scam' : 'fair');
    setOvercharge(getOvercharge(estimatedFare, asked));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Yolculuk Özeti</Text>

      <View style={styles.summaryCard}>
        <Row label="Mesafe" value={`${distanceKm} km`} />
        <Row label="Süre" value={`${durationMin} dk`} />
        <Row label="Tahmini Ücret" value={`₺${estimatedFare}`} highlight />
      </View>

      {result === null ? (
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Taksici ne kadar istedi?</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Örn: 250"
            placeholderTextColor="#666"
            value={askedAmount}
            onChangeText={setAskedAmount}
            returnKeyType="done"
            onSubmitEditing={checkFare}
          />
          <TouchableOpacity
            style={[styles.checkButton, !askedAmount && styles.checkButtonDisabled]}
            onPress={checkFare}
            disabled={!askedAmount}
          >
            <Text style={styles.checkButtonText}>Kontrol Et</Text>
          </TouchableOpacity>
        </View>
      ) : result === 'scam' ? (
        <View style={[styles.resultCard, styles.scamCard]}>
          <Text style={styles.alarmIcon}>🚨</Text>
          <Text style={styles.scamTitle}>DOLANDIRILIYORSUNUZ!</Text>
          <Text style={styles.scamDetail}>
            Fazla ücret: ₺{overcharge.toFixed(0)}
          </Text>
          <Text style={styles.scamAdvice}>
            Taksimetreyi göstermesini isteyin veya reddedebilirsiniz.
            Şikayet: 153 (İstanbul Büyükşehir Belediyesi)
          </Text>
        </View>
      ) : (
        <View style={[styles.resultCard, styles.fairCard]}>
          <Text style={styles.alarmIcon}>✅</Text>
          <Text style={styles.fairTitle}>Ücret Normal</Text>
          <Text style={styles.fairDetail}>
            İstediği tutar tarife ile uyuşuyor.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.homeButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.homeButtonText}>Ana Sayfaya Dön</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  title: {
    color: '#F5A623',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0f3460',
  },
  rowLabel: {
    color: '#aaa',
    fontSize: 16,
  },
  rowValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rowValueHighlight: {
    color: '#F5A623',
    fontSize: 18,
  },
  inputCard: {
    backgroundColor: '#16213e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  checkButton: {
    backgroundColor: '#F5A623',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: '#444',
  },
  checkButtonText: {
    color: '#1a1a2e',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  scamCard: {
    backgroundColor: '#4a0000',
    borderWidth: 2,
    borderColor: '#e74c3c',
  },
  fairCard: {
    backgroundColor: '#003a1e',
    borderWidth: 2,
    borderColor: '#2ecc71',
  },
  alarmIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  scamTitle: {
    color: '#e74c3c',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  scamDetail: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 12,
  },
  scamAdvice: {
    color: '#ffb3b3',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fairTitle: {
    color: '#2ecc71',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  fairDetail: {
    color: '#aaa',
    fontSize: 16,
  },
  homeButton: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5A623',
  },
  homeButtonText: {
    color: '#F5A623',
    fontSize: 16,
    fontWeight: '600',
  },
});
