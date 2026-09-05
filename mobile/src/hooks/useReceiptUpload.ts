/**
 * Bjet Mobile - useReceiptUpload Hook
 * TanStack Query mutation hook for uploading receipts with best-effort progress tracking.
 * Invalidates transactions and budget summary caches upon successful creation.
 */
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadReceiptApi } from '../api/receipt';
import { ReceiptScanResponse } from '../types/api';
import { ReceiptFile } from '../types/receipt';

export function useReceiptUpload() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const mutation = useMutation<ReceiptScanResponse, Error, ReceiptFile>({
    mutationFn: (file: ReceiptFile) => {
      setUploadProgress(null);
      return uploadReceiptApi(file, (percent) => {
        setUploadProgress(percent);
      });
    },
    onSuccess: () => {
      setUploadProgress(100);
      // Invalidate transactions lists and budget summary caches
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets', 'summary'] });
    },
    onError: () => {
      setUploadProgress(null);
    },
  });

  const reset = useCallback(() => {
    setUploadProgress(null);
    mutation.reset();
  }, [mutation]);

  return {
    uploadReceipt: mutation.mutateAsync,
    isUploading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    result: mutation.data,
    uploadProgress,
    reset,
  };
}
