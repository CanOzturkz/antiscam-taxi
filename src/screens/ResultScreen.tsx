import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { colors, radius, space, type, elevation } from '../theme';
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
  const insets = useSafeAreaInsets();
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
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
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
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxxl }]}
        keyboardShouldPersistTaps="handled"
      >
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
              style={[styles.checkBtn, !asked ? styles.checkBtnDisabled : elevation.cta]}
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
  content: { padding: space.xl },
  center: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: space.xl },
  muted: { ...type.body, color: colors.textMuted, marginBottom: space.xl, textAlign: 'center' },
  summaryCard: {
    backgroundColor: colors.surfaceDeep,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: space.xxl,
    alignItems: 'center',
    marginTop: space.sm,
    marginBottom: space.xl,
    ...elevation.raised,
  },
  summaryLabel: { ...type.sectionLabel, color: colors.textMuted, textTransform: 'uppercase' },
  summaryRange: { ...type.numericL, color: colors.accent, marginTop: space.sm },
  offline: { ...type.caption, color: colors.warning, marginTop: space.sm },
  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.xl,
    marginBottom: space.xl,
    ...elevation.card,
  },
  inputLabel: { ...type.bodyStrong, color: colors.text, marginBottom: space.lg, textAlign: 'center' },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    marginTop: space.lg,
    marginBottom: space.lg,
    paddingHorizontal: space.lg + 2,
  },
  amountSymbol: { ...type.numericM, color: colors.textMuted, marginRight: space.sm },
  input: { flex: 1, ...type.numericL, color: colors.text, paddingVertical: space.md + 2 },
  checkBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: space.xl,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnDisabled: { backgroundColor: colors.surfaceAlt, opacity: 0.6 },
  checkText: { ...type.button, color: colors.bg },
  homeBtn: {
    borderRadius: radius.md,
    paddingVertical: space.lg,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  homeText: { ...type.bodyStrong, color: colors.accent },
});
