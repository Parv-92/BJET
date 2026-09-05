/**
 * Bjet Mobile - PendingConfirmationsSection
 * Displays transactions requiring user confirmation (status: PENDING_CONFIRMATION).
 * Informational only in Phase 3; confirmation workflow is deferred to Phase 4.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Clock, Info, Receipt } from 'lucide-react-native';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';
import { TransactionListItemResponse } from '../../types/api';

interface PendingConfirmationsSectionProps {
  transactions: TransactionListItemResponse[];
}

export const PendingConfirmationsSection: React.FC<PendingConfirmationsSectionProps> = ({
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
          <Text style={styles.sectionTitle}>Pending Confirmations</Text>
        </View>
        <Card style={styles.emptyCard}>
          <Clock color={colors.textMuted} size={24} />
          <Text style={styles.emptyTitle}>All Caught Up</Text>
          <Text style={styles.emptySubtitle}>No pending receipts require confirmation.</Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Pending Confirmations</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{transactions.length}</Text>
          </View>
        </View>
      </View>

      <View style={styles.noticeBanner}>
        <Info color={colors.warning} size={16} style={styles.noticeIcon} />
        <Text style={styles.noticeText}>
          Pending receipt drafts are excluded from budget spending until confirmed (Phase 4).
        </Text>
      </View>

      {transactions.map((tx) => {
        const merchantName =
          tx.merchant?.clean_name || tx.merchant_raw_name || 'Receipt Transaction';
        const categoryName = tx.category?.name || 'Pending Review';

        return (
          <TouchableOpacity
            key={tx.id}
            activeOpacity={0.7}
            onPress={() => router.push(`/transaction/${tx.id}` as any)}
          >
            <Card style={styles.itemCard}>
              <View style={styles.itemLeft}>
                <View style={styles.iconCircle}>
                  <Receipt color={colors.warning} size={18} />
                </View>
                <View style={styles.textDetails}>
                  <Text style={styles.merchantName} numberOfLines={1}>
                    {merchantName}
                  </Text>
                  <View style={styles.subDetailsRow}>
                    <Text style={styles.categoryText}>{categoryName}</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.dateText}>{formatDate(tx.timestamp)}</Text>
                    {tx.payment_app && (
                      <>
                        <Text style={styles.dotSeparator}>•</Text>
                        <Text style={styles.appText}>{tx.payment_app}</Text>
                      </>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.amountContainer}>
                <Text style={styles.amountText}>{formatCurrency(tx.amount)}</Text>
                <Text style={styles.pendingTag}>DRAFT</Text>
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
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  countBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
  },
  countBadgeText: {
    color: colors.warning,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeIcon: {
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  noticeText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    lineHeight: 16,
    flex: 1,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(245, 158, 11, 0.2)',
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
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textDetails: {
    flex: 1,
  },
  merchantName: {
    color: colors.text,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    marginBottom: 2,
  },
  subDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    color: colors.warning,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  dotSeparator: {
    color: colors.textMuted,
    marginHorizontal: 4,
    fontSize: fontSizes.xs,
  },
  dateText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
  },
  appText: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amountText: {
    color: colors.text,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
  },
  pendingTag: {
    color: colors.warning,
    fontSize: 9,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
    marginTop: 2,
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
  },
});

export default PendingConfirmationsSection;
