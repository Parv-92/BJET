/**
 * Bjet Mobile - Receipt Extraction Service (Phase 6 Coordinator)
 *
 * Orchestrates document classification, direct PDF extraction, quality heuristic
 * evaluation, and OCR fallback. Keeps extraction and parsing logic cleanly outside the UI.
 *
 * Requirements:
 * - Direct text extraction first for PDFs (no OCR for normal text PDFs).
 * - Multi-signal quality heuristic evaluation before deciding on OCR fallback.
 * - Image files routed to ImageOCRExtractor.
 * - Supports progress reporting and user cancellation.
 * - Zero transaction creation (POST /transactions forbidden in Phase 6).
 */

import { ReceiptFile } from '../../types/receipt';
import {
  CancellationToken,
  ExtractionProgress,
  ReceiptExtractionResult,
} from './types';
import { PdfTextExtractor } from './extractors/PdfTextExtractor';
import { PdfOCRExtractor } from './extractors/PdfOCRExtractor';
import { ImageOCRExtractor } from './extractors/ImageOCRExtractor';
import { evaluateTextQuality } from './qualityHeuristic';

export class ReceiptExtractionService {
  private pdfTextExtractor: PdfTextExtractor;
  private pdfOcrExtractor: PdfOCRExtractor;
  private imageOcrExtractor: ImageOCRExtractor;

  constructor(
    pdfTextExtractor?: PdfTextExtractor,
    pdfOcrExtractor?: PdfOCRExtractor,
    imageOcrExtractor?: ImageOCRExtractor
  ) {
    this.pdfTextExtractor = pdfTextExtractor || new PdfTextExtractor();
    this.pdfOcrExtractor = pdfOcrExtractor || new PdfOCRExtractor();
    this.imageOcrExtractor = imageOcrExtractor || new ImageOCRExtractor();
  }

  /**
   * Main entry point to extract text and classification metadata from a receipt or statement file.
   */
  public async extract(
    file: ReceiptFile,
    onProgress?: (progress: ExtractionProgress) => void,
    cancellationToken?: CancellationToken
  ): Promise<ReceiptExtractionResult> {
    if (!file || !file.uri) {
      throw new Error('Invalid file: Missing file reference or URI.');
    }

    if (cancellationToken?.aborted) {
      throw new Error('Extraction cancelled by user.');
    }

    const isPdf =
      file.mimeType === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      return this.extractFromPdf(file, onProgress, cancellationToken);
    } else {
      return this.extractFromImage(file, onProgress, cancellationToken);
    }
  }

  /**
   * Pipeline for PDF files: Direct text extraction -> Quality assessment -> OCR fallback if needed.
   */
  private async extractFromPdf(
    file: ReceiptFile,
    onProgress?: (progress: ExtractionProgress) => void,
    cancellationToken?: CancellationToken
  ): Promise<ReceiptExtractionResult> {
    // 1. Attempt direct text extraction
    let directResult: ReceiptExtractionResult;
    try {
      directResult = await this.pdfTextExtractor.extract(
        file,
        onProgress,
        cancellationToken
      );
    } catch (directErr: any) {
      // If direct PDF extraction threw due to cancellation, propagate cancellation
      if (cancellationToken?.aborted || /cancelled/i.test(directErr?.message || '')) {
        throw directErr;
      }

      // If direct parsing threw fatal error, attempt OCR fallback
      onProgress?.({
        step: 'ocr',
        message: 'Direct PDF parsing failed. Attempting OCR fallback...',
      });

      const ocrResult = await this.pdfOcrExtractor.extract(
        file,
        onProgress,
        cancellationToken
      );
      ocrResult.warnings.push(`Direct text extraction failed: ${directErr?.message || 'Unknown error'}`);
      return ocrResult;
    }

    // 2. Evaluate extraction quality using conservative multi-signal heuristic
    const quality = evaluateTextQuality(
      directResult.rawText,
      directResult.pageCount || 1
    );

    if (quality.isSufficient) {
      // Quality heuristic satisfied; direct text is complete and accurate
      return directResult;
    }

    // 3. Direct text insufficient; fall back to PDF OCR
    onProgress?.({
      step: 'ocr',
      message: `Direct text insufficient (${quality.reason}). Running OCR fallback...`,
    });

    const ocrFallbackResult = await this.pdfOcrExtractor.extract(
      file,
      onProgress,
      cancellationToken
    );

    ocrFallbackResult.warnings.push(
      `PDF text quality check triggered OCR fallback: ${quality.reason}`
    );

    return ocrFallbackResult;
  }

  /**
   * Pipeline for Image files (JPEG, PNG, WebP).
   */
  private async extractFromImage(
    file: ReceiptFile,
    onProgress?: (progress: ExtractionProgress) => void,
    cancellationToken?: CancellationToken
  ): Promise<ReceiptExtractionResult> {
    return this.imageOcrExtractor.extract(file, onProgress, cancellationToken);
  }
}
