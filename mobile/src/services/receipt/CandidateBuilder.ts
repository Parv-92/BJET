/**
 * Bjet Mobile - Candidate Builder (Phase 7)
 * Enriches transaction candidates with:
 * - Duplicate detection indicators against cached backend transactions.
 * - Advisory category suggestions evaluated against UserMerchantRules and Categories.
 * - In-batch duplicate detection (e.g. repeated UTRs in the same document).
 *
 * Requirements:
 * - Category suggestions are strictly advisory: SuggestedCategory != confirmed category.
 * - Candidates remain fully editable by the user.
 * - Authoritative business rules remain on the backend upon actual persistence.
 */

import {
  TransactionCandidate,
  DuplicateIndicator,
} from '../../types/receiptInterpretation';
import { Transaction, Category, TransactionListItemResponse } from '../../types/api';
import { UserMerchantRule } from '../../types/rules';

export interface EnrichmentContext {
  existingTransactions?: (Transaction | TransactionListItemResponse)[];
  userRules?: UserMerchantRule[];
  rules?: UserMerchantRule[];
  categories?: Category[];
}

export class CandidateBuilder {
  /**
   * Enriches raw parsed candidates with duplicate analysis and advisory category suggestions.
   */
  public static enrich(
    candidates: TransactionCandidate[],
    context: EnrichmentContext = {}
  ): TransactionCandidate[] {
    const existingTxs = context.existingTransactions || [];
    const userRules = context.userRules || context.rules || [];
    const categories = context.categories || [];

    // Map categories by ID for quick lookup
    const categoryMap = new Map<number, Category>();
    categories.forEach(c => categoryMap.set(c.id, c));

    // Fallback uncategorized category
    const uncategorizedCat = categories.find(
      c => c.name.toLowerCase() === 'uncategorized'
    );

    // Track UTR references inside this current statement batch
    const seenBatchUtrs = new Set<string>();

    return candidates.map(candidate => {
      const warnings = [...candidate.warnings];
      let duplicateInfo: DuplicateIndicator | undefined = candidate.duplicateInfo;
      let reviewStatus = candidate.reviewStatus;

      // -----------------------------------------------------------------
      // 1. Duplicate Detection (Authoritative check against existing records)
      // -----------------------------------------------------------------
      if (!duplicateInfo) {
        // A. Primary check: exact match on 12-digit UPI Reference ID (UTR)
        if (candidate.transactionReference) {
          const match = existingTxs.find(
            tx => tx.upi_reference_id === candidate.transactionReference
          );

          if (match) {
            duplicateInfo = {
              isDuplicate: true,
              existingTransactionId: match.id,
              reason: `A transaction with UPI Reference ID '${candidate.transactionReference}' already exists (#${match.id}).`,
            };
            reviewStatus = 'DUPLICATE_WARNING';
            warnings.push(`Duplicate: Matches existing transaction #${match.id}.`);
          } else if (seenBatchUtrs.has(candidate.transactionReference)) {
            // B. In-batch duplicate check: multiple rows with identical UTR in statement
            duplicateInfo = {
              isDuplicate: true,
              reason: `Duplicate UPI Reference ID '${candidate.transactionReference}' repeated within this statement.`,
            };
            reviewStatus = 'DUPLICATE_WARNING';
            warnings.push('Duplicate: Repeated UPI reference within statement.');
          } else {
            seenBatchUtrs.add(candidate.transactionReference);
          }
        }

        // C. Fallback check (only if UTR is missing or didn't match):
        // Matching amount, similar merchant, and timestamp within 24 hours
        if (!duplicateInfo && candidate.amount && candidate.amount > 0) {
          const candTime = candidate.timestamp
            ? new Date(candidate.timestamp).getTime()
            : Date.now();
          const windowMs = 24 * 60 * 60 * 1000;

          const similar = existingTxs.find(tx => {
            const txAmount = parseFloat(tx.amount);
            if (Math.abs(txAmount - candidate.amount!) > 0.01) return false;

            const txTime = new Date(tx.timestamp).getTime();
            if (Math.abs(txTime - candTime) > windowMs) return false;

            // Merchant comparison if available
            if (candidate.merchantRawName && tx.merchant_raw_name) {
              return (
                candidate.merchantRawName.toLowerCase().includes(tx.merchant_raw_name.toLowerCase()) ||
                tx.merchant_raw_name.toLowerCase().includes(candidate.merchantRawName.toLowerCase())
              );
            }
            return true;
          });

          if (similar) {
            duplicateInfo = {
              isDuplicate: true,
              existingTransactionId: similar.id,
              reason: `A similar transaction of ₹${candidate.amount} was already logged around this date (#${similar.id}).`,
            };
            reviewStatus = 'DUPLICATE_WARNING';
            warnings.push(`Possible duplicate of transaction #${similar.id}.`);
          }
        }
      }

      // -----------------------------------------------------------------
      // 2. Advisory Category Suggestion (Strictly Advisory)
      // -----------------------------------------------------------------
      let suggestedCategoryId: number | null = candidate.suggestedCategoryId || null;
      let suggestedCategoryName: string | null = candidate.suggestedCategoryName || null;

      if (!suggestedCategoryId) {
        const normMerchant = (candidate.merchantRawName || '').toUpperCase();
        const normVpa = (candidate.upiVpa || '').toUpperCase();

        // Check user rules (already sorted priority DESC, created_at DESC by backend)
        for (const rule of userRules) {
          const pattern = (rule.merchant_pattern || '').trim().toUpperCase();
          if (pattern) {
            const isMatch =
              (normMerchant && normMerchant.includes(pattern)) ||
              (normVpa && normVpa.includes(pattern));

            if (isMatch) {
              suggestedCategoryId = rule.category_id;
              suggestedCategoryName =
                rule.category?.name || categoryMap.get(rule.category_id)?.name || null;
              break;
            }
          }
        }

        // Fallback to Uncategorized if no rule matched
        if (!suggestedCategoryId && uncategorizedCat) {
          suggestedCategoryId = uncategorizedCat.id;
          suggestedCategoryName = uncategorizedCat.name;
        }
      }

      // Preserve any user-overridden selectedCategoryId, or default to advisory suggestion
      const selectedCategoryId =
        candidate.selectedCategoryId !== undefined
          ? candidate.selectedCategoryId
          : suggestedCategoryId;

      return {
        ...candidate,
        suggestedCategoryId,
        suggestedCategoryName,
        selectedCategoryId,
        duplicateInfo: duplicateInfo || { isDuplicate: false },
        reviewStatus,
        warnings,
      };
    });
  }
}
