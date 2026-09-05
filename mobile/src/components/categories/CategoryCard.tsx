/**
 * Bjet Mobile - CategoryCard Component (Phase 9)
 * Renders a single category with icon, color indicator, name,
 * and appropriate action controls (Edit / Delete for custom, Read-only for system).
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Edit2, Trash2, Lock } from 'lucide-react-native';
import { Category } from '../../types/api';
import { CategoryIcon } from './CategoryIcon';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';

interface CategoryCardProps {
  category: Category;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  isDeleting?: boolean;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onEdit,
  onDelete,
  isDeleting = false,
}) => {
  const categoryColor = category.color || colors.brand;
  const isSystemDefault = category.is_system_default;

  return (
    <View style={styles.card}>
      <View style={styles.leftContent}>
        {/* Icon with colored background */}
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: `${categoryColor}25`, borderColor: categoryColor },
          ]}
        >
          <CategoryIcon name={category.icon} size={20} color={categoryColor} />
        </View>

        {/* Category Name & Badge */}
        <View style={styles.textContainer}>
          <Text style={styles.categoryName} numberOfLines={1}>
            {category.name}
          </Text>
          <View style={styles.badgeRow}>
            {isSystemDefault ? (
              <View style={styles.systemBadge}>
                <Lock size={10} color={colors.textMuted} style={styles.badgeIcon} />
                <Text style={styles.systemBadgeText}>System Default · Read-only</Text>
              </View>
            ) : (
              <View style={styles.customBadge}>
                <Text style={styles.customBadgeText}>Custom Category</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Action Controls */}
      <View style={styles.actionsContainer}>
        {!isSystemDefault ? (
          <View style={styles.actionButtonsRow}>
            {onEdit && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEdit(category)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${category.name}`}
              >
                <Edit2 size={18} color={colors.brandLight} />
              </TouchableOpacity>
            )}

            {onDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => onDelete(category)}
                disabled={isDeleting}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${category.name}`}
              >
                <Trash2 size={18} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyLabel}>Protected</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  categoryName: {
    color: colors.text,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    marginBottom: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  systemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.borderMuted,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  badgeIcon: {
    marginRight: 4,
  },
  systemBadgeText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  customBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  customBadgeText: {
    color: colors.brandLight,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  readOnlyContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
  },
  readOnlyLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
});
