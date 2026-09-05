/**
 * Bjet Mobile - Text Quality Heuristic (Phase 6)
 *
 * Conservative multi-signal evaluation of extracted text quality:
 * Determines if a direct text extraction is sufficient or if OCR fallback is needed.
 *
 * Requirements:
 * - Does NOT use a naive single-line threshold (e.g. < 100 chars).
 * - Multi-signal evaluation:
 *   1. Non-whitespace character count.
 *   2. Non-empty line count.
 *   3. Alphanumeric character presence and ratio.
 *   4. Printable/readable character ratio (rejects corrupt/binary noise).
 * - Answers: "Does the PDF contain enough meaningful extracted text to reasonably represent its content?"
 * - Does NOT infer transaction semantics.
 */

export interface QualityAssessment {
  isSufficient: boolean;
  reason: string;
  metrics: {
    characterCount: number;
    nonWhitespaceCount: number;
    nonEmptyLineCount: number;
    alphanumericRatio: number;
    printableRatio: number;
  };
}

export function evaluateTextQuality(text: string, pageCount: number = 1): QualityAssessment {
  const clean = text ? text.trim() : '';

  if (!clean) {
    return {
      isSufficient: false,
      reason: 'Extracted text is empty.',
      metrics: {
        characterCount: 0,
        nonWhitespaceCount: 0,
        nonEmptyLineCount: 0,
        alphanumericRatio: 0,
        printableRatio: 0,
      },
    };
  }

  // Remove page header markers ("--- PAGE X ---") when evaluating text density
  const contentOnly = clean.replace(/---\s*PAGE\s+\d+\s*---/gi, '').trim();

  const characterCount = contentOnly.length;
  const nonWhitespaceMatches = contentOnly.match(/\S/g) || [];
  const nonWhitespaceCount = nonWhitespaceMatches.length;

  const lines = contentOnly.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const nonEmptyLineCount = lines.length;

  if (nonWhitespaceCount === 0 || nonEmptyLineCount === 0) {
    return {
      isSufficient: false,
      reason: 'No non-whitespace characters found outside page markers.',
      metrics: {
        characterCount,
        nonWhitespaceCount,
        nonEmptyLineCount,
        alphanumericRatio: 0,
        printableRatio: 0,
      },
    };
  }

  // Alphanumeric presence
  const alphanumericMatches = contentOnly.match(/[a-zA-Z0-9]/g) || [];
  const alphanumericCount = alphanumericMatches.length;
  const alphanumericRatio = alphanumericCount / nonWhitespaceCount;

  // Printable/readable characters (letters, numbers, punctuation, currencies like ₹, $, €, etc.)
  const printableMatches = contentOnly.match(/[\p{L}\p{N}\p{P}\p{S}\p{Z}]/gu) || [];
  const printableRatio = printableMatches.length / (characterCount || 1);

  // Minimum thresholds:
  // For a single page: at least 40 non-whitespace chars, at least 3 non-empty lines
  // For multi-page: minimum scales conservatively with pageCount
  const minNonWhitespace = Math.min(40 + (pageCount - 1) * 20, 150);
  const minLines = Math.min(2 + pageCount, 10);

  if (nonWhitespaceCount < minNonWhitespace) {
    return {
      isSufficient: false,
      reason: `Insufficient non-whitespace characters (${nonWhitespaceCount} < ${minNonWhitespace} expected).`,
      metrics: {
        characterCount,
        nonWhitespaceCount,
        nonEmptyLineCount,
        alphanumericRatio,
        printableRatio,
      },
    };
  }

  if (nonEmptyLineCount < minLines) {
    return {
      isSufficient: false,
      reason: `Insufficient non-empty lines (${nonEmptyLineCount} < ${minLines} expected).`,
      metrics: {
        characterCount,
        nonWhitespaceCount,
        nonEmptyLineCount,
        alphanumericRatio,
        printableRatio,
      },
    };
  }

  if (alphanumericRatio < 0.45) {
    return {
      isSufficient: false,
      reason: `Low alphanumeric ratio (${(alphanumericRatio * 100).toFixed(1)}% < 45%). Likely corrupt or non-textual symbols.`,
      metrics: {
        characterCount,
        nonWhitespaceCount,
        nonEmptyLineCount,
        alphanumericRatio,
        printableRatio,
      },
    };
  }

  if (printableRatio < 0.80) {
    return {
      isSufficient: false,
      reason: `Low printable ratio (${(printableRatio * 100).toFixed(1)}% < 80%). Contains control or binary characters.`,
      metrics: {
        characterCount,
        nonWhitespaceCount,
        nonEmptyLineCount,
        alphanumericRatio,
        printableRatio,
      },
    };
  }

  return {
    isSufficient: true,
    reason: 'Text satisfies quality heuristic: sufficient density, line count, and alphanumeric readability.',
    metrics: {
      characterCount,
      nonWhitespaceCount,
      nonEmptyLineCount,
      alphanumericRatio,
      printableRatio,
    },
  };
}
