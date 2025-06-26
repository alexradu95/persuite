'use client';

import { useState, useCallback, useMemo } from 'react';
import { 
  Contract, 
  CreateContract, 
  UpdateContract,
  WorkDayEntry, 
  CreateWorkDayEntry, 
  UpdateWorkDayEntry,
  calculateDailyEarnings 
} from '@/lib/db/types';
import { MonthlyData } from '@/lib/domains/income/services/modern-income-service';

// Client-side service that uses API endpoints for the modern contract/entry system
export const useModernIncomeService = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = useCallback(async <T>(
    apiCall: () => Promise<Response>,
    errorMessage: string
  ): Promise<T> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiCall();
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `${errorMessage}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : errorMessage;
      setError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Contract operations
  const createContract = useCallback(async (contract: CreateContract): Promise<Contract> => {
    return handleApiCall<Contract>(
      () => fetch('/api/v1/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contract),
      }),
      'Failed to create contract'
    );
  }, [handleApiCall]);

  const updateContract = useCallback(async (contract: UpdateContract): Promise<Contract> => {
    return handleApiCall<Contract>(
      () => fetch(`/api/v1/contracts/${contract.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contract),
      }),
      'Failed to update contract'
    );
  }, [handleApiCall]);

  const deleteContract = useCallback(async (id: string): Promise<void> => {
    return handleApiCall<void>(
      () => fetch(`/api/v1/contracts/${id}`, { method: 'DELETE' }),
      'Failed to delete contract'
    );
  }, [handleApiCall]);

  const getContractById = useCallback(async (id: string): Promise<Contract | null> => {
    return handleApiCall<Contract | null>(
      () => fetch(`/api/v1/contracts/${id}`),
      'Failed to get contract'
    );
  }, [handleApiCall]);

  const getAllContracts = useCallback(async (): Promise<Contract[]> => {
    return handleApiCall<Contract[]>(
      () => fetch('/api/v1/contracts'),
      'Failed to get contracts'
    );
  }, [handleApiCall]);

  // Work day entry operations
  const createWorkDayEntry = useCallback(async (entry: CreateWorkDayEntry): Promise<WorkDayEntry> => {
    return handleApiCall<WorkDayEntry>(
      () => fetch('/api/v1/work-day-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }),
      'Failed to create work day entry'
    );
  }, [handleApiCall]);

  const updateWorkDayEntry = useCallback(async (entry: UpdateWorkDayEntry): Promise<WorkDayEntry> => {
    return handleApiCall<WorkDayEntry>(
      () => fetch(`/api/v1/work-day-entries/${entry.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }),
      'Failed to update work day entry'
    );
  }, [handleApiCall]);

  const deleteWorkDayEntry = useCallback(async (id: string): Promise<void> => {
    return handleApiCall<void>(
      () => fetch(`/api/v1/work-day-entries/${id}`, { method: 'DELETE' }),
      'Failed to delete work day entry'
    );
  }, [handleApiCall]);

  const getWorkDayEntryById = useCallback(async (id: string): Promise<WorkDayEntry | null> => {
    return handleApiCall<WorkDayEntry | null>(
      () => fetch(`/api/v1/work-day-entries/${id}`),
      'Failed to get work day entry'
    );
  }, [handleApiCall]);

  const getWorkDayEntriesByDate = useCallback(async (date: Date): Promise<WorkDayEntry[]> => {
    const dateStr = date.toISOString().split('T')[0];
    return handleApiCall<WorkDayEntry[]>(
      () => fetch(`/api/v1/work-day-entries?date=${dateStr}`),
      'Failed to get work day entries by date'
    );
  }, [handleApiCall]);

  const getWorkDayEntriesByContract = useCallback(async (contractId: string): Promise<WorkDayEntry[]> => {
    return handleApiCall<WorkDayEntry[]>(
      () => fetch(`/api/v1/work-day-entries?contractId=${contractId}`),
      'Failed to get work day entries by contract'
    );
  }, [handleApiCall]);

  const getWorkDayEntriesByDateRange = useCallback(async (startDate: Date, endDate: Date): Promise<WorkDayEntry[]> => {
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    return handleApiCall<WorkDayEntry[]>(
      () => fetch(`/api/v1/work-day-entries?startDate=${startStr}&endDate=${endStr}`),
      'Failed to get work day entries by date range'
    );
  }, [handleApiCall]);

  const getMonthlyData = useCallback(async (month: number, year: number): Promise<MonthlyData> => {
    // Calculate monthly data client-side
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const [workDayEntries, contracts] = await Promise.all([
      getWorkDayEntriesByDateRange(startDate, endDate),
      getAllContracts()
    ]);
    
    // Group entries by date
    const entriesGroupedByDate = workDayEntries.reduce((acc, entry) => {
      const dateKey = entry.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(entry);
      return acc;
    }, {} as { [date: string]: WorkDayEntry[] });

    // Calculate totals
    const totalHours = workDayEntries.reduce((sum, entry) => sum + entry.hours, 0);
    const totalEarnings = workDayEntries.reduce((totalEarnings, entry) => {
      const contract = contracts.find(c => c.id === entry.contractId);
      if (!contract) return totalEarnings;
      return totalEarnings + calculateDailyEarnings(entry.hours, contract.hourlyRate);
    }, 0);
    const averageHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    return {
      month: monthNames[month - 1],
      year,
      workDayEntries,
      contracts,
      entriesGroupedByDate,
      totalHours,
      totalEarnings,
      averageHourlyRate,
      workDaysCount: Object.keys(entriesGroupedByDate).length,
    };
  }, [handleApiCall, getWorkDayEntriesByDateRange, getAllContracts]);

  const calculateEarnings = useCallback((hours: number, hourlyRate: number): number => {
    return calculateDailyEarnings(hours, hourlyRate);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return useMemo(() => ({
    // Contract operations
    createContract,
    updateContract,
    deleteContract,
    getContractById,
    getAllContracts,
    // Work day entry operations
    createWorkDayEntry,
    updateWorkDayEntry,
    deleteWorkDayEntry,
    getWorkDayEntryById,
    getWorkDayEntriesByDate,
    getWorkDayEntriesByContract,
    getWorkDayEntriesByDateRange,
    // Income calculations
    getMonthlyData,
    calculateEarnings,
    // State
    isLoading,
    error,
    clearError,
  }), [
    createContract,
    updateContract,
    deleteContract,
    getContractById,
    getAllContracts,
    createWorkDayEntry,
    updateWorkDayEntry,
    deleteWorkDayEntry,
    getWorkDayEntryById,
    getWorkDayEntriesByDate,
    getWorkDayEntriesByContract,
    getWorkDayEntriesByDateRange,
    getMonthlyData,
    calculateEarnings,
    isLoading,
    error,
    clearError,
  ]);
};

// Type for the hook return value
export type ModernIncomeServiceHook = ReturnType<typeof useModernIncomeService>;