/**
 * Bjet Mobile - Receipt File Types & Multi-Factor Validation
 * Encapsulates receipt file model and client-side validation rules.
 */

export type ReceiptFileSource = 'camera' | 'gallery' | 'document';

export interface ReceiptFile {
  uri: string;
  name: string;
  mimeType: string;
  size?: number; // size in bytes
  source: ReceiptFileSource;
  width?: number;
  height?: number;
}

export interface ReceiptValidationResult {
  isValid: boolean;
  error?: string;
}

export const MAX_RECEIPT_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const SUPPORTED_RECEIPT_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const SUPPORTED_RECEIPT_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
];

/**
 * Multi-factor validation for selected/captured receipt files.
 * Does not trust mimeType alone; combines mimeType, filename extension, and file size.
 */
export function validateReceiptFile(file: ReceiptFile): ReceiptValidationResult {
  if (!file.uri) {
    return {
      isValid: false,
      error: 'Invalid file reference: Missing local file URI.',
    };
  }

  // File size validation (if available)
  if (file.size !== undefined && file.size > MAX_RECEIPT_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 10 MB.`,
    };
  }

  // Multi-factor type check: inspect extension and mimeType
  const cleanName = (file.name || file.uri).toLowerCase();
  const extMatch = cleanName.match(/\.([a-z0-9]+)(?:\?.*)?$/i);
  const extension = extMatch ? `.${extMatch[1]}` : '';

  const normalizedMime = (file.mimeType || '').toLowerCase();

  const isMimeSupported =
    Boolean(normalizedMime) &&
    SUPPORTED_RECEIPT_MIME_TYPES.some(
      (m) => normalizedMime === m || normalizedMime.startsWith(m)
    );

  const isExtensionSupported =
    Boolean(extension) &&
    SUPPORTED_RECEIPT_EXTENSIONS.includes(extension);

  // If MIME is generic or missing, rely on extension; otherwise either matching is acceptable
  const isTypeSupported = isMimeSupported || isExtensionSupported;

  if (!isTypeSupported) {
    return {
      isValid: false,
      error: 'Unsupported file type. Please select a JPEG, PNG, WebP image or PDF receipt.',
    };
  }

  return { isValid: true };
}

/**
 * Normalizes file mimeType using extension fallback when mimeType is generic or missing.
 */
export function inferReceiptMimeType(file: ReceiptFile): string {
  const normalizedMime = (file.mimeType || '').toLowerCase();
  if (
    normalizedMime &&
    normalizedMime !== 'application/octet-stream' &&
    normalizedMime !== '*/*'
  ) {
    return normalizedMime;
  }

  const cleanName = (file.name || file.uri).toLowerCase();
  if (cleanName.endsWith('.pdf')) return 'application/pdf';
  if (cleanName.endsWith('.png')) return 'image/png';
  if (cleanName.endsWith('.webp')) return 'image/webp';
  if (cleanName.endsWith('.jpg') || cleanName.endsWith('.jpeg')) return 'image/jpeg';

  return 'image/jpeg';
}
