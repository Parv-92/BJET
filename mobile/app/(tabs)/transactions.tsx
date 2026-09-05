/**
 * Bjet Mobile - Transactions Screen
 * Main transactions list with status filter chips and manual creation trigger.
 * Filter chips (All / Confirmed / Pending Review / Manual) are LIST FILTERS only.
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, ReceiptText, SlidersHorizontal } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { TransactionCard } from '../../src/components/transactions/TransactionCard';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../src/components/common/EmptyState';
import { useTransactions } from '../../src/hooks/useTransactions';
import { TransactionStatus } from '../../src/types/api';
import { colors } from '../../src/theme/colors';
import { spacing } from '../../src/theme/spacing';
import { fontSizes, fontWeights } from '../../src/theme/typography';

type FilterTab = 'ALL' | 'CONFIRMED' | 'PENDING_CONFIRMATION' | 'MANUAL';

interface FilterOption {
  key: FilterTab;
  label: string;
  status?: TransactionStatus;
}

const FILTER_OPTIONS: FilterOption[] = [
  { key: 'ALL', label: 'All' },
  { key: 'CONFIRMED', label: 'Confirmed', status: 'CONFIRMED' },
  { key: 'PENDING_CONFIRMATION', label: 'Pending Review', status: 'PENDING_CONFIRMATION' },
  { key: 'MANUAL', label: 'Manual', status: 'MANUAL' },
];

export default function TransactionsScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('ALL');

  const activeStatus = useMemo(() => {
    const opt = FILTER_OPTIONS.find((f) => f.key === selectedFilter);
    return opt?.status;
  }, [selectedFilter]);

  const {
    data: transactions,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useTransactions(activeStatus ? { status: activeStatus } : undefined);

  const handleAddPress = () => {
    router.push('/transaction/create' as any);
  };

  return (
    <ScreenContainer scrollable={false}>
      {/* Header with Title and Add Button */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Transactions</Text>
          <Text style={styles.subtitle}>
            {transactions ? `${transactions.length} transactions` : 'Track and manage your spending'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddPress}
          activeOpacity={0.8}
        >
          <Plus color={colors.background} size={18} strokeWidth={2.5} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips - Read-only list filters */}
      <View style={styles.filterRow}>
        {FILTER_OPTIONS.map((filter) => {
          const isActive = selectedFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Transaction List / Loading / Empty State */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <LoadingSpinner size="large" label="Loading transactions..." />
        </View>
      ) : error ? (
        <EmptyState
          icon={<ReceiptText color={colors.danger} size={48} />}
          title="Failed to Load"
          description={error.message || 'Unable to load transactions.'}
          actionLabel="Retry"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={transactions || []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <TransactionCard transaction={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.brandLight}
              colors={[colors.brandLight]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={<ReceiptText color={colors.textMuted} size={48} />}
              title={
                selectedFilter === 'ALL'
                  ? 'No Transactions Yet'
                  : `No ${FILTER_OPTIONS.find((f) => f.key === selectedFilter)?.label} Transactions`
              }
              description={
                selectedFilter === 'ALL'
                  ? 'Tap "+ Add" to record your first transaction.'
                  : `No transactions match the "${FILTER_OPTIONS.find((f) => f.key === selectedFilter)?.label}" filter.`
              }
              actionLabel={selectedFilter === 'ALL' ? 'Add Transaction' : undefined}
              onAction={selectedFilter === 'ALL' ? handleAddPress : undefined}
            />
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSizes.xxxl,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: colors.background,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: colors.brandLight,
  },
  filterChipText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  filterChipTextActive: {
    color: colors.brandLight,
    fontWeight: fontWeights.bold,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
