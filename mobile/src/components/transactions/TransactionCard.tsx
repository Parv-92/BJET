/**
 * Bjet Mobile - TransactionCard
 * Interactive card representing a transaction item in lists.
 * Tapping navigates to detailed view /transaction/[id].
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowDownLeft, FileCheck, ChevronRight } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { TransactionStatusBadge } from './TransactionStatusBadge';
import { TransactionListItemResponse } from '../../types/api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';

interface TransactionCardProps {
  transaction: TransactionListItemResponse;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  const router = useRouter();

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `₹${num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const merchantName =
    transaction.merchant?.clean_name ||
    transaction.merchant_raw_name ||
    'Transaction';
  const categoryName = transaction.category?.name || 'Uncategorized';
  const categoryColor = transaction.category?.color || colors.textMuted;

  const handlePress = () => {
    router.push(`/transaction/${transaction.id}` as any);
  };

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
      <Card style={styles.card}>
        <View style={styles.leftContent}>
          <View
            style={[
              styles.categoryCircle,
              { backgroundColor: `${categoryColor}20` },
            ]}
          >
            <ArrowDownLeft color={categoryColor} size={18} />
          </View>

          <View style={styles.details}>
            <View style={styles.topRow}>
              <Text style={styles.merchantName} numberOfLines={1}>
                {merchantName}
              </Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={[styles.categoryBadge, { color: categoryColor }]} numberOfLines={1}>
                {categoryName}
              </Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.dateText}>{formatDate(transaction.timestamp)}</Text>
              {transaction.has_receipt && (
                <>
                  <Text style={styles.dot}>•</Text>
                  <FileCheck color={colors.brandLight} size={12} style={styles.receiptIcon} />
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.rightContent}>
          <Text style={styles.amountText}>{formatCurrency(transaction.amount)}</Text>
          <View style={styles.statusRow}>
            <TransactionStatusBadge status={transaction.status} size="sm" />
            <ChevronRight color={colors.textMuted} size={14} style={styles.chevron} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  categoryCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  details: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  merchantName: {
    color: colors.text,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  categoryBadge: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    maxWidth: 100,
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
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountText: {
    color: colors.text,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: 4,
  },
});

export default TransactionCard;
