/**
 * Bjet Mobile - CategoryForm Component (Phase 9)
 * Reusable form for creating and editing categories with React Hook Form and Zod.
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ErrorMessage } from '../ui/ErrorMessage';
import { CategoryIconPicker } from './CategoryIconPicker';
import { CategoryColorPicker, CURATED_CATEGORY_COLORS } from './CategoryColorPicker';
import { CategoryIcon } from './CategoryIcon';
import { colors } from '../../theme/colors';
import { spacing, radii } from '../../theme/spacing';
import { fontSizes, fontWeights } from '../../theme/typography';

const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be 100 characters or fewer')
    .refine((val) => val.trim().length > 0, 'Category name cannot be blank'),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  initialValues?: Partial<CategoryFormData>;
  onSubmit: (data: CategoryFormData) => void;
  isLoading: boolean;
  submitButtonText?: string;
  onCancel?: () => void;
  serverError?: string | null;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  initialValues,
  onSubmit,
  isLoading,
  submitButtonText = 'Save Category',
  onCancel,
  serverError,
}) => {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialValues?.name || '',
      icon: initialValues?.icon || 'tag',
      color: initialValues?.color || CURATED_CATEGORY_COLORS[0],
    },
  });

  const watchedName = watch('name');
  const watchedIcon = watch('icon') || 'tag';
  const watchedColor = watch('color') || CURATED_CATEGORY_COLORS[0];

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Server / API Error Banner */}
      {serverError ? (
        <View style={styles.errorWrapper}>
          <ErrorMessage message={serverError} />
        </View>
      ) : null}

      {/* Live Preview Card */}
      <Card style={styles.previewCard}>
        <Text style={styles.previewHeading}>Live Preview</Text>
        <View style={styles.previewRow}>
          <View
            style={[
              styles.previewIconWrapper,
              { backgroundColor: `${watchedColor}25`, borderColor: watchedColor },
            ]}
          >
            <CategoryIcon name={watchedIcon} size={24} color={watchedColor} />
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewName} numberOfLines={1}>
              {watchedName.trim() || 'Category Name'}
            </Text>
            <Text style={styles.previewSubtext}>Custom Category</Text>
          </View>
        </View>
      </Card>

      {/* Name Input */}
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Category Name *"
            placeholder="e.g. Online Subscriptions"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
            autoFocus={!initialValues?.name}
            maxLength={100}
            autoCapitalize="words"
          />
        )}
      />

      {/* Color Picker */}
      <Controller
        control={control}
        name="color"
        render={({ field: { value } }) => (
          <CategoryColorPicker
            selectedColor={value}
            onSelectColor={(colorHex) => setValue('color', colorHex, { shouldValidate: true })}
          />
        )}
      />

      {/* Icon Picker */}
      <Controller
        control={control}
        name="icon"
        render={({ field: { value } }) => (
          <CategoryIconPicker
            selectedIcon={value}
            onSelectIcon={(iconId) => setValue('icon', iconId, { shouldValidate: true })}
            activeColor={watchedColor}
          />
        )}
      />

      {/* Action Buttons */}
      <View style={styles.buttonsContainer}>
        <Button
          title={submitButtonText}
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
          style={styles.submitButton}
        />

        {onCancel && (
          <Button
            title="Cancel"
            onPress={onCancel}
            variant="ghost"
            disabled={isLoading}
            style={styles.cancelButton}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  errorWrapper: {
    marginBottom: spacing.md,
  },
  previewCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  previewHeading: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
  },
  previewSubtext: {
    color: colors.brandLight,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    marginTop: 2,
  },
  buttonsContainer: {
    marginTop: spacing.lg,
  },
  submitButton: {
    marginBottom: spacing.sm,
  },
  cancelButton: {
    borderColor: colors.border,
  },
});
