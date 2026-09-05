/**
 * Bjet Mobile - Generic Statement Parser (Phase 7)
 * Fallback parser for non-Google Pay tabular statements.
 */

import {
  TransactionCandidate,
} from '../../../types/receiptInterpretation';
import { IDocumentParser, ParsedDocument } from './types';

export class GenericStatementParser implements IDocumentParser {
  public name = 'GenericStatementParser';

  public canParse(rawText: string, metadata?: { pageCount?: number }): boolean {
    if (!rawText) return false;
    const isMultiPage = (metadata?.pageCount || 1) > 1;
    const hasStatementMarkers =
      /account\s+statement/i.test(rawText) ||
      /statement\s+period/i.test(rawText) ||
      /transaction\s+history/i.test(rawText) ||
      /opening\s+balance/i.test(rawText);

    return isMultiPage || hasStatementMarkers;
  }

  public async parse(rawText: string): Promise<ParsedDocument> {
    const candidates: TransactionCandidate[] = [];
    const warnings: string[] = [];

    // Search for tabular lines with date and amount
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
    let counter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Date match (e.g. 15/08/2026 or 15-Aug-2026)
      const dateMatch = line.match(
        /\b(\d{1,2})[\s/-]+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2})[\s/-]+(\d{2,4})\b/i
      );
      // Amount match (e.g. ₹450.00 or 450.00)
      const amountMatch = line.match(/(?:₹|INR)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/);

      if (dateMatch && amountMatch) {
        const amountVal = parseFloat(amountMatch[1].replace(/,/g, ''));
        if (amountVal > 0 && amountVal < 10000000) {
          // Exclude header or balance lines
          if (!/balance|opening|closing|statement\s+period|total/i.test(line)) {
            const desc = line.replace(dateMatch[0], '').replace(amountMatch[0], '').replace(/₹/g, '').trim();
            const direction = /cr|credit|received/i.test(line) ? 'RECEIVED' : 'SENT';

            candidates.push({
              localId: `cand_gen_${counter++}`,
              merchantRawName: desc || 'Statement Transaction',
              amount: amountVal,
              currency: 'INR',
              direction,
              confidence: 'MEDIUM',
              warnings: ['Parsed via generic statement heuristics. Please verify details.'],
              reviewStatus: 'NEEDS_ATTENTION',
              isExcluded: false,
              sourceText: line,
            });
          }
        }
      }
    }

    if (candidates.length === 0) {
      warnings.push('Generic statement parser found no matching tabular rows.');
    }

    return {
      candidates,
      warnings,
    };
  }
}
