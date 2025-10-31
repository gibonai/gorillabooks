import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Transaction } from '../types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<Transaction[]>('/transactions');
      setTransactions(response.data);
      setError(null);
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to fetch transactions';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const createTransaction = async (transaction: Omit<Transaction, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await api.post<Transaction>('/transactions', transaction);
      setTransactions([response.data, ...transactions]);
      return response.data;
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create transaction';
      throw new Error(message);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`);
      setTransactions(transactions.filter(t => t._id !== id));
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to delete transaction';
      throw new Error(message);
    }
  };

  return {
    transactions,
    isLoading,
    error,
    createTransaction,
    deleteTransaction,
    refetch: fetchTransactions,
  };
}
