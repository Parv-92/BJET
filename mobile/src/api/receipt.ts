/**
 * Bjet Mobile - Receipt Upload API Service
 * Conforming strictly to API Contract v0.3.0.
 * Uploads receipt file via POST /api/v1/transactions/scan-receipt.
 * Paths have strictly NO trailing slashes.
 */
import { apiClient } from './client';
import { ReceiptScanResponse } from '../types/api';
import { ReceiptFile, inferReceiptMimeType } from '../types/receipt';

/**
 * Stream receipt image/document to backend scan-receipt pipeline.
 * POST /api/v1/transactions/scan-receipt
 * Progress reporting is treated as best-effort.
 */
export async function uploadReceiptApi(
  file: ReceiptFile,
  onProgress?: (percent: number) => void
): Promise<ReceiptScanResponse> {
  const formData = new FormData();
  const mimeType = inferReceiptMimeType(file);

  const fallbackExt = mimeType === 'application/pdf' ? 'pdf' : 'jpg';
  const fileName = file.name || `receipt_${Date.now()}.${fallbackExt}`;

  // React Native compatible file attachment for FormData
  formData.append('file', {
    uri: file.uri,
    name: fileName,
    type: mimeType,
  } as any);

  const response = await apiClient.post<ReceiptScanResponse>(
    '/transactions/scan-receipt',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total && progressEvent.total > 0) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(Math.min(Math.max(percent, 0), 100));
        }
      },
    }
  );

  return response.data;
}
