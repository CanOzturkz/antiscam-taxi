import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, radius } from '../theme';

export interface SegmentOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface Props {
  options: SegmentOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  scroll?: boolean;
}

export default function Segmented({ options, selectedId, onSelect, scroll }: Props) {
  const content = options.map((opt) => {
    const active = opt.id === selectedId;
    return (
      <TouchableOpacity
        key={opt.id}
        style={[styles.item, active && styles.itemActive]}
        onPress={() => onSelect(opt.id)}
        activeOpacity={0.8}
      >
        <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
        {opt.sublabel ? (
          <Text style={[styles.sublabel, active && styles.sublabelActive]}>{opt.sublabel}</Text>
        ) : null}
      </TouchableOpacity>
    );
  });

  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {content}
      </ScrollView>
    );
  }
  return <View style={styles.row}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  item: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 90,
  },
  itemActive: {
    borderColor: colors.accent,
    backgroundColor: colors.cardDeep,
  },
  label: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  labelActive: {
    color: colors.accent,
  },
  sublabel: {
    color: colors.textFaint,
    fontSize: 12,
    marginTop: 2,
  },
  sublabelActive: {
    color: colors.text,
  },
});
