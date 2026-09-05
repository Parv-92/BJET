/**
 * Bjet Mobile - Text Normalization & Extraction Metrics (Phase 6)
 *
 * Normalization Rules:
 * Allowed:
 * - trim leading/trailing whitespace
 * - normalize excessive consecutive horizontal whitespace
 * - preserve meaningful line breaks
 * - preserve document order
 * - preserve numbers, transaction IDs, currency values, dates, and times verbatim
 *
 * Forbidden:
 * - Do NOT convert amounts
 * - Do NOT rewrite merchant names
 * - Do NOT infer categories or transaction directions
 * - Do NOT merge transaction rows
 * - Do NOT remove UPI IDs or statement headers
 * - Do NOT fabricate missing text
 */

export interface TextMetrics {
  characterCount: number;
  nonWhitespaceCharacterCount: number;
  nonEmptyLineCount: number;
}

/**
 * Normalizes extracted raw text preserving structure, IDs, numbers, and currencies.
 */
export function normalizeRawText(text: string): string {
  if (!text) return '';

  return text
    // Replace Windows CRLF and CR with LF
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Replace non-breaking spaces with standard space
    .replace(/\u00A0/g, ' ')
    // Split into lines to normalize horizontal whitespace without losing line structure
    .split('\n')
    .map(line => {
      // Collapse multiple consecutive spaces/tabs into a single space, trim margins
      return line.replace(/[ \t]+/g, ' ').trim();
    })
    // Join lines
    .join('\n')
    // Collapse 3 or more consecutive newlines into 2
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Computes standard text metrics for quality heuristics and extraction reporting.
 */
export function computeTextMetrics(text: string): TextMetrics {
  if (!text) {
    return {
      characterCount: 0,
      nonWhitespaceCharacterCount: 0,
      nonEmptyLineCount: 0,
    };
  }

  const characterCount = text.length;
  const nonWhitespaceCharacterCount = text.replace(/\s+/g, '').length;
  const nonEmptyLineCount = text
    .split('\n')
    .filter(line => line.trim().length > 0).length;

  return {
    characterCount,
    nonWhitespaceCharacterCount,
    nonEmptyLineCount,
  };
}
