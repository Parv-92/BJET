/**
 * Bjet Mobile - RecentTransactionsSection
 * Displays newest-first recent transactions conforming to API Contract v0.3.0.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, ReceiptText, FileCheck } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';
import { TransactionListItemResponse } from '../../types/api';

interface RecentTransactionsSectionProps {
  transactions: TransactionListItemResponse[];
}

export const RecentTransactionsSection: React.FC<RecentTransactionsSectionProps> = ({
  transactions,
}) => {
  const router = useRouter();
  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  if (transactions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>
        <Card style={styles.emptyCard}>
          <ReceiptText color={colors.textMuted} size={28} />
          <Text style={styles.emptyTitle}>No Transactions Yet</Text>
          <Text style={styles.emptySubtitle}>
            Transactions will appear here once you make payments or scan receipts.
          </Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <Text style={styles.subtitleCount}>{transactions.length} latest</Text>
      </View>

      {transactions.map((tx) => {
        const merchantName =
          tx.merchant?.clean_name || tx.merchant_raw_name || 'Transaction';
        const categoryName = tx.category?.name || 'Uncategorized';
        const categoryColor = tx.category?.color || colors.textMuted;

        return (
          <TouchableOpacity
            key={tx.id}
            activeOpacity={0.7}
            onPress={() => router.push(`/transaction/${tx.id}` as any)}
          >
            <Card style={styles.itemCard}>
              <View style={styles.itemLeft}>
                <View
                  style={[
                    styles.categoryCircle,
                    { backgroundColor: `${categoryColor}20` },
                  ]}
                >
                  <ArrowDownLeft color={categoryColor} size={18} />
                </View>

                <View style={styles.details}>
                  <Text style={styles.merchantName} numberOfLines={1}>
                    {merchantName}
                  </Text>
                  <View style={styles.metadataRow}>
                    <Text style={[styles.categoryBadge, { color: categoryColor }]}>
                      {categoryName}
                    </Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.dateText}>{formatDate(tx.timestamp)}</Text>
                    {tx.has_receipt && (
                      <>
                        <Text style={styles.dot}>•</Text>
                        <FileCheck color={colors.brandLight} size={12} style={styles.receiptIcon} />
                      </>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.amountContainer}>
                <Text style={styles.amountText}>{formatCurrency(tx.amount)}</Text>
              </View>
            </Card>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  subtitleCount: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  categoryCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  details: {
    flex: 1,
  },
  merchantName: {
    color: colors.text,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    marginBottom: 2,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  dot: {
    color: colors.textMuted,
    marginHorizontal: 4,
    fontSize: fontSizes.xs,
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
  },
  receiptIcon: {
    marginLeft: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    color: colors.text,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    marginTop: spacing.xs,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    maxWidth: 240,
  },
});

export default RecentTransactionsSection;
