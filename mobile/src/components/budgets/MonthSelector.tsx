/**
 * Bjet Mobile - MonthSelector Component (Phase 8)
 *
 * Allows smooth navigation between monthly budget periods.
 * Boundaries: Month 1–12, Year 2000–2100.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface MonthSelectorProps {
  month: number;
  year: number;
  onMonthChange: (month: number, year: number) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  month,
  year,
  onMonthChange,
}) => {
  const now = new Date();
  const currentCalMonth = now.getMonth() + 1;
  const currentCalYear = now.getFullYear();
  const isCurrentMonth = month === currentCalMonth && year === currentCalYear;

  const handlePrev = () => {
    if (month === 1) {
      if (year > 2000) {
        onMonthChange(12, year - 1);
      }
    } else {
      onMonthChange(month - 1, year);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      if (year < 2100) {
        onMonthChange(1, year + 1);
      }
    } else {
      onMonthChange(month + 1, year);
    }
  };

  const handleResetToCurrent = () => {
    onMonthChange(currentCalMonth, currentCalYear);
  };

  const monthName = MONTH_NAMES[month - 1] || `Month ${month}`;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={handlePrev}
        accessibilityLabel="Previous month"
        activeOpacity={0.7}
      >
        <ChevronLeft color={colors.text} size={20} />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <View style={styles.titleRow}>
          <Calendar color={colors.brandLight} size={16} />
          <Text style={styles.monthTitle}>
            {monthName} {year}
          </Text>
        </View>

        {!isCurrentMonth && (
          <TouchableOpacity
            style={styles.currentMonthBadge}
            onPress={handleResetToCurrent}
            activeOpacity={0.7}
          >
            <Text style={styles.currentMonthText}>Back to Current Month</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.navButton}
        onPress={handleNext}
        accessibilityLabel="Next month"
        activeOpacity={0.7}
      >
        <ChevronRight color={colors.text} size={20} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.md,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  monthTitle: {
    color: colors.text,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.bold,
  },
  currentMonthBadge: {
    marginTop: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
  },
  currentMonthText: {
    color: colors.brandLight,
    fontSize: 10,
    fontWeight: fontWeights.medium,
  },
});
