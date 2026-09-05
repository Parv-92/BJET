/**
 * Bjet Mobile - Google Pay Statement Parser (Phase 7)
 *
 * Implements high-fidelity segmentation and parsing for multi-page Google Pay
 * transaction statements (such as the 11-page GPay statement from Phase 6).
 *
 * Requirements:
 * - Identifies individual transaction rows across page boundaries.
 * - Extracts Date, Time, Direction, Counterparty, UPI Transaction ID, and Amount.
 * - Explicitly models direction: SENT, RECEIVED, TOP_UP, UNKNOWN.
 * - Statement totals ('Sent ₹32,006', 'Received ₹16,971') remain statement metadata,
 *   and are NEVER imported as transaction candidates.
 * - Stores UPI Transaction IDs as exact strings (e.g. '621338418329').
 * - Preserves sourcePage and sourceText for review audit evidence.
 * - Isolates row failures so partial parsing succeeds.
 */

import {
  TransactionCandidate,
  StatementMetadata,
} from '../../../types/receiptInterpretation';
import { IDocumentParser, ParsedDocument } from './types';

const MONTH_MAP: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
};

export class GooglePayStatementParser implements IDocumentParser {
  public name = 'GooglePayStatementParser';

  public canParse(rawText: string): boolean {
    if (!rawText) return false;
    const isStatement =
      /transaction\s+statement/i.test(rawText) ||
      /statement\s+period/i.test(rawText);
    const hasGpaySignatures =
      /google\s+pay/i.test(rawText) ||
      /upi\s+lite/i.test(rawText) ||
      /paid\s+by\s+upi\s+lite/i.test(rawText) ||
      /date\s*&\s*time\s+transaction\s+details\s+amount/i.test(rawText);

    return isStatement && hasGpaySignatures;
  }

  public async parse(
    rawText: string,
    metadata?: { pageCount?: number; fileName?: string }
  ): Promise<ParsedDocument> {
    const candidates: TransactionCandidate[] = [];
    const warnings: string[] = [];

    // 1. Extract Statement-Level Summary Metadata
    const statementMetadata = this.extractStatementMetadata(rawText);

    // 2. Separate text into pages (using Phase 6 page boundaries '--- PAGE X ---' or full body)
    const pages = this.splitIntoPages(rawText);

    let localIdCounter = 1;

    for (const page of pages) {
      const pageText = page.text;

      // Locate table content: Skip summary headers up to 'Date & time   Transaction details   Amount'
      const tableHeaderIdx = pageText.search(
        /Date\s*&\s*time\s+Transaction\s+details\s+Amount/i
      );
      const tableBody = tableHeaderIdx !== -1 ? pageText.slice(tableHeaderIdx) : pageText;

      // Anchor transaction block boundaries:
      // Match explicit date & time: "01 Aug, 2026 \n11:22 AM"
      const anchorRegex =
        /(\d{1,2}\s+[A-Za-z]+,?\s+\d{4}\s*\n\s*\d{1,2}:\d{2}\s+(?:AM|PM))/g;
      let match: RegExpExecArray | null;
      const blockStarts: { index: number }[] = [];

      while ((match = anchorRegex.exec(tableBody)) !== null) {
        blockStarts.push({ index: match.index });
      }

      for (let i = 0; i < blockStarts.length; i++) {
        const start = blockStarts[i].index;
        const end =
          i + 1 < blockStarts.length ? blockStarts[i + 1].index : tableBody.length;
        const blockText = tableBody.slice(start, end).trim();

        try {
          const candidate = this.parseTransactionBlock(
            blockText,
            page.pageNumber,
            `cand_${localIdCounter++}`
          );

          if (candidate) {
            candidates.push(candidate);
          }
        } catch (err: any) {
          warnings.push(
            `Page ${page.pageNumber} row parse error: ${err?.message || 'Malformed transaction'}`
          );
        }
      }
    }

    if (candidates.length === 0) {
      warnings.push(
        'No transaction rows could be confidently segmented from statement.'
      );
    }

    return {
      candidates,
      statementMetadata,
      warnings,
    };
  }

  /**
   * Parses statement-level metadata (period, total sent/received).
   * Ensures these are NOT treated as transaction candidates.
   */
  private extractStatementMetadata(text: string): StatementMetadata {
    const meta: StatementMetadata = {};

    // Period e.g. "01 August 2026 - 31 August 2026"
    const periodMatch = text.match(
      /Transaction\s+statement\s+period\s*\n\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}\s*-\s*[0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/i
    );
    if (periodMatch) {
      const parts = periodMatch[1].split('-').map(s => s.trim());
      meta.periodStart = parts[0];
      meta.periodEnd = parts[1];
    }

    // Summary totals on Page 1: "Sent \n₹32,006", "Received \n₹16,971"
    const sentMatch = text.match(/Sent\s*\n\s*₹\s*([\d,]+(?:\.\d{2})?)/i);
    if (sentMatch) {
      meta.totalSentReported = parseFloat(sentMatch[1].replace(/,/g, ''));
    }

    const receivedMatch = text.match(/Received\s*\n\s*₹\s*([\d,]+(?:\.\d{2})?)/i);
    if (receivedMatch) {
      meta.totalReceivedReported = parseFloat(receivedMatch[1].replace(/,/g, ''));
    }

    // Account identifiers (email/phone)
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      meta.accountIdentifier = emailMatch[1];
    }

    return meta;
  }

  /**
   * Splits raw text by Phase 6 page boundaries '--- PAGE X ---'.
   */
  private splitIntoPages(rawText: string): { pageNumber: number; text: string }[] {
    const pageRegex = /---\s*PAGE\s+(\d+)\s*---/gi;
    const matches: { pageNum: number; index: number }[] = [];
    let m: RegExpExecArray | null;

    while ((m = pageRegex.exec(rawText)) !== null) {
      matches.push({ pageNum: parseInt(m[1], 10), index: m.index });
    }

    if (matches.length === 0) {
      return [{ pageNumber: 1, text: rawText }];
    }

    const pages: { pageNumber: number; text: string }[] = [];
    for (let i = 0; i < matches.length; i++) {
      const pageNum = matches[i].pageNum;
      const start = matches[i].index;
      const end = i + 1 < matches.length ? matches[i + 1].index : rawText.length;
      pages.push({
        pageNumber: pageNum,
        text: rawText.slice(start, end),
      });
    }

    return pages;
  }

  /**
   * Parses an individual transaction block into a strongly typed TransactionCandidate.
   */
  private parseTransactionBlock(
    blockText: string,
    pageNumber: number,
    localId: string
  ): TransactionCandidate | null {
    const warnings: string[] = [];

    // 1. Amount Extraction (e.g. ₹80, ₹2,217, ₹1,000)
    const amountMatch = blockText.match(/₹\s*([\d,]+(?:\.\d{1,2})?)/);
    const amount = amountMatch
      ? parseFloat(amountMatch[1].replace(/,/g, ''))
      : undefined;

    if (amount === undefined || isNaN(amount)) {
      warnings.push('Amount could not be detected in block.');
    }

    // 2. Timestamp Extraction (Date + Time)
    const dateTimeMatch = blockText.match(
      /(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})\s*\n\s*(\d{1,2}):(\d{2})\s+(AM|PM)/i
    );
    let timestamp: string | undefined;

    if (dateTimeMatch) {
      const day = parseInt(dateTimeMatch[1], 10);
      const monthStr = dateTimeMatch[2].slice(0, 3).toLowerCase();
      const year = parseInt(dateTimeMatch[3], 10);
      let hour = parseInt(dateTimeMatch[4], 10);
      const minute = parseInt(dateTimeMatch[5], 10);
      const ampm = dateTimeMatch[6].toUpperCase();

      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;

      const month = MONTH_MAP[monthStr] || '01';
      timestamp = `${year}-${month}-${String(day).padStart(2, '0')}T${String(
        hour
      ).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;
    } else {
      warnings.push('Date/time format ambiguous or not found.');
    }

    // 3. Direction & Counterparty Extraction
    // Check Top-up and Received from FIRST to avoid false positives with bank payment line
    let direction: 'SENT' | 'RECEIVED' | 'TOP_UP' | 'UNKNOWN' = 'UNKNOWN';
    let merchantRawName: string | undefined;

    if (/Top-up to UPI Lite/i.test(blockText)) {
      direction = 'TOP_UP';
      merchantRawName = 'UPI Lite Top-up';
      warnings.push('Internal wallet top-up transfer (not consumer expenditure).');
    } else if (/Received from/i.test(blockText)) {
      direction = 'RECEIVED';
      const m = blockText.match(/Received from\s*(.*?)(?:\n|UPI\s+Transaction)/is);
      const name = m && m[1] ? m[1].trim() : '';
      merchantRawName = name || 'Unknown Sender';
      warnings.push('Received funds / credit (not consumer expenditure).');
    } else if (/Paid to\s+/i.test(blockText)) {
      direction = 'SENT';
      const m = blockText.match(/Paid to\s+(.*?)(?:\n|UPI\s+Transaction)/is);
      merchantRawName = m && m[1] ? m[1].trim() : undefined;
    }

    if (!merchantRawName) {
      warnings.push('Counterparty or merchant name could not be identified.');
    }

    // 4. UPI Transaction ID Extraction (must remain exact string)
    const upiMatch = blockText.match(/UPI\s+Transaction\s+ID[:\s]+(\d+)/i);
    const transactionReference = upiMatch ? upiMatch[1].trim() : undefined;

    if (!transactionReference) {
      warnings.push('UPI Reference ID missing.');
    }

    // 5. Confidence Calculation
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (amount !== undefined && timestamp && transactionReference && merchantRawName) {
      confidence = 'HIGH';
    } else if (amount !== undefined && (timestamp || merchantRawName)) {
      confidence = 'MEDIUM';
    }

    const reviewStatus =
      confidence === 'HIGH' && direction === 'SENT'
        ? 'READY_FOR_REVIEW'
        : 'NEEDS_ATTENTION';

    return {
      localId,
      merchantRawName,
      amount,
      currency: 'INR',
      timestamp,
      transactionReference,
      paymentApp: 'Google Pay',
      direction,
      confidence,
      warnings,
      sourcePage: pageNumber,
      sourceText: blockText,
      reviewStatus,
      isExcluded: false,
    };
  }
}
