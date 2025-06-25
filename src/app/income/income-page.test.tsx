import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import IncomePage from './page';

// Mock the dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock('@copilotkit/react-core', () => ({
  useCopilotReadable: vi.fn(),
  useCopilotAction: vi.fn(),
}));

vi.mock('@/lib/hooks/use-income-service', () => ({
  useIncomeService: vi.fn(),
}));

// Mock data
const mockWorkDay = {
  id: 'work-day-1',
  date: '2024-12-15',
  hours: 8,
  hourlyRate: 37,
  notes: 'Test work day',
  createdAt: '2024-12-15T10:00:00Z',
  updatedAt: '2024-12-15T10:00:00Z',
};

const mockMonthlyData = {
  month: 'December',
  year: 2024,
  workDays: [mockWorkDay],
  totalHours: 8,
  totalEarnings: 296,
  averageHourlyRate: 37,
  workDaysCount: 1,
};

describe('IncomePage Delete Functionality', () => {
  const mockPush = vi.fn();
  const mockDeleteWorkDay = vi.fn();
  const mockGetMonthlyData = vi.fn();
  const mockCalculateEarnings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
    
    (useSearchParams as any).mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    });
    
    const mockIncomeService = {
      deleteWorkDay: mockDeleteWorkDay,
      getMonthlyData: mockGetMonthlyData,
      calculateEarnings: mockCalculateEarnings,
      isLoading: false,
      error: null,
      clearError: vi.fn(),
    };
    
    require('@/lib/hooks/use-income-service').useIncomeService.mockReturnValue(mockIncomeService);
    
    mockGetMonthlyData.mockResolvedValue(mockMonthlyData);
    mockCalculateEarnings.mockReturnValue(296);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show delete button on hover for work days', async () => {
    render(<IncomePage />);
    
    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText('December 2024')).toBeInTheDocument();
    });
    
    // Find the work day cell (day 15)
    const workDayCell = screen.getByText('15').closest('div');
    expect(workDayCell).toBeInTheDocument();
    
    // The delete button should be hidden initially
    const deleteButton = workDayCell?.querySelector('[title*="Quick delete"]');
    expect(deleteButton).toHaveClass('opacity-0');
    
    // Simulate hover by triggering mouseenter
    if (workDayCell) {
      fireEvent.mouseEnter(workDayCell);
    }
    
    // The delete button should become visible
    expect(deleteButton).toHaveClass('group-hover:opacity-100');
  });

  it('should call delete function when quick delete button is clicked', async () => {
    mockDeleteWorkDay.mockResolvedValue(undefined);
    mockGetMonthlyData.mockResolvedValueOnce(mockMonthlyData).mockResolvedValueOnce({
      ...mockMonthlyData,
      workDays: [], // After deletion
      workDaysCount: 0,
      totalHours: 0,
      totalEarnings: 0,
    });
    
    render(<IncomePage />);
    
    await waitFor(() => {
      expect(screen.getByText('December 2024')).toBeInTheDocument();
    });
    
    // Find the work day cell and delete button
    const workDayCell = screen.getByText('15').closest('div');
    const deleteButton = workDayCell?.querySelector('[title*="Quick delete"]');
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }
    
    // Should call delete service
    expect(mockDeleteWorkDay).toHaveBeenCalledWith('work-day-1');
    
    // Should reload monthly data
    await waitFor(() => {
      expect(mockGetMonthlyData).toHaveBeenCalledTimes(2);
    });
  });

  it('should stop event propagation when delete button is clicked', async () => {
    const mockStopPropagation = vi.fn();
    
    render(<IncomePage />);
    
    await waitFor(() => {
      expect(screen.getByText('December 2024')).toBeInTheDocument();
    });
    
    const workDayCell = screen.getByText('15').closest('div');
    const deleteButton = workDayCell?.querySelector('[title*="Quick delete"]');
    
    if (deleteButton) {
      // Create a mock event with stopPropagation
      const mockEvent = new MouseEvent('click', { bubbles: true });
      mockEvent.stopPropagation = mockStopPropagation;
      
      fireEvent.click(deleteButton, mockEvent);
    }
    
    // The event should have propagation stopped
    expect(mockStopPropagation).toHaveBeenCalled();
  });

  it('should not show delete button for non-work days', async () => {
    const mockMonthlyDataWithoutWorkDay = {
      ...mockMonthlyData,
      workDays: [],
      workDaysCount: 0,
    };
    
    mockGetMonthlyData.mockResolvedValue(mockMonthlyDataWithoutWorkDay);
    
    render(<IncomePage />);
    
    await waitFor(() => {
      expect(screen.getByText('December 2024')).toBeInTheDocument();
    });
    
    // Find a non-work day cell (day 15 without work day data)
    const nonWorkDayCell = screen.getByText('15').closest('div');
    
    // Should not have a delete button
    const deleteButton = nonWorkDayCell?.querySelector('[title*="Quick delete"]');
    expect(deleteButton).toBeNull();
    
    // Should have the quick add button instead
    const addButton = nonWorkDayCell?.querySelector('[title*="Quick add"]');
    expect(addButton).toBeInTheDocument();
  });

  it('should handle delete errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockDeleteWorkDay.mockRejectedValue(new Error('Delete failed'));
    
    render(<IncomePage />);
    
    await waitFor(() => {
      expect(screen.getByText('December 2024')).toBeInTheDocument();
    });
    
    const workDayCell = screen.getByText('15').closest('div');
    const deleteButton = workDayCell?.querySelector('[title*="Quick delete"]');
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to quick delete work day:', expect.any(Error));
    });
    
    consoleErrorSpy.mockRestore();
  });
});