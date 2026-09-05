/**
 * Bjet Mobile - Individual Receipt Parser (Phase 7)
 * Parses single transaction receipts and UPI payment screenshots (JPEG/PNG/WebP or 1-page PDF).
 */

import {
  TransactionCandidate,
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

export class IndividualReceiptParser implements IDocumentParser {
  public name = 'IndividualReceiptParser';

  public canParse(rawText: string, metadata?: { pageCount?: number }): boolean {
    if (!rawText) return false;
    // Prefer individual receipt if 1 page or contains single receipt markers
    const isSinglePage = (metadata?.pageCount || 1) === 1;
    const hasReceiptMarkers =
      /paid\s+to\b/i.test(rawText) ||
      /payment\s+to\b/i.test(rawText) ||
      /tax\s+invoice\b/i.test(rawText) ||
      /bill\s+payment\b/i.test(rawText) ||
      /payment\s+successful\b/i.test(rawText) ||
      /order\s+#/i.test(rawText);

    return isSinglePage || hasReceiptMarkers;
  }

  public async parse(rawText: string): Promise<ParsedDocument> {
    const warnings: string[] = [];

    // 1. Amount Extraction
    // Look for patterns like: "₹ 450.00", "Total: INR 350.00", "Amount: 899.00", "₹80"
    let amount: number | undefined;
    const amountMatch =
      rawText.match(/(?:₹|INR|Rs\.?|Amount[:\s]+₹?|Total[:\s]+₹?)\s*([\d,]+(?:\.\d{1,2})?)/i) ||
      rawText.match(/₹\s*([\d,]+(?:\.\d{1,2})?)/);

    if (amountMatch) {
      amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    } else {
      warnings.push('Amount could not be identified from receipt text.');
    }

    // 2. Merchant Name Extraction
    let merchantRawName: string | undefined;
    const merchantMatch =
      rawText.match(/(?:Paid\s+to|Payment\s+to|To)\s+([^\n\r,]+)/i) ||
      rawText.match(/(?:Tax\s+Invoice|Order\s+#\d+[\s\S]*?Paid\s+to)\s+([^\n\r,]+)/i) ||
      rawText.match(/^([A-Z0-9\s&'-]{3,40})(?:\r?\n|$)/m);

    if (merchantMatch && merchantMatch[1]) {
      const clean = merchantMatch[1].replace(/UPI\s+Ref.*/i, '').trim();
      if (clean.length > 1 && !/^(?:PhonePe|Google Pay|Paytm|Amazon Pay)$/i.test(clean)) {
        merchantRawName = clean;
      }
    }

    if (!merchantRawName) {
      // Fallback: search for first non-app line
      const lines = rawText
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 2 && !/^(?:phonepe|google pay|paytm|bhim|success|paid|receipt)/i.test(l));
      if (lines.length > 0) {
        merchantRawName = lines[0];
      } else {
        warnings.push('Merchant name could not be confidently determined.');
      }
    }

    // 3. Date & Time Extraction
    let timestamp: string | undefined;
    // Format A: "15 Aug 2026" or "15 Aug, 2026"
    const dateTextMatch = rawText.match(
      /(\d{1,2})\s+([A-Za-z]{3,9}),?\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i
    );
    // Format B: "28/08/2026" or "28-08-2026"
    const dateNumMatch = rawText.match(
      /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2})\s*(AM|PM)?)?/i
    );

    if (dateTextMatch) {
      const day = parseInt(dateTextMatch[1], 10);
      const monthStr = dateTextMatch[2].slice(0, 3).toLowerCase();
      const year = parseInt(dateTextMatch[3], 10);
      let hour = dateTextMatch[4] ? parseInt(dateTextMatch[4], 10) : 12;
      const minute = dateTextMatch[5] ? parseInt(dateTextMatch[5], 10) : 0;
      const ampm = dateTextMatch[6]?.toUpperCase();

      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;

      const month = MONTH_MAP[monthStr] || '01';
      timestamp = `${year}-${month}-${String(day).padStart(2, '0')}T${String(
        hour
      ).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;
    } else if (dateNumMatch) {
      const day = parseInt(dateNumMatch[1], 10);
      const month = String(parseInt(dateNumMatch[2], 10)).padStart(2, '0');
      let year = parseInt(dateNumMatch[3], 10);
      if (year < 100) year += 2000;
      let hour = dateNumMatch[4] ? parseInt(dateNumMatch[4], 10) : 12;
      const minute = dateNumMatch[5] ? parseInt(dateNumMatch[5], 10) : 0;
      const ampm = dateNumMatch[6]?.toUpperCase();

      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;

      timestamp = `${year}-${month}-${String(day).padStart(2, '0')}T${String(
        hour
      ).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`;
    } else {
      warnings.push('Date could not be confidently identified from receipt.');
    }

    // 4. UPI Transaction ID / UTR (exact 12-digit string)
    let transactionReference: string | undefined;
    const upiMatch =
      rawText.match(/(?:UPI\s*(?:Transaction\s*)?ID|UTR|Ref\s*No)[:\s]+([0-9]{12})/i) ||
      rawText.match(/\b([0-9]{12})\b/);

    if (upiMatch) {
      transactionReference = upiMatch[1];
    }

    // 5. UPI VPA (e.g. merchant@icici)
    let upiVpa: string | undefined;
    const vpaMatch = rawText.match(/([a-zA-Z0-9.\-_]{2,}@[a-zA-Z0-9]{2,})/);
    if (vpaMatch && !vpaMatch[1].includes('.com') && !vpaMatch[1].includes('.in')) {
      upiVpa = vpaMatch[1].toLowerCase();
    }

    // 6. Payment App Detection
    let paymentApp = 'UPI';
    if (/phonepe/i.test(rawText)) paymentApp = 'PhonePe';
    else if (/google\s*pay|gpay/i.test(rawText)) paymentApp = 'Google Pay';
    else if (/paytm/i.test(rawText)) paymentApp = 'Paytm';
    else if (/amazon\s*pay/i.test(rawText)) paymentApp = 'Amazon Pay';
    else if (/cred/i.test(rawText)) paymentApp = 'CRED';

    // 7. Direction
    const direction = /received\s+from/i.test(rawText) ? 'RECEIVED' : 'SENT';

    // 8. Confidence Assessment
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (amount !== undefined && merchantRawName && timestamp) {
      confidence = 'HIGH';
    } else if (amount !== undefined && (merchantRawName || timestamp)) {
      confidence = 'MEDIUM';
    }

    const reviewStatus =
      confidence === 'HIGH' ? 'READY_FOR_REVIEW' : 'NEEDS_ATTENTION';

    const candidate: TransactionCandidate = {
      localId: `cand_single_${Date.now()}`,
      merchantRawName,
      amount,
      currency: 'INR',
      timestamp,
      transactionReference,
      upiVpa,
      paymentApp,
      direction,
      confidence,
      warnings,
      sourcePage: 1,
      sourceText: rawText.slice(0, 500),
      reviewStatus,
      isExcluded: false,
    };

    return {
      candidates: [candidate],
      warnings,
    };
  }
}
