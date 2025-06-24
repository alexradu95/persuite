'use client';

import { useState, useCallback, useMemo } from 'react';
import { WorkDay, CreateWorkDay, UpdateWorkDay, MonthlyData, calculateDailyEarnings } from '../db/types';

// Client-side service that uses API endpoints
export const useIncomeService = () => {
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

  const createWorkDay = useCallback(async (workDay: CreateWorkDay): Promise<WorkDay> => {
    return handleApiCall<WorkDay>(
      () => fetch('/api/work-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workDay),
      }),
      'Failed to create work day'
    );
  }, [handleApiCall]);

  const updateWorkDay = useCallback(async (workDay: UpdateWorkDay): Promise<WorkDay> => {
    return handleApiCall<WorkDay>(
      () => fetch(`/api/work-days/${workDay.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workDay),
      }),
      'Failed to update work day'
    );
  }, [handleApiCall]);

  const deleteWorkDay = useCallback(async (id: string): Promise<void> => {
    return handleApiCall<void>(
      () => fetch(`/api/work-days/${id}`, { method: 'DELETE' }),
      'Failed to delete work day'
    );
  }, [handleApiCall]);

  const getWorkDayById = useCallback(async (id: string): Promise<WorkDay | null> => {
    return handleApiCall<WorkDay | null>(
      () => fetch(`/api/work-days/${id}`),
      'Failed to get work day'
    );
  }, [handleApiCall]);

  const getWorkDayByDate = useCallback(async (date: string): Promise<WorkDay | null> => {
    return handleApiCall<WorkDay | null>(
      () => fetch(`/api/work-days/by-date/${date}`),
      'Failed to get work day by date'
    );
  }, [handleApiCall]);

  const getMonthlyData = useCallback(async (month: number, year: number): Promise<MonthlyData> => {
    return handleApiCall<MonthlyData>(
      () => fetch(`/api/work-days/monthly/${year}/${month}`),
      'Failed to get monthly data'
    );
  }, [handleApiCall]);

  const getWorkDaysByDateRange = useCallback(async (startDate: string, endDate: string): Promise<WorkDay[]> => {
    return handleApiCall<WorkDay[]>(
      () => fetch(`/api/work-days/range?start=${startDate}&end=${endDate}`),
      'Failed to get work days by date range'
    );
  }, [handleApiCall]);

  const calculateEarnings = useCallback((hours: number, hourlyRate: number): number => {
    return calculateDailyEarnings(hours, hourlyRate);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return useMemo(() => ({
    createWorkDay,
    updateWorkDay,
    deleteWorkDay,
    getWorkDayById,
    getWorkDayByDate,
    getMonthlyData,
    getWorkDaysByDateRange,
    calculateEarnings,
    isLoading,
    error,
    clearError,
  }), [
    createWorkDay,
    updateWorkDay,
    deleteWorkDay,
    getWorkDayById,
    getWorkDayByDate,
    getMonthlyData,
    getWorkDaysByDateRange,
    calculateEarnings,
    isLoading,
    error,
    clearError,
  ]);
};