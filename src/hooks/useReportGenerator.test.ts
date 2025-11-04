import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { useReportGenerator } from './useReportGenerator';

const mockStartNewReport = vi.fn();
const mockContinueReport = vi.fn();

vi.mock('@/services/PowerPayReportService', () => ({
  powerPayReportService: {
    startNewReport: (...args: any[]) => mockStartNewReport(...args),
    continueReport: (...args: any[]) => mockContinueReport(...args),
  },
}));

describe('useReportGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts new report successfully', async () => {
    const mockResponse = {
      reportId: 'report-123',
      messageId: 'msg-123',
      report: {
        id: 'report-123',
        title: 'Test Report',
        summary: 'Test summary',
        data: [],
      },
      messages: [],
    };

    mockStartNewReport.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useReportGenerator());

    expect(result.current.generating).toBe(false);

    const promise = result.current.startNewReport('Test prompt');

    await waitFor(() => {
      expect(result.current.generating).toBe(false);
    });

    const response = await promise;

    expect(mockStartNewReport).toHaveBeenCalledWith('Test prompt');
    expect(response).toEqual(mockResponse);
  });

  it('continues conversation successfully', async () => {
    const mockResponse = {
      messages: [
        {
          id: 'msg-1',
          sender: 'assistant',
          content: 'Response',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    mockContinueReport.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useReportGenerator());

    const response = await result.current.continueConversation('conv-123', 'Follow-up prompt');

    expect(mockContinueReport).toHaveBeenCalledWith('conv-123', 'Follow-up prompt');
    expect(response).toEqual(mockResponse);
  });

  it('handles errors in startNewReport', async () => {
    mockStartNewReport.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useReportGenerator());

    await expect(result.current.startNewReport('Test prompt')).rejects.toThrow('API Error');
    
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.generating).toBe(false);
    });
  });

  it('handles errors in continueConversation', async () => {
    mockContinueReport.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useReportGenerator());

    await expect(
      result.current.continueConversation('conv-123', 'Follow-up')
    ).rejects.toThrow('API Error');
    
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  it('sets generating state correctly', async () => {
    mockStartNewReport.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        reportId: 'test',
        messageId: 'test',
        report: { id: 'test', title: '', summary: '', data: [] },
        messages: [],
      }), 100))
    );

    const { result } = renderHook(() => useReportGenerator());

    const promise = result.current.startNewReport('Test');

    await waitFor(() => {
      expect(result.current.generating).toBe(false);
    });

    await promise;
  });

  it('clears error on successful request', async () => {
    mockStartNewReport
      .mockRejectedValueOnce(new Error('First error'))
      .mockResolvedValueOnce({
        reportId: 'test',
        messageId: 'test',
        report: { id: 'test', title: '', summary: '', data: [] },
        messages: [],
      });

    const { result } = renderHook(() => useReportGenerator());

    await expect(result.current.startNewReport('Test')).rejects.toThrow();
    
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
    });

    await result.current.startNewReport('Test again');
    
    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });
  });
});
