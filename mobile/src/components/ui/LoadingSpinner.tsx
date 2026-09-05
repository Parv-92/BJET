/**
 * Bjet Mobile - LoadingSpinner Primitive
 * Displays a branded activity indicator with an optional status label.
 */
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { fontSizes } from '../../theme/typography';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  label?: string;
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  label,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={colors.brand} />
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});

export default LoadingSpinner;
