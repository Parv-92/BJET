/**
 * Bjet Mobile - Image OCR Extractor (Phase 6)
 *
 * Performs OCR on image files (JPEG, PNG, WebP) using the pluggable OCR provider.
 * Normalizes extracted text, generates quality metrics, and classifies the document.
 */

import { ReceiptFile } from '../../../types/receipt';
import {
  CancellationToken,
  ExtractionProgress,
  ReceiptExtractionResult,
  ReceiptTextExtractor,
} from '../types';
import { IOcrProvider, MobileOcrProvider } from '../ocr/OcrProvider';
import { DocumentClassifier } from '../classification/DocumentClassifier';
import { computeTextMetrics, normalizeRawText } from '../normalization';

export class ImageOCRExtractor implements ReceiptTextExtractor {
  private ocrProvider: IOcrProvider;

  constructor(provider?: IOcrProvider) {
    this.ocrProvider = provider || new MobileOcrProvider();
  }

  public async extract(
    file: ReceiptFile,
    onProgress?: (progress: ExtractionProgress) => void,
    cancellationToken?: CancellationToken
  ): Promise<ReceiptExtractionResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    if (cancellationToken?.aborted) {
      throw new Error('Extraction cancelled by user.');
    }

    onProgress?.({
      step: 'preparing',
      message: 'Preparing image for OCR processing...',
    });

    if (!file.uri) {
      throw new Error('Image extraction failed: missing local file URI.');
    }

    onProgress?.({
      step: 'ocr',
      currentPage: 1,
      totalPages: 1,
      message: 'Running text recognition on image...',
    });

    const ocrResult = await this.ocrProvider.recognizeText(file.uri, cancellationToken);

    if (ocrResult.warnings && ocrResult.warnings.length > 0) {
      warnings.push(...ocrResult.warnings);
    }

    if (cancellationToken?.aborted) {
      throw new Error('Extraction cancelled by user.');
    }

    onProgress?.({
      step: 'classifying',
      message: 'Classifying document structure...',
    });

    const normalizedText = normalizeRawText(ocrResult.text || '');
    const metrics = computeTextMetrics(normalizedText);

    if (metrics.nonWhitespaceCharacterCount === 0) {
      warnings.push('No readable text could be recognized from the image.');
    }

    const documentType = DocumentClassifier.classify(normalizedText, {
      pageCount: 1,
      fileName: file.name,
      mimeType: file.mimeType,
    });

    onProgress?.({
      step: 'completed',
      message: 'Image extraction completed.',
    });

    return {
      rawText: normalizedText,
      extractionMethod: 'OCR',
      documentType,
      pageCount: 1,
      warnings,
      characterCount: metrics.characterCount,
      nonWhitespaceCharacterCount: metrics.nonWhitespaceCharacterCount,
      nonEmptyLineCount: metrics.nonEmptyLineCount,
      extractionDurationMs: Date.now() - startTime,
    };
  }
}
