import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  usePowerPayClient,
  useReports,
  useConversationMessages,
  useReportData,
  useSaveReport,
  useStartConversation,
  useContinueConversation,
} from './usePowerPay';
import { PowerPayApi } from '@/lib/powerpay-api';

vi.mock('@/lib/powerpay-api');

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('usePowerPay hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePowerPayClient', () => {
    it('creates client with default options', () => {
      const { result } = renderHook(() => usePowerPayClient());
      expect(result.current).toBeInstanceOf(PowerPayApi);
    });

    it('creates client with custom options', () => {
      const { result } = renderHook(() =>
        usePowerPayClient({
          baseUrl: 'https://custom-api.com',
          token: 'custom-token',
        })
      );
      expect(result.current).toBeInstanceOf(PowerPayApi);
    });
  });

  describe('useReports', () => {
    it('fetches reports successfully', async () => {
      const mockClient = {
        getReports: vi.fn().mockResolvedValue({
          reports: [
            { report_id: '1', name: 'Report 1' },
            { report_id: '2', name: 'Report 2' },
          ],
        }),
      } as any;

      const { result } = renderHook(() => useReports(mockClient), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(Array.isArray(result.current.data)).toBe(true);
      expect(mockClient.getReports).toHaveBeenCalled();
    });

    it('handles errors when fetching reports', async () => {
      const mockClient = {
        getReports: vi.fn().mockRejectedValue(new Error('API Error')),
      } as any;

      const { result } = renderHook(() => useReports(mockClient), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useConversationMessages', () => {
    it('fetches conversation messages when enabled', async () => {
      const mockClient = {
        getConversationMessages: vi.fn().mockResolvedValue({
          messages: [
            { message_id: '1', prompt: 'Test 1' },
            { message_id: '2', prompt: 'Test 2' },
          ],
        }),
      } as any;

      const { result } = renderHook(
        () => useConversationMessages(mockClient, 'report-123', true),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.messages).toHaveLength(2);
      expect(mockClient.getConversationMessages).toHaveBeenCalledWith('report-123');
    });

    it('does not fetch when disabled', () => {
      const mockClient = {
        getConversationMessages: vi.fn(),
      } as any;

      renderHook(() => useConversationMessages(mockClient, 'report-123', false), {
        wrapper: createWrapper(),
      });

      expect(mockClient.getConversationMessages).not.toHaveBeenCalled();
    });
  });

  describe('useReportData', () => {
    it('fetches report data when enabled', async () => {
      const mockClient = {
        getReportData: vi.fn().mockResolvedValue({
          response: [{ title: 'Data', type: 'table', data: [] }],
        }),
      } as any;

      const { result } = renderHook(
        () => useReportData(mockClient, 'report-123', 'msg-123', true),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockClient.getReportData).toHaveBeenCalledWith('report-123', 'msg-123');
    });
  });

  describe('useSaveReport', () => {
    it('saves report successfully', async () => {
      const mockClient = {
        saveReport: vi.fn().mockResolvedValue({ success: true }),
      } as any;

      const { result } = renderHook(() => useSaveReport(mockClient), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({
        report_id: 'report-123',
        name: 'Test Report',
        description: 'Test description',
      });

      expect(mockClient.saveReport).toHaveBeenCalledWith({
        report_id: 'report-123',
        name: 'Test Report',
        description: 'Test description',
      });
    });
  });

  describe('useStartConversation', () => {
    it('starts conversation successfully', async () => {
      const mockClient = {
        startConversation: vi.fn().mockResolvedValue({
          conversation_id: 'conv-123',
          message_id: 'msg-123',
        }),
      } as any;

      const { result } = renderHook(() => useStartConversation(mockClient), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ prompt: 'Test prompt' });

      expect(mockClient.startConversation).toHaveBeenCalledWith('Test prompt');
    });
  });

  describe('useContinueConversation', () => {
    it('continues conversation successfully', async () => {
      const mockClient = {
        continueConversation: vi.fn().mockResolvedValue({
          conversation_id: 'conv-123',
          message_id: 'msg-456',
        }),
      } as any;

      const { result } = renderHook(() => useContinueConversation(mockClient, 'conv-123'), {
        wrapper: createWrapper(),
      });

      await result.current.mutateAsync({ prompt: 'Follow-up prompt' });

      expect(mockClient.continueConversation).toHaveBeenCalledWith('conv-123', 'Follow-up prompt');
    });
  });
});
