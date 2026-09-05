/**
 * Bjet Mobile - CategoryIconPicker Component (Phase 9)
 * Grid picker for selecting a category icon from a curated list of supported identifiers.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { CategoryIcon } from './CategoryIcon';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';

export const CURATED_CATEGORY_ICONS = [
  { id: 'utensils', label: 'Dining' },
  { id: 'coffee', label: 'Coffee' },
  { id: 'shopping-basket', label: 'Groceries' },
  { id: 'shopping-bag', label: 'Shopping' },
  { id: 'car', label: 'Transport' },
  { id: 'plane', label: 'Travel' },
  { id: 'bolt', label: 'Utilities' },
  { id: 'film', label: 'Movies' },
  { id: 'gamepad-2', label: 'Gaming' },
  { id: 'music', label: 'Music' },
  { id: 'heart', label: 'Health' },
  { id: 'graduation-cap', label: 'Education' },
  { id: 'sparkles', label: 'Beauty' },
  { id: 'briefcase', label: 'Work' },
  { id: 'wallet', label: 'Finance' },
  { id: 'credit-card', label: 'Cards' },
  { id: 'home', label: 'Home' },
  { id: 'gift', label: 'Gifts' },
  { id: 'phone', label: 'Phone' },
  { id: 'wrench', label: 'Services' },
  { id: 'wifi', label: 'Internet' },
  { id: 'tag', label: 'General' },
] as const;

interface CategoryIconPickerProps {
  selectedIcon: string | null | undefined;
  onSelectIcon: (iconId: string) => void;
  activeColor?: string | null;
}

export const CategoryIconPicker: React.FC<CategoryIconPickerProps> = ({
  selectedIcon,
  onSelectIcon,
  activeColor = colors.brand,
}) => {
  const currentColor = activeColor || colors.brand;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Icon</Text>
      <View style={styles.grid}>
        {CURATED_CATEGORY_ICONS.map((item) => {
          const isSelected = (selectedIcon || 'tag') === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.iconItem,
                isSelected && {
                  borderColor: currentColor,
                  backgroundColor: `${currentColor}20`,
                },
              ]}
              onPress={() => onSelectIcon(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${item.label} icon`}
              activeOpacity={0.7}
            >
              <CategoryIcon
                name={item.id}
                size={22}
                color={isSelected ? currentColor : colors.textSecondary}
              />
              <Text
                style={[
                  styles.iconLabel,
                  isSelected && { color: colors.text, fontWeight: fontWeights.semibold },
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  iconItem: {
    width: '23%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.xs,
  },
  iconLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
});
