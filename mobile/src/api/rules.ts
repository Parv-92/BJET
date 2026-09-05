/**
 * Bjet Mobile - Merchant Rules API (Phase 10)
 * Strictly conforms to API Contract v0.3.0 (/api/v1/rules).
 * Backend returns rules sorted by priority DESC, created_at DESC.
 */
import { apiClient, getApiErrorMessage } from './client';
import {
  UserMerchantRule,
  CreateMerchantRuleRequest,
  RuleReplacementError,
} from '../types/rules';

/**
 * Fetch all auto-categorization rules configured by the authenticated user.
 * GET /api/v1/rules
 */
export async function getMerchantRulesApi(): Promise<UserMerchantRule[]> {
  const response = await apiClient.get<UserMerchantRule[]>('/rules');
  return response.data;
}

/**
 * Create a new auto-categorization rule mapping a merchant text pattern to a category.
 * POST /api/v1/rules
 */
export async function createMerchantRuleApi(
  data: CreateMerchantRuleRequest
): Promise<UserMerchantRule> {
  const response = await apiClient.post<UserMerchantRule>('/rules', data);
  return response.data;
}

/**
 * Delete an auto-categorization rule owned by the user.
 * DELETE /api/v1/rules/{rule_id}
 */
export async function deleteMerchantRuleApi(id: number): Promise<void> {
  await apiClient.delete(`/rules/${id}`);
}

/**
 * Explicit delete-and-recreate replacement operation for editing rules.
 * The backend exposes GET, POST, and DELETE with NO PUT endpoint.
 *
 * Case 1 (Pattern unchanged): Must delete old rule first to clear uniqueness constraint,
 * then create replacement. If replacement fails, attempts immediate restoration of original.
 *
 * Case 2 (Pattern changed):
 * - POST replacement first.
 * - If POST fails: original remains untouched; report failure.
 * - If POST succeeds but DELETE original fails:
 *   - attempt to DELETE the newly created replacement to restore the original state;
 *   - if cleanup succeeds, report that replacement failed and original rule remains;
 *   - if cleanup fails, report that recovery could not be confirmed and refresh the rules list;
 *   - do not falsely report success.
 * - Preserve original and replacement rule data locally during the operation.
 */
export async function replaceMerchantRuleApi(
  originalRule: UserMerchantRule,
  replacement: CreateMerchantRuleRequest
): Promise<UserMerchantRule> {
  // Preserve original and replacement rule data locally throughout operation
  const preservedOriginal: UserMerchantRule = { ...originalRule };
  const preservedReplacement: CreateMerchantRuleRequest = { ...replacement };

  const normOriginal = preservedOriginal.merchant_pattern.trim().split(/\s+/).join(' ').toUpperCase();
  const normNew = preservedReplacement.merchant_pattern.trim().split(/\s+/).join(' ').toUpperCase();
  const isPatternSame = normOriginal === normNew;

  if (isPatternSame) {
    // 1. Delete original rule to clear unique (user_id, merchant_pattern) constraint
    await deleteMerchantRuleApi(preservedOriginal.id);

    try {
      // 2. Create replacement rule
      return await createMerchantRuleApi(preservedReplacement);
    } catch (creationError) {
      // 3. Replacement creation failed — attempt immediate restoration of original
      let originalRestored = false;
      try {
        await createMerchantRuleApi({
          merchant_pattern: preservedOriginal.merchant_pattern,
          category_id: preservedOriginal.category_id,
          priority: preservedOriginal.priority,
        });
        originalRestored = true;
      } catch {
        originalRestored = false;
      }

      if (originalRestored) {
        throw new RuleReplacementError(
          'Replacement failed and original rule was restored.',
          true,
          preservedOriginal,
          creationError
        );
      } else {
        throw new RuleReplacementError(
          'Replacement failed and recovery could not be confirmed. Please refresh your rules list.',
          false,
          preservedOriginal,
          creationError
        );
      }
    }
  } else {
    // 1. Pattern changed: POST replacement first so original remains untouched if creation fails
    let newRule: UserMerchantRule;
    try {
      newRule = await createMerchantRuleApi(preservedReplacement);
    } catch (creationError) {
      // If POST fails: original remains untouched; report failure
      const message = getApiErrorMessage(creationError);
      throw new RuleReplacementError(
        `Replacement failed: ${message}. Original rule remains untouched.`,
        true,
        preservedOriginal,
        creationError
      );
    }

    // 2. If POST succeeds, attempt to DELETE original
    try {
      await deleteMerchantRuleApi(preservedOriginal.id);
      return newRule;
    } catch (deleteError) {
      // POST replacement succeeded, but DELETE original failed!
      // Attempt to DELETE the newly created replacement to restore the original state
      let cleanupSucceeded = false;
      try {
        await deleteMerchantRuleApi(newRule.id);
        cleanupSucceeded = true;
      } catch {
        cleanupSucceeded = false;
      }

      if (cleanupSucceeded) {
        // Cleanup succeeded: report that replacement failed and original rule remains
        throw new RuleReplacementError(
          'Replacement failed and original rule remains.',
          true,
          preservedOriginal,
          deleteError
        );
      } else {
        // Cleanup failed: report that recovery could not be confirmed
        throw new RuleReplacementError(
          'Replacement failed and recovery could not be confirmed. Please refresh your rules list.',
          false,
          preservedOriginal,
          deleteError
        );
      }
    }
  }
}
