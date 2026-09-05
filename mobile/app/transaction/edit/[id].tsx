/**
 * Bjet Mobile - Edit Transaction Screen
 * Allows editing amount, merchant name, category, and notes.
 * Does NOT allow changing transaction status (generic PUT lifecycle protection).
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ChevronRight, ReceiptText } from 'lucide-react-native';
import { ScreenContainer } from '../../../src/components/common/ScreenContainer';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { ErrorMessage } from '../../../src/components/ui/ErrorMessage';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { EmptyState } from '../../../src/components/common/EmptyState';
import { CategoryPickerModal } from '../../../src/components/transactions/CategoryPickerModal';
import { useTransaction } from '../../../src/hooks/useTransaction';
import { useUpdateTransaction } from '../../../src/hooks/useTransactionMutations';
import { useCategories } from '../../../src/hooks/useCategories';
import { colors } from '../../../src/theme/colors';
import { spacing } from '../../../src/theme/spacing';
import { fontSizes, fontWeights } from '../../../src/theme/typography';

const editTransactionSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be greater than 0',
    }),
  merchant_raw_name: z.string().optional(),
  category_id: z.number().nullable().optional(),
  notes: z.string().optional(),
});

type EditTransactionFormData = z.infer<typeof editTransactionSchema>;

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const transactionId = Number(id);

  const { data: tx, isLoading, error: fetchError } = useTransaction(transactionId);
  const updateMutation = useUpdateTransaction();
  const { data: categories } = useCategories();

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditTransactionFormData>({
    resolver: zodResolver(editTransactionSchema),
    defaultValues: {
      amount: '',
      merchant_raw_name: '',
      category_id: null,
      notes: '',
    },
  });

  // Populate form with existing transaction data
  useEffect(() => {
    if (tx) {
      reset({
        amount: typeof tx.amount === 'string' ? parseFloat(tx.amount).toString() : String(tx.amount),
        merchant_raw_name: tx.merchant_raw_name || tx.merchant?.name || '',
        category_id: tx.category_id || (tx.category ? tx.category.id : null),
        notes: tx.notes || '',
      });
    }
  }, [tx, reset]);

  const selectedCategoryId = watch('category_id');
  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);

  const onSubmit = async (values: EditTransactionFormData) => {
    setApiError(null);
    try {
      await updateMutation.mutateAsync({
        id: transactionId,
        data: {
          amount: parseFloat(values.amount),
          merchant_raw_name: values.merchant_raw_name?.trim() || null,
          category_id: values.category_id !== undefined ? values.category_id : null,
          notes: values.notes?.trim() || null,
        },
      });
      router.back();
    } catch (err: any) {
      setApiError(err?.message || 'Failed to update transaction.');
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.centerContainer}>
          <LoadingSpinner size="large" label="Loading transaction details..." />
        </View>
      </ScreenContainer>
    );
  }

  if (fetchError || !tx) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={colors.text} size={22} />
          </TouchableOpacity>
        </View>
        <EmptyState
          icon={<ReceiptText color={colors.danger} size={48} />}
          title="Transaction Not Found"
          description={fetchError?.message || 'Unable to load transaction.'}
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft color={colors.text} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Transaction</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>

        {apiError && (
          <ErrorMessage
            message={apiError}
            style={styles.errorBanner}
          />
        )}

        {/* Amount Input */}
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Amount (₹) *"
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.amount?.message}
            />
          )}
        />

        {/* Merchant Name */}
        <Controller
          control={control}
          name="merchant_raw_name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Merchant / Payee Name"
              placeholder="e.g. Swiggy, Uber, Amazon"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.merchant_raw_name?.message}
            />
          )}
        />

        {/* Category Picker Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Category</Text>
          <TouchableOpacity
            style={styles.categoryPickerButton}
            onPress={() => setCategoryModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.pickerLeft}>
              <View
                style={[
                  styles.categoryDot,
                  {
                    backgroundColor: selectedCategory?.color || colors.textMuted,
                  },
                ]}
              />
              <Text
                style={[
                  styles.pickerText,
                  !selectedCategory && styles.pickerPlaceholder,
                ]}
              >
                {selectedCategory?.name || 'Select Category'}
              </Text>
            </View>
            <ChevronRight color={colors.textMuted} size={18} />
          </TouchableOpacity>
        </View>

        {/* Notes */}
        <Controller
          control={control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Notes"
              placeholder="Add details, description, or memo"
              multiline
              numberOfLines={3}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              style={styles.textArea}
              containerStyle={styles.textAreaContainer}
              error={errors.notes?.message}
            />
          )}
        />

        {/* Save Button */}
        <Button
          title="Update Transaction"
          onPress={handleSubmit(onSubmit)}
          loading={updateMutation.isPending || isSubmitting}
          style={styles.submitButton}
        />

        {/* Category Picker Modal */}
        <CategoryPickerModal
          visible={categoryModalVisible}
          selectedCategoryId={selectedCategoryId}
          onSelect={(cat) => setValue('category_id', cat ? cat.id : null)}
          onClose={() => setCategoryModalVisible(false)}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  headerRightPlaceholder: {
    width: 28,
  },
  errorBanner: {
    marginBottom: spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    marginBottom: spacing.xs,
  },
  categoryPickerButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  pickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  pickerText: {
    color: colors.text,
    fontSize: fontSizes.base,
  },
  pickerPlaceholder: {
    color: colors.textMuted,
  },
  textAreaContainer: {
    marginBottom: spacing.md,
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
  submitButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
});
