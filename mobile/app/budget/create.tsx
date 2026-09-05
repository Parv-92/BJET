/**
 * Bjet Mobile - Create Budget Screen (Phase 8)
 *
 * Route: /budget/create?month={m}&year={y}
 *
 * Creates or upserts a category budget for a specific month and year.
 * Handles both 201 Created and 200 OK responses identically as success.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Tag,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { ErrorMessage } from '../../src/components/ui/ErrorMessage';
import { CategoryPickerModal } from '../../src/components/transactions/CategoryPickerModal';
import { useCategories } from '../../src/hooks/useCategories';
import { useBudgetSummary, useSetBudget } from '../../src/hooks/useBudgets';
import { getApiErrorMessage } from '../../src/api/client';
import { Category } from '../../src/types/api';
import { colors } from '../../src/theme/colors';
import { spacing, radii } from '../../src/theme/spacing';
import { fontSizes, fontWeights } from '../../src/theme/typography';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CreateBudgetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ month?: string; year?: string }>();

  const now = new Date();
  const month = params.month ? parseInt(params.month, 10) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year, 10) : now.getFullYear();

  const { data: categories } = useCategories();
  const { data: existingBudgets } = useBudgetSummary(month, year);
  const setBudgetMutation = useSetBudget();

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [amountStr, setAmountStr] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const monthName = MONTH_NAMES[month - 1] || `Month ${month}`;

  // Check if a budget already exists for this category in this month
  const existingBudget = selectedCategory && existingBudgets
    ? existingBudgets.find((b) => b.category_id === selectedCategory.id)
    : null;

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (!selectedCategory) {
      Alert.alert('Category Required', 'Please select a category for this budget.');
      return;
    }

    const numAmount = parseFloat(amountStr);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive budget limit.');
      return;
    }

    try {
      await setBudgetMutation.mutateAsync({
        category_id: selectedCategory.id,
        month,
        year,
        amount_limit: numAmount,
      });

      router.back();
    } catch (err: any) {
      setSubmitError(getApiErrorMessage(err));
    }
  };

  return (
    <ScreenContainer scrollable>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexOne}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <ArrowLeft color={colors.text} size={20} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.screenTitle}>Set Category Budget</Text>
            <Text style={styles.screenSubtitle}>
              {monthName} {year}
            </Text>
          </View>
        </View>

        {/* Error Banner */}
        {submitError && (
          <ErrorMessage message={submitError} style={styles.errorBanner} />
        )}

        {/* Form Card */}
        <Card style={styles.formCard}>
          {/* Target Month indicator */}
          <View style={styles.periodBanner}>
            <Calendar color={colors.brandLight} size={16} />
            <Text style={styles.periodText}>
              Budget period: <Text style={styles.periodHighlight}>{monthName} {year}</Text>
            </Text>
          </View>

          {/* Category Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category</Text>
            <TouchableOpacity
              style={styles.categoryPickerButton}
              onPress={() => setShowCategoryPicker(true)}
            >
              <View style={styles.categoryLeft}>
                {selectedCategory ? (
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: selectedCategory.color || colors.brand },
                    ]}
                  />
                ) : (
                  <Tag color={colors.textMuted} size={18} />
                )}
                <Text
                  style={[
                    styles.categoryPickerText,
                    !selectedCategory && styles.textPlaceholder,
                  ]}
                >
                  {selectedCategory ? selectedCategory.name : 'Select a Category'}
                </Text>
              </View>
              <Text style={styles.changeText}>Choose</Text>
            </TouchableOpacity>
          </View>

          {/* Upsert Notice if Category Already Has a Budget */}
          {existingBudget && (
            <View style={styles.upsertNotice}>
              <Info color={colors.info} size={16} />
              <Text style={styles.upsertNoticeText}>
                A budget already exists for this category (current limit: ₹
                {parseFloat(existingBudget.amount_limit).toLocaleString('en-IN')}).
                Saving will update the existing budget.
              </Text>
            </View>
          )}

          {/* Amount Limit Input */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Monthly Limit (₹)</Text>
            <TextInput
              style={[styles.input, styles.amountInput]}
              value={amountStr}
              onChangeText={setAmountStr}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
            />
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            title={
              setBudgetMutation.isPending
                ? 'Saving...'
                : existingBudget
                ? 'Update Budget Limit'
                : 'Save Budget'
            }
            icon={<CheckCircle2 color={colors.background} size={18} />}
            onPress={handleSubmit}
            disabled={setBudgetMutation.isPending}
            variant="primary"
            style={styles.fullWidth}
          />
          <Button
            title="Cancel"
            onPress={handleBack}
            variant="secondary"
            style={styles.fullWidth}
          />
        </View>

        {/* Category Picker Sheet */}
        <CategoryPickerModal
          visible={showCategoryPicker}
          selectedCategoryId={selectedCategory?.id}
          onSelect={(cat) => {
            setSelectedCategory(cat);
            // If existing budget exists for this category, pre-fill current limit
            if (cat && existingBudgets) {
              const b = existingBudgets.find((item) => item.category_id === cat.id);
              if (b) {
                setAmountStr(parseFloat(b.amount_limit).toString());
              }
            }
          }}
          onClose={() => setShowCategoryPicker(false)}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  backButton: {
    padding: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.full,
    marginRight: spacing.md,
  },
  headerTitleContainer: {
    flex: 1,
  },
  screenTitle: {
    color: colors.text,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
  },
  screenSubtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  errorBanner: {
    marginBottom: spacing.md,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  periodBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    backgroundColor: 'rgba(52, 211, 153, 0.08)',
    borderColor: 'rgba(52, 211, 153, 0.2)',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  periodText: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
  },
  periodHighlight: {
    color: colors.brandLight,
    fontWeight: fontWeights.semibold,
  },
  formGroup: {
    gap: spacing.xs,
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
  },
  categoryPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: radii.full,
    marginRight: spacing.sm,
  },
  categoryPickerText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSizes.base,
    marginLeft: spacing.xs,
  },
  textPlaceholder: {
    color: colors.textMuted,
  },
  changeText: {
    color: colors.brandLight,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
  },
  upsertNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.25)',
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  upsertNoticeText: {
    flex: 1,
    color: colors.info,
    fontSize: fontSizes.xs,
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    color: colors.text,
    fontSize: fontSizes.base,
  },
  amountInput: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.brandLight,
  },
  actionsContainer: {
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  fullWidth: {
    width: '100%',
  },
});
