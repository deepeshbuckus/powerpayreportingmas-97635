import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { useReportExport } from './useReportExport';

const mockExportReportToCSV = vi.fn();

vi.mock('@/services/PowerPayReportService', () => ({
  powerPayReportService: {
    exportReportToCSV: (...args: any[]) => mockExportReportToCSV(...args),
  },
}));

describe('useReportExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports report successfully', async () => {
    const mockReport = {
      id: 'report-123',
      title: 'Test Report',
      summary: 'Test summary',
      data: [
        {
          title: 'Data Table',
          type: 'table',
          data: [['Col1'], ['Value1']],
        },
      ],
    };

    mockExportReportToCSV.mockImplementation(() => {});

    const { result } = renderHook(() => useReportExport());

    expect(result.current.exporting).toBe(false);

    await result.current.exportReport(mockReport as any);

    await waitFor(() => {
      expect(result.current.exporting).toBe(false);
    });

    expect(mockExportReportToCSV).toHaveBeenCalledWith(mockReport);
  });

  it('handles export errors', async () => {
    const mockReport = {
      id: 'report-123',
      title: 'Test Report',
      summary: 'Test summary',
      data: [],
    };

    mockExportReportToCSV.mockImplementation(() => {
      throw new Error('Export failed');
    });

    const { result } = renderHook(() => useReportExport());

    await expect(result.current.exportReport(mockReport as any)).rejects.toThrow('Export failed');
    
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.exporting).toBe(false);
    });
  });

  it('sets exporting state correctly', async () => {
    const mockReport = {
      id: 'report-123',
      title: 'Test Report',
      summary: 'Test summary',
      data: [],
    };

    mockExportReportToCSV.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useReportExport());

    const promise = result.current.exportReport(mockReport as any);

    await waitFor(() => {
      expect(result.current.exporting).toBe(false);
    });

    await promise;
  });

  it('clears error on successful export', async () => {
    const mockReport = {
      id: 'report-123',
      title: 'Test Report',
      summary: 'Test summary',
      data: [],
    };

    mockExportReportToCSV
      .mockImplementationOnce(() => {
        throw new Error('First error');
      })
      .mockImplementationOnce(() => {});

    const { result } = renderHook(() => useReportExport());

    await expect(result.current.exportReport(mockReport as any)).rejects.toThrow();
    
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
    });

    await result.current.exportReport(mockReport as any);
    
    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });
});
