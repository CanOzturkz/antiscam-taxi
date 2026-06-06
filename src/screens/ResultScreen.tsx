import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { colors, radius } from '../theme';
import Segmented, { type SegmentOption } from '../components/Segmented';
import ScamAlert from '../components/ScamAlert';
import { useFareStore } from '../store/useFareStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { useTripStore } from '../store/useTripStore';
import { assessFraud, type FraudAssessment } from '../utils/fraudEngine';
import { SUPPORTED_CURRENCIES, CURRENCY_META, type CurrencyCode } from '../utils/currency';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Result'>;

export default function ResultScreen() {
  const navigation = useNavigation<Nav>();
  const estimate = useFareStore((s) => s.estimate);
  const { selectedCurrency, setCurrency, rates, isLive } = useCurrencyStore();

  const [asked, setAsked] = useState('');
  const [assessment, setAssessment] = useState<FraudAssessment | null>(null);

  useEffect(() => {
    if (!assessment) return;
    const type =
      assessment.level === 'CRITICAL'
        ? Haptics.NotificationFeedbackType.Error
        : assessment.level === 'WARNING'
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Success;
    Haptics.notificationAsync(type);
  }, [assessment]);

  if (!estimate) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>No trip data. Please start a trip first.</Text>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.homeText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currencyOptions: SegmentOption[] = SUPPORTED_CURRENCIES.map((c) => ({
    id: c,
    label: CURRENCY_META[c].symbol,
    sublabel: c,
  }));

  const check = () => {
    const amount = parseFloat(asked.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;
    setAssessment(
      assessFraud({
        estimate,
        askedAmount: amount,
        askedCurrency: selectedCurrency,
        rates: rates ?? undefined,
      })
    );
  };

  const reset = () => {
    setAsked('');
    setAssessment(null);
    useTripStore.getState().reset();
    navigation.navigate('Home');
  };

  const symbol = CURRENCY_META[selectedCurrency].symbol;
  const askedDisplay = `${symbol}${asked || '0'}`;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Yasal taksimetre tahmini */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>LEGAL METER ESTIMATE</Text>
          <Text style={styles.summaryRange}>
            ₺{Math.round(estimate.min)} – ₺{Math.round(estimate.max)}
          </Text>
          {!isLive && <Text style={styles.offline}>⚠️ using offline exchange rates</Text>}
        </View>

        {assessment === null ? (
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>How much does the driver ask?</Text>

            <Segmented options={currencyOptions} selectedId={selectedCurrency} onSelect={(c) => setCurrency(c as CurrencyCode)} scroll />

            <View style={styles.amountRow}>
              <Text style={styles.amountSymbol}>{symbol}</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textFaint}
                value={asked}
                onChangeText={setAsked}
                returnKeyType="done"
                onSubmitEditing={check}
              />
            </View>

            <TouchableOpacity
              style={[styles.checkBtn, !asked && styles.checkBtnDisabled]}
              onPress={check}
              disabled={!asked}
              activeOpacity={0.85}
            >
              <Text style={styles.checkText}>CHECK</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScamAlert assessment={assessment} askedDisplay={askedDisplay} />
        )}

        <TouchableOpacity style={styles.homeBtn} onPress={reset} activeOpacity={0.85}>
          <Text style={styles.homeText}>{assessment ? 'New Trip' : 'Cancel'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: 20 },
  muted: { color: colors.textMuted, fontSize: 16, marginBottom: 20, textAlign: 'center' },
  summaryCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 20, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  summaryLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  summaryRange: { color: colors.accent, fontSize: 38, fontWeight: '900', marginTop: 6 },
  offline: { color: colors.warning, fontSize: 12, marginTop: 8 },
  inputCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 20, marginBottom: 20 },
  inputLabel: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  amountRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardDeep, borderRadius: radius.md, marginTop: 16, marginBottom: 16, paddingHorizontal: 16 },
  amountSymbol: { color: colors.text, fontSize: 28, fontWeight: '800', marginRight: 8 },
  input: { flex: 1, color: colors.text, fontSize: 32, fontWeight: '800', paddingVertical: 14 },
  checkBtn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 18, alignItems: 'center' },
  checkBtnDisabled: { backgroundColor: colors.textFaint },
  checkText: { color: colors.bg, fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  homeBtn: { borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.accent },
  homeText: { color: colors.accent, fontSize: 16, fontWeight: '700' },
});
