/**
 * Bjet Mobile - CategoryColorPicker Component (Phase 9)
 * Palette picker for selecting a category color from curated theme-harmonious hex values.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';

export const CURATED_CATEGORY_COLORS = [
  '#10B981', // Emerald (Bjet Brand)
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple / Violet
  '#EC4899', // Pink / Fuchsia
  '#F43F5E', // Rose / Crimson
  '#FF5722', // Deep Orange
  '#F59E0B', // Amber
  '#84CC16', // Lime
  '#14B8A6', // Teal
  '#64748B', // Slate / Grey
] as const;

interface CategoryColorPickerProps {
  selectedColor: string | null | undefined;
  onSelectColor: (colorHex: string) => void;
}

export const CategoryColorPicker: React.FC<CategoryColorPickerProps> = ({
  selectedColor,
  onSelectColor,
}) => {
  const activeColor = (selectedColor || CURATED_CATEGORY_COLORS[0]).toUpperCase();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Color</Text>
      <View style={styles.paletteRow}>
        {CURATED_CATEGORY_COLORS.map((hex) => {
          const isSelected = activeColor === hex.toUpperCase();
          return (
            <TouchableOpacity
              key={hex}
              style={[
                styles.colorCircle,
                { backgroundColor: hex },
                isSelected && styles.colorCircleSelected,
              ]}
              onPress={() => onSelectColor(hex)}
              accessibilityRole="button"
              accessibilityLabel={`Select color ${hex}`}
              activeOpacity={0.8}
            >
              {isSelected && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderColor: colors.text,
    transform: [{ scale: 1.1 }],
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
