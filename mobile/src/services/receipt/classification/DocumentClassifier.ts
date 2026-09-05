/**
 * Bjet Mobile - Document Classifier (Phase 6)
 * Classifies raw extracted text and document metadata into:
 * - TRANSACTION_STATEMENT
 * - INDIVIDUAL_RECEIPT
 * - UNKNOWN
 *
 * Requirements:
 * - Structural signals (multi-factor scoring).
 * - Must NOT be based on a fragile single exact phrase alone.
 * - Does NOT parse actual transaction records.
 * - Classification failure must NOT prevent text extraction (falls back to UNKNOWN).
 */

import { DocumentType } from '../types';

export interface ClassificationContext {
  pageCount?: number;
  fileName?: string;
  mimeType?: string;
}

export class DocumentClassifier {
  /**
   * Classify document based on extracted raw text and optional file/page context.
   */
  public static classify(text: string, context: ClassificationContext = {}): DocumentType {
    if (!text || text.trim().length === 0) {
      return 'UNKNOWN';
    }

    const lower = text.toLowerCase();
    let statementScore = 0;
    let receiptScore = 0;

    // --- Statement Signals ---
    // 1. Explicit statement phrasing
    if (/transaction\s+statement/i.test(text)) statementScore += 3;
    if (/statement\s+period/i.test(text) || /statement\s+for/i.test(text)) statementScore += 2;
    if (/account\s+statement/i.test(text)) statementScore += 3;

    // 2. Tabular/Header structural markers
    if (/date\s*&\s*time/i.test(text) || /date\s+and\s+time/i.test(text)) statementScore += 2;
    if (/transaction\s+details/i.test(text)) statementScore += 2;
    if (/sent\s*₹/i.test(text) || /received\s*₹/i.test(text)) statementScore += 2;
    if (/opening\s+balance/i.test(text) || /closing\s+balance/i.test(text)) statementScore += 2;
    if (/total\s+withdrawal/i.test(text) || /total\s+deposit/i.test(text)) statementScore += 2;

    // 3. Multi-page indicator in text ("Page X of Y")
    const pageOfMatches = text.match(/page\s+\d+\s+of\s+\d+/gi);
    if (pageOfMatches && pageOfMatches.length >= 1) {
      statementScore += 2;
    }

    // 4. Repeated transaction markers
    const upiIdMatches = text.match(/upi\s+(?:transaction\s+)?id[:\s]+[a-zA-Z0-9]+/gi);
    if (upiIdMatches && upiIdMatches.length > 1) {
      statementScore += Math.min(upiIdMatches.length, 4);
    }

    // 5. Repeated date patterns (e.g., "01 Aug, 2026" or "12/08/2026")
    const dateMatches = text.match(
      /\b\d{1,2}[\s/-]+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|[0-9]{2})[\s,/-]+\d{2,4}\b/gi
    );
    if (dateMatches && dateMatches.length >= 3) {
      statementScore += 2;
    }

    // 6. Page count context
    if (context.pageCount && context.pageCount > 1) {
      statementScore += 2;
    }

    // --- Individual Receipt Signals ---
    // 1. Single transaction markers
    if (/paid\s+to\b/i.test(text) && !/transaction\s+statement/i.test(text)) receiptScore += 2;
    if (/payment\s+to\b/i.test(text)) receiptScore += 2;
    if (/bill\s+payment\b/i.test(text)) receiptScore += 2;
    if (/payment\s+successful\b/i.test(text) || /paid\s+successfully\b/i.test(text)) receiptScore += 3;
    if (/tax\s+invoice\b/i.test(text) || /cash\s+receipt\b/i.test(text)) receiptScore += 2;
    if (/order\s+#\b/i.test(text) || /order\s+id\b/i.test(text)) receiptScore += 2;

    // 2. Single-item / single-amount context
    if (context.pageCount === 1) {
      receiptScore += 1;
    }

    // Scoring Decision:
    // Strong statement threshold: statementScore >= 3 and statementScore > receiptScore
    if (statementScore >= 3 && statementScore > receiptScore) {
      return 'TRANSACTION_STATEMENT';
    }

    // Strong individual receipt threshold: receiptScore >= 3 and receiptScore > statementScore
    if (receiptScore >= 3 && receiptScore > statementScore) {
      return 'INDIVIDUAL_RECEIPT';
    }

    // If ambiguous or low signals
    return 'UNKNOWN';
  }
}
