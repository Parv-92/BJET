/**
 * Bjet Mobile - Budgets Overview Screen (Phase 8)
 *
 * Route: /(tabs)/budgets
 *
 * Full budget management screen featuring:
 * - Monthly navigation with boundary checking
 * - Overall monthly spending vs limit aggregate card
 * - Category spending progress list with over-budget alerts
 * - Pull-to-refresh and TanStack Query caching
 * - Fast navigation to Add and Edit budget flows
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Wallet } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { MonthSelector } from '../../src/components/budgets/MonthSelector';
import { BudgetSummaryCard } from '../../src/components/budgets/BudgetSummaryCard';
import { CategoryBudgetCard } from '../../src/components/budgets/CategoryBudgetCard';
import { BudgetEmptyState } from '../../src/components/budgets/BudgetEmptyState';
import { useBudgetSummary } from '../../src/hooks/useBudgets';
import { useCategories } from '../../src/hooks/useCategories';
import { getApiErrorMessage } from '../../src/api/client';
import { BudgetSummary } from '../../src/types/api';
import { colors } from '../../src/theme/colors';
import { spacing, radii } from '../../src/theme/spacing';
import { fontSizes, fontWeights } from '../../src/theme/typography';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function BudgetsScreen() {
  const router = useRouter();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const {
    data: budgets,
    isLoading,
    isRefetching,
    isError,
    error,
    refetch,
  } = useBudgetSummary(selectedMonth, selectedYear);

  const { data: categories } = useCategories();

  // Compute aggregate metrics from authoritative backend summary records
  const {
    totalLimit,
    totalSpent,
    totalRemaining,
    utilizationPercentage,
    overBudgetCount,
  } = useMemo(() => {
    if (!budgets || budgets.length === 0) {
      return {
        totalLimit: 0,
        totalSpent: 0,
        totalRemaining: 0,
        utilizationPercentage: 0,
        overBudgetCount: 0,
      };
    }

    let limit = 0;
    let spent = 0;
    let overCount = 0;

    for (const b of budgets) {
      const bLimit = parseFloat(b.amount_limit) || 0;
      const bSpent = parseFloat(b.spent_amount) || 0;
      limit += bLimit;
      spent += bSpent;
      if (b.is_over_budget || bSpent > bLimit) {
        overCount++;
      }
    }

    const remaining = limit - spent;
    const utilization = limit > 0 ? (spent / limit) * 100 : 0;

    return {
      totalLimit: limit,
      totalSpent: spent,
      totalRemaining: remaining,
      utilizationPercentage: utilization,
      overBudgetCount: overCount,
    };
  }, [budgets]);

  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const handleAddBudget = () => {
    router.push({
      pathname: '/budget/create' as any,
      params: { month: selectedMonth, year: selectedYear },
    });
  };

  const handleEditBudget = (item: BudgetSummary) => {
    router.push({
      pathname: `/budget/edit/${item.category_id}` as any,
      params: { month: selectedMonth, year: selectedYear },
    });
  };

  const monthName = MONTH_NAMES[selectedMonth - 1] || `Month ${selectedMonth}`;

  if (isLoading && !isRefetching) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <LoadingSpinner size="large" label="Loading budgets..." />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      scrollable
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.brand}
          colors={[colors.brand]}
          progressBackgroundColor={colors.surfaceElevated}
        />
      }
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <View style={styles.brandRow}>
            <Wallet color={colors.brandLight} size={16} />
            <Text style={styles.brandTag}>BUDGET MANAGER</Text>
          </View>
          <Text style={styles.title}>Monthly Budgets</Text>
          <Text style={styles.subtitle}>
            Manage category limits and track expenditure
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddBudget}
          accessibilityLabel="Add category budget"
          activeOpacity={0.8}
        >
          <Plus color={colors.background} size={18} />
          <Text style={styles.addButtonText}>Add Budget</Text>
        </TouchableOpacity>
      </View>

      {/* Month Selector Bar */}
      <MonthSelector
        month={selectedMonth}
        year={selectedYear}
        onMonthChange={handleMonthChange}
      />

      {/* Error State Banner */}
      {isError && (
        <ErrorMessage
          message={error ? getApiErrorMessage(error) : 'Failed to load budgets. Please try again.'}
          onRetry={refetch}
          style={styles.errorBox}
        />
      )}

      {/* Overall Summary Card */}
      <BudgetSummaryCard
        totalLimit={totalLimit}
        totalSpent={totalSpent}
        totalRemaining={totalRemaining}
        utilizationPercentage={utilizationPercentage}
        overBudgetCount={overBudgetCount}
        budgetCount={budgets ? budgets.length : 0}
      />

      {/* Category Budgets Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Category Budgets</Text>
        {budgets && budgets.length > 0 && (
          <Text style={styles.sectionCount}>
            {budgets.length} {budgets.length === 1 ? 'category' : 'categories'}
          </Text>
        )}
      </View>

      {/* Category Budget List or Empty State */}
      {!budgets || budgets.length === 0 ? (
        <BudgetEmptyState
          monthName={monthName}
          year={selectedYear}
          onAddBudget={handleAddBudget}
          noCategories={categories !== undefined && categories.length === 0}
        />
      ) : (
        <View style={styles.categoryList}>
          {budgets.map((item) => (
            <CategoryBudgetCard
              key={item.id}
              item={item}
              onEdit={handleEditBudget}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  headerTitles: {
    flex: 1,
    marginRight: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  brandTag: {
    color: colors.brandLight,
    fontSize: 10,
    fontWeight: fontWeights.bold,
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: fontSizes.xxxl,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
  },
  addButtonText: {
    color: colors.background,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  errorBox: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
  },
  sectionCount: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
  },
  categoryList: {
    marginBottom: spacing.xxl,
  },
});
