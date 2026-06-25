import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, radius, space, type } from '../theme';

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
    const hasSub = !!opt.sublabel;
    return (
      <TouchableOpacity
        key={opt.id}
        style={[styles.item, hasSub ? styles.itemBox : styles.itemPill, active && styles.itemActive]}
        onPress={() => onSelect(opt.id)}
        activeOpacity={0.8}
      >
        <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
        {hasSub ? (
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
    gap: space.sm + 2,
  },
  item: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 92,
    minHeight: 48,
  },
  itemPill: {
    borderRadius: radius.pill,
  },
  itemBox: {
    borderRadius: radius.md,
  },
  itemActive: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  label: {
    ...type.body,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '800',
  },
  sublabel: {
    ...type.caption,
    color: colors.textFaint,
    marginTop: 2,
  },
  sublabelActive: {
    color: colors.text,
  },
});
