/**
 * Bjet Mobile - User Merchant Rule Types (Phase 10)
 * Strictly matching backend API Contract v0.3.0 schema.
 */

import { Category } from './api';

export interface UserMerchantRule {
  id: number;
  user_id: number;
  merchant_pattern: string;
  category_id: number;
  priority: number;
  created_at: string;
  updated_at: string;
  category: Category | null;
}

export interface CreateMerchantRuleRequest {
  merchant_pattern: string;
  category_id: number;
  priority?: number;
}

export interface ReplaceMerchantRuleParams {
  originalRule: UserMerchantRule;
  replacement: CreateMerchantRuleRequest;
}

export class RuleReplacementError extends Error {
  public readonly originalRestored: boolean;
  public readonly originalRule: UserMerchantRule;
  public readonly underlyingError: unknown;

  constructor(
    message: string,
    originalRestored: boolean,
    originalRule: UserMerchantRule,
    underlyingError: unknown
  ) {
    super(message);
    this.name = 'RuleReplacementError';
    this.originalRestored = originalRestored;
    this.originalRule = originalRule;
    this.underlyingError = underlyingError;
  }
}
