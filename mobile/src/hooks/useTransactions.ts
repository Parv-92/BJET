/**
 * Bjet Mobile - useTransactions Hook
 * Provides query for listing transactions with optional filtering.
 */
import { useQuery } from '@tanstack/react-query';
import { getTransactionsApi, GetTransactionsParams } from '../api/transactions';
import { TransactionListItemResponse } from '../types/api';

export function useTransactions(params?: GetTransactionsParams) {
  return useQuery<TransactionListItemResponse[], Error>({
    queryKey: ['transactions', params],
    queryFn: () => getTransactionsApi(params),
    staleTime: 30 * 1000,
  });
}
