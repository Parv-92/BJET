/**
 * Bjet Mobile - Create Merchant Rule Screen (Phase 10)
 * Allows users to configure a new auto-categorization rule.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { ScreenContainer } from '../../src/components/common/ScreenContainer';
import { MerchantRuleForm, RuleFormData } from '../../src/components/rules/MerchantRuleForm';
import { useCreateMerchantRule } from '../../src/hooks/useMerchantRuleMutations';
import { getApiErrorMessage } from '../../src/api/client';
import { colors } from '../../src/theme/colors';
import { spacing, radii } from '../../src/theme/spacing';
import { fontSizes, fontWeights } from '../../src/theme/typography';

export default function CreateRuleScreen() {
  const router = useRouter();
  const createMutation = useCreateMerchantRule();
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (data: RuleFormData) => {
    setServerError(null);
    try {
      await createMutation.mutateAsync({
        merchant_pattern: data.merchant_pattern.trim(),
        category_id: data.category_id,
        priority: data.priority,
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
          <Text style={styles.title}>New Merchant Rule</Text>
          <Text style={styles.subtitle}>Map a merchant name to a category</Text>
        </View>
      </View>

      {/* Form */}
      <MerchantRuleForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
        submitButtonText="Create Rule"
        onCancel={() => router.back()}
        serverError={serverError}
        isEditing={false}
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
