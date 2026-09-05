/**
 * Bjet Mobile - Edit Category Screen (Phase 9)
 * Screen allowing users to update an existing user-owned category.
 * Protects system default categories from modification.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Lock } from 'lucide-react-native';
import { ScreenContainer } from '../../../src/components/common/ScreenContainer';
import { CategoryForm, CategoryFormData } from '../../../src/components/categories/CategoryForm';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../src/components/ui/ErrorMessage';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { useCategory } from '../../../src/hooks/useCategories';
import { useUpdateCategory } from '../../../src/hooks/useCategoryMutations';
import { getApiErrorMessage } from '../../../src/api/client';
import { colors } from '../../../src/theme/colors';
import { spacing, radii } from '../../../src/theme/spacing';
import { fontSizes, fontWeights } from '../../../src/theme/typography';

export default function EditCategoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const categoryId = parseInt(id || '', 10);

  const { data: category, isLoading, error, refetch } = useCategory(categoryId);
  const updateMutation = useUpdateCategory();
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (data: CategoryFormData) => {
    if (!category) return;

    if (category.is_system_default) {
      setServerError('System default categories cannot be modified.');
      return;
    }

    setServerError(null);
    try {
      await updateMutation.mutateAsync({
        id: category.id,
        data: {
          name: data.name.trim(),
          icon: data.icon,
          color: data.color,
        },
      });
      router.back();
    } catch (err: unknown) {
      const message = getApiErrorMessage(err);
      setServerError(message);
    }
  };

  return (
    <ScreenContainer scrollable={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Cancel and go back"
        >
          <ChevronLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Edit Category</Text>
          <Text style={styles.subtitle}>Update category name, icon, or color</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <LoadingSpinner size="large" label="Loading category..." />
        </View>
      ) : error || !category ? (
        <View style={styles.centerContainer}>
          <ErrorMessage
            message={error ? getApiErrorMessage(error) : 'Category not found.'}
            onRetry={() => refetch()}
          />
        </View>
      ) : category.is_system_default ? (
        /* System Default Protection View */
        <View style={styles.protectedContainer}>
          <Card style={styles.protectedCard}>
            <View style={styles.protectedIconWrapper}>
              <Lock size={28} color={colors.warning} />
            </View>
            <Text style={styles.protectedTitle}>System Category</Text>
            <Text style={styles.protectedDescription}>
              "{category.name}" is a system default category. System defaults are shared resources and cannot be renamed, edited, or deleted.
            </Text>
            <Button
              title="Return to Categories"
              onPress={() => router.back()}
              variant="outline"
              style={styles.returnButton}
            />
          </Card>
        </View>
      ) : (
        /* User-owned category edit form */
        <CategoryForm
          initialValues={{
            name: category.name,
            icon: category.icon || 'tag',
            color: category.color || colors.brand,
          }}
          onSubmit={handleSubmit}
          isLoading={updateMutation.isPending}
          submitButtonText="Save Changes"
          onCancel={() => router.back()}
          serverError={serverError}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
  },
  title: {
    color: colors.text,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  protectedContainer: {
    paddingTop: spacing.xl,
  },
  protectedCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surfaceElevated,
  },
  protectedIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  protectedTitle: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    marginBottom: spacing.xs,
  },
  protectedDescription: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  returnButton: {
    width: '100%',
  },
});
