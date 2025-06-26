import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRomanianTaxCalculation } from './use-romanian-tax-calculation';
import { TaxCalculationResult } from '@/lib/domains/taxes/services/romanian-tax-service';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const getMockTaxCalculationResult = (overrides?: Partial<TaxCalculationResult>): TaxCalculationResult => {
  return {
    grossIncome: 100000,
    taxableIncome: 97000,
    incomeTax: 9700,
    healthInsurance: 10000,
    socialInsurance: 25000,
    totalTaxes: 44700,
    netIncome: 55300,
    breakdown: {
      personalDeduction: 3000,
      professionalDeductions: 0,
      healthInsuranceDeductions: 0,
      socialInsuranceDeductions: 0,
      voluntaryPensionDeductions: 0,
      totalDeductions: 3000,
    },
    taxRates: {
      incomeTaxRate: 0.10,
      healthInsuranceRate: 0.10,
      socialInsuranceRate: 0.25,
    },
    ...overrides,
  };
};

describe('useRomanianTaxCalculation', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch tax data when year changes', async () => {
    const mockTaxData = getMockTaxCalculationResult();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTaxData,
    });

    const { result } = renderHook(() => useRomanianTaxCalculation(2024));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.taxData).toBeNull();
    expect(result.current.error).toBeNull();

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/romanian-taxes?year=2024');
    expect(result.current.taxData).toEqual(mockTaxData);
    expect(result.current.error).toBeNull();
  });

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useRomanianTaxCalculation(2024));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.taxData).toBeNull();
    expect(result.current.error).toBe('Network error');
  });

  it('should handle HTTP error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    });

    const { result } = renderHook(() => useRomanianTaxCalculation(2024));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.taxData).toBeNull();
    expect(result.current.error).toBe('Failed to fetch tax data: Internal Server Error');
  });

  it('should allow manual refresh of tax data', async () => {
    const mockTaxData = getMockTaxCalculationResult();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockTaxData,
    });

    const { result } = renderHook(() => useRomanianTaxCalculation(2024));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear previous calls
    mockFetch.mockClear();

    // Call refreshTaxData
    await result.current.refreshTaxData(2025);

    expect(mockFetch).toHaveBeenCalledWith('/api/romanian-taxes?year=2025');
    expect(result.current.taxData).toEqual(mockTaxData);
  });

  it('should set loading state during refresh', async () => {
    const mockTaxData = getMockTaxCalculationResult();
    
    // Mock a delayed response
    mockFetch.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => mockTaxData,
        }), 100)
      )
    );

    const { result } = renderHook(() => useRomanianTaxCalculation(2024));

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Start refresh
    const refreshPromise = result.current.refreshTaxData(2024);
    
    // Should be loading during refresh
    expect(result.current.isLoading).toBe(true);

    await refreshPromise;

    expect(result.current.isLoading).toBe(false);
    expect(result.current.taxData).toEqual(mockTaxData);
  });
});