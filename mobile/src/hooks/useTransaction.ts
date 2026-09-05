/**
 * Bjet Mobile - useTransaction Hook
 * Fetches single transaction details strictly adhering to TransactionDetailResponse.
 */
import { useQuery } from '@tanstack/react-query';
import { getTransactionApi } from '../api/transactions';
import { TransactionDetailResponse } from '../types/api';

export function useTransaction(id: number) {
  return useQuery<TransactionDetailResponse, Error>({
    queryKey: ['transactions', id],
    queryFn: () => getTransactionApi(id),
    enabled: !!id && !isNaN(id) && id > 0,
    staleTime: 30 * 1000,
  });
}
