/**
 * Bjet Mobile - Transaction Confirmation Hook (Phase 7)
 * Dedicated mutation for confirming PENDING_CONFIRMATION transactions via
 * POST /api/v1/transactions/{id}/confirm.
 * Transitions draft to CONFIRMED and invalidates transactions and budget caches.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { confirmTransactionApi } from '../api/transactions';
import { ReceiptConfirmRequest, TransactionDetailResponse } from '../types/api';

export function useConfirmTransaction() {
  const queryClient = useQueryClient();

  return useMutation<
    TransactionDetailResponse,
    Error,
    { id: number; data: ReceiptConfirmRequest }
  >({
    mutationFn: ({ id, data }) => confirmTransactionApi(id, data),
    onSuccess: (confirmedTx, { id }) => {
      // Invalidate queries so transactions list, transaction detail, and budgets are fresh
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions', id] });
      queryClient.invalidateQueries({ queryKey: ['budgets', 'summary'] });
      queryClient.setQueryData(['transactions', id], confirmedTx);
    },
  });
}
