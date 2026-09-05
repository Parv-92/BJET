/**
 * Bjet Mobile - RulePriorityInput Component (Phase 10)
 * Allows selecting rule evaluation priority (1-100) via quick preset chips or custom numeric input.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';

const PRIORITY_PRESETS = [
  { value: 10, label: '10 Normal' },
  { value: 50, label: '50 High' },
  { value: 80, label: '80 High+' },
  { value: 100, label: '100 Max' },
];

interface RulePriorityInputProps {
  value: number;
  onChange: (priority: number) => void;
  error?: string;
}

export const RulePriorityInput: React.FC<RulePriorityInputProps> = ({
  value,
  onChange,
  error,
}) => {
  const handleNumericChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    if (!cleaned) {
      onChange(1);
      return;
    }
    const num = parseInt(cleaned, 10);
    const clamped = Math.min(100, Math.max(1, num));
    onChange(clamped);
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Evaluation Priority (1–100)</Text>
        <Text style={styles.currentValueBadge}>Priority: {value}</Text>
      </View>

      {/* Quick Select Presets */}
      <View style={styles.presetsRow}>
        {PRIORITY_PRESETS.map((preset) => {
          const isSelected = value === preset.value;
          return (
            <TouchableOpacity
              key={preset.value}
              style={[
                styles.presetChip,
                isSelected && styles.presetChipSelected,
              ]}
              onPress={() => onChange(preset.value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Set priority to ${preset.label}`}
            >
              <Text
                style={[
                  styles.presetChipText,
                  isSelected && styles.presetChipTextSelected,
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom numeric input */}
      <View style={styles.inputRow}>
        <Text style={styles.inputPrefix}>Custom Value:</Text>
        <TextInput
          style={styles.numericInput}
          keyboardType="number-pad"
          value={value ? value.toString() : '1'}
          onChangeText={handleNumericChange}
          maxLength={3}
          placeholder="1-100"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <Text style={styles.caption}>
        Higher priority rules are evaluated first when multiple rules match a merchant.
      </Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
  currentValueBadge: {
    color: colors.brandLight,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  presetChip: {
    flex: 1,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetChipSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.brand,
  },
  presetChipText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  presetChipTextSelected: {
    color: colors.brandLight,
    fontWeight: fontWeights.bold,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  inputPrefix: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    marginRight: spacing.sm,
  },
  numericInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
  },
  caption: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
    lineHeight: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSizes.xs,
    marginTop: spacing.xs,
  },
});
