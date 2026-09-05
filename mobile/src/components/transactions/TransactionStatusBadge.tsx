/**
 * Bjet Mobile - TransactionStatusBadge
 * Read-only status indicator badge conforming to API Contract v0.3.0.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { TransactionStatus } from '../../types/api';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';

interface TransactionStatusBadgeProps {
  status: TransactionStatus;
  size?: 'sm' | 'md';
}

export const TransactionStatusBadge: React.FC<TransactionStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  let label = 'Unknown';
  let badgeStyle: ViewStyle = styles.manualBadge;
  let textStyle: TextStyle = styles.manualText;

  switch (status) {
    case 'CONFIRMED':
      label = 'Confirmed';
      badgeStyle = styles.confirmedBadge;
      textStyle = styles.confirmedText;
      break;
    case 'PENDING_CONFIRMATION':
      label = 'Pending Review';
      badgeStyle = styles.pendingBadge;
      textStyle = styles.pendingText;
      break;
    case 'MANUAL':
      label = 'Manual';
      badgeStyle = styles.manualBadge;
      textStyle = styles.manualText;
      break;
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badgeBase,
        badgeStyle,
        isSmall && styles.badgeSmall,
      ]}
    >
      <Text
        style={[
          styles.textBase,
          textStyle,
          isSmall && styles.textSmall,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeBase: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  textBase: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  textSmall: {
    fontSize: 10,
  },
  confirmedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  confirmedText: {
    color: colors.brandLight,
  },
  pendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  pendingText: {
    color: colors.warning,
  },
  manualBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  manualText: {
    color: colors.info,
  },
});

export default TransactionStatusBadge;
