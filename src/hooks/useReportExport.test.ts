import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
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

    mockExportReportToCSV.mockResolvedValue(undefined);

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

    mockExportReportToCSV.mockRejectedValue(new Error('Export failed'));

    const { result } = renderHook(() => useReportExport());

    await expect(result.current.exportReport(mockReport as any)).rejects.toThrow('Export failed');
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.exporting).toBe(false);
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
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useReportExport());

    await expect(result.current.exportReport(mockReport as any)).rejects.toThrow();
    expect(result.current.error).toBeInstanceOf(Error);

    await result.current.exportReport(mockReport as any);
    expect(result.current.error).toBeNull();
  });
});
