import { useState, useEffect, useCallback } from 'react';
import { TaxCalculationResult } from '@/lib/domains/taxes/services/romanian-tax-service';

type UseRomanianTaxCalculationResult = {
  taxData: TaxCalculationResult | null;
  isLoading: boolean;
  error: string | null;
  refreshTaxData: (year: number) => Promise<void>;
};

export const useRomanianTaxCalculation = (year: number): UseRomanianTaxCalculationResult => {
  const [taxData, setTaxData] = useState<TaxCalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTaxData = useCallback(async (targetYear: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/romanian-taxes?year=${targetYear}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tax data: ${response.statusText}`);
      }
      
      const data: TaxCalculationResult = await response.json();
      setTaxData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setTaxData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshTaxData = useCallback(async (targetYear: number) => {
    await fetchTaxData(targetYear);
  }, [fetchTaxData]);

  useEffect(() => {
    fetchTaxData(year);
  }, [year, fetchTaxData]);

  return {
    taxData,
    isLoading,
    error,
    refreshTaxData,
  };
};