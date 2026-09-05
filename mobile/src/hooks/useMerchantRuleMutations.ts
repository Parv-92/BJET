/**
 * Bjet Mobile - useMerchantRuleMutations Hook (Phase 10)
 * Typed mutation hooks for Merchant Rules creation, replacement, and deletion.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createMerchantRuleApi,
  deleteMerchantRuleApi,
  replaceMerchantRuleApi,
} from '../api/rules';
import {
  UserMerchantRule,
  CreateMerchantRuleRequest,
  ReplaceMerchantRuleParams,
} from '../types/rules';

/**
 * Mutation hook to create a new merchant rule.
 * Invalidates ['rules'] cache.
 */
export function useCreateMerchantRule() {
  const queryClient = useQueryClient();

  return useMutation<UserMerchantRule, Error, CreateMerchantRuleRequest>({
    mutationFn: (data: CreateMerchantRuleRequest) => createMerchantRuleApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}

/**
 * Mutation hook for explicit delete-and-recreate replacement of an existing merchant rule.
 * Handles failure with restoration attempts.
 * Invalidates ['rules'] cache on completion.
 */
export function useReplaceMerchantRule() {
  const queryClient = useQueryClient();

  return useMutation<UserMerchantRule, Error, ReplaceMerchantRuleParams>({
    mutationFn: ({ originalRule, replacement }: ReplaceMerchantRuleParams) =>
      replaceMerchantRuleApi(originalRule, replacement),
    onSettled: () => {
      // Invalidate and refetch rules whether succeeded or failed to ensure cache reflects database truth
      queryClient.invalidateQueries({ queryKey: ['rules'] });
      queryClient.refetchQueries({ queryKey: ['rules'] });
    },
  });
}

/**
 * Mutation hook to delete a merchant rule.
 * Invalidates ['rules'] cache.
 */
export function useDeleteMerchantRule() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (id: number) => deleteMerchantRuleApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });
}
