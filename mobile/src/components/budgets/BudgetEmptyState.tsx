/**
 * Bjet Mobile - BudgetEmptyState Component (Phase 8)
 *
 * Renders an informative empty state when no category budgets
 * exist for the selected month/year.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart, Plus } from 'lucide-react-native';
import { Button } from '../ui/Button';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';

interface BudgetEmptyStateProps {
  monthName: string;
  year: number;
  onAddBudget: () => void;
  noCategories?: boolean;
}

export const BudgetEmptyState: React.FC<BudgetEmptyStateProps> = ({
  monthName,
  year,
  onAddBudget,
  noCategories = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <PieChart color={colors.brandLight} size={40} />
      </View>

      <Text style={styles.title}>
        {noCategories ? 'No Categories Found' : `No Budgets for ${monthName} ${year}`}
      </Text>

      <Text style={styles.description}>
        {noCategories
          ? 'Categories are required to create budgets. Please make sure categories are accessible.'
          : `Set spending limits on your categories to track progress and prevent overspending in ${monthName}.`}
      </Text>

      {!noCategories && (
        <Button
          title="Add Category Budget"
          icon={<Plus color={colors.background} size={18} />}
          onPress={onAddBudget}
          variant="primary"
          style={styles.actionButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: spacing.lg,
  },
  actionButton: {
    minWidth: 200,
  },
});
