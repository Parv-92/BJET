/**
 * Bjet Mobile - CategoryBudgetRow
 * Displays category name, color pill, limit, spent, and individual utilization.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';
import { BudgetSummary } from '../../types/api';

interface CategoryBudgetRowProps {
  item: BudgetSummary;
}

export const CategoryBudgetRow: React.FC<CategoryBudgetRowProps> = ({ item }) => {
  const categoryName = item.category?.name || `Category #${item.category_id}`;
  const categoryColor = item.category?.color || colors.brand;
  const spent = parseFloat(item.spent_amount) || 0;
  const limit = parseFloat(item.amount_limit) || 0;
  const percentage = Math.min(100, Math.max(0, item.percentage_used));

  const formatCurrency = (val: number) => {
    return `₹${val.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.nameRow}>
          <View style={[styles.colorDot, { backgroundColor: categoryColor }]} />
          <Text style={styles.categoryName} numberOfLines={1}>
            {categoryName}
          </Text>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.spentText}>{formatCurrency(spent)}</Text>
          <Text style={styles.limitText}> / {formatCurrency(limit)}</Text>
        </View>
      </View>

      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${percentage}%`,
              backgroundColor: item.is_over_budget ? colors.danger : categoryColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  categoryName: {
    color: colors.text,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  spentText: {
    color: colors.text,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  limitText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radii.full,
  },
});

export default CategoryBudgetRow;
