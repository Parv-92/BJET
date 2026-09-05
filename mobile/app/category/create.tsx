/**
 * Bjet Mobile - Create Category Screen (Phase 9)
 * Screen allowing users to create a new custom category.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { CategoryForm, CategoryFormData } from '../../src/components/categories/CategoryForm';
import { useCreateCategory } from '../../src/hooks/useCategoryMutations';
import { getApiErrorMessage } from '../../src/api/client';
import { colors } from '../../src/theme/colors';
import { spacing, radii } from '../../src/theme/spacing';
import { fontSizes, fontWeights } from '../../src/theme/typography';

export default function CreateCategoryScreen() {
  const router = useRouter();
  const createMutation = useCreateCategory();
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (data: CategoryFormData) => {
    setServerError(null);
    try {
      await createMutation.mutateAsync({
        name: data.name.trim(),
        icon: data.icon,
        color: data.color,
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
          <Text style={styles.title}>New Category</Text>
          <Text style={styles.subtitle}>Create a custom category for spending</Text>
        </View>
      </View>

      {/* Form */}
      <CategoryForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        submitButtonText="Create Category"
        onCancel={() => router.back()}
        serverError={serverError}
      />
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
});
