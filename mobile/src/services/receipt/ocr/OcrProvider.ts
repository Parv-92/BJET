/**
 * Bjet Mobile - OCR Provider Abstraction (Phase 6)
 *
 * Pluggable OCR interface separating the extraction coordinator from concrete
 * OCR engines (Google ML Kit on Android, vision frameworks, or pure-JS providers).
 *
 * Requirements:
 * - Compatible with Expo SDK 57 / React Native 0.86 / Android.
 * - Zero browser-only APIs (no window, document, or DOM canvas).
 * - Gracefully handles OCR initialization or page failures with structured warnings.
 */

import { CancellationToken } from '../types';

export interface OcrResult {
  text: string;
  confidence?: number;
  warnings?: string[];
}

export interface IOcrProvider {
  name: string;
  recognizeText(imageUri: string, cancellationToken?: CancellationToken): Promise<OcrResult>;
}

let expoTextExtractor: any = null;
try {
  // @ts-ignore
  expoTextExtractor = require('expo-text-extractor');
} catch {
  // Native module unavailable or running in pure JS test harness
}

/**
 * Mobile On-Device OCR Provider
 * Designed for Android / Expo SDK 57 architecture.
 * Integrates Google ML Kit Text Recognition via expo-text-extractor.
 * Safely accesses native text recognition capabilities if available in the runtime,
 * and provides robust, non-crashing fallback with descriptive warnings.
 */
export class MobileOcrProvider implements IOcrProvider {
  public name = 'MobileOcrProvider';

  public isSupported(): boolean {
    return !!(expoTextExtractor && expoTextExtractor.isSupported);
  }

  public async recognizeText(
    imageUri: string,
    cancellationToken?: CancellationToken
  ): Promise<OcrResult> {
    if (cancellationToken?.aborted) {
      throw new Error('OCR cancelled by user.');
    }

    if (!imageUri) {
      throw new Error('Cannot perform OCR: Image URI is empty or invalid.');
    }

    // 1. Primary: Real Google ML Kit Text Recognition via expo-text-extractor
    if (expoTextExtractor && typeof expoTextExtractor.extractTextFromImage === 'function') {
      try {
        const blocks: string[] = await expoTextExtractor.extractTextFromImage(imageUri);
        const text = (blocks || []).join('\n').trim();
        return {
          text,
          warnings: text.length === 0 ? ['OCR completed: No readable text detected in image.'] : [],
        };
      } catch (err: any) {
        if (cancellationToken?.aborted) {
          throw new Error('OCR cancelled by user.');
        }
        return {
          text: '',
          warnings: [`ML Kit text recognition error: ${err?.message || 'Processing failed'}`],
        };
      }
    }

    // 2. Secondary fallback: React Native NativeModules lookup
    try {
      const NativeModules = require('react-native').NativeModules;
      if (NativeModules && NativeModules.TextRecognitionModule) {
        const result = await NativeModules.TextRecognitionModule.recognize(imageUri);
        return {
          text: result?.text || '',
          warnings: [],
        };
      }
    } catch {
      // Native module not linked in this environment
    }

    // 3. Fallback when native binaries are not yet compiled
    return {
      text: '',
      warnings: [
        'On-device native OCR requires Android development build (npx expo run:android) with Google ML Kit.',
      ],
    };
  }
}
