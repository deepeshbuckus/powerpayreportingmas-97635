import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import { ReportProvider, useReports } from './ReportContext';

const mockStartConversation = vi.fn();
const mockContinueConversation = vi.fn();
const mockGetReportData = vi.fn();

vi.mock('@/hooks/usePowerPay', () => ({
  usePowerPayClient: () => ({
    startConversation: mockStartConversation,
    continueConversation: mockContinueConversation,
    getReportData: mockGetReportData,
  }),
}));

describe('ReportContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('provides initial context values', () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: ReportProvider,
    });

    expect(result.current.reports).toBeDefined();
    expect(result.current.currentReport).toBeNull();
  });

  it('generates report from prompt', async () => {
    mockStartConversation.mockResolvedValue({
      report_id: 'conv-123',
      messages: [
        {
          message_id: 'msg-123',
          prompt: 'Test prompt',
          role: 'user',
        },
      ],
    });

    const { result } = renderHook(() => useReports(), {
      wrapper: ReportProvider,
    });

    const report = await result.current.generateReportFromPrompt('Test prompt');

    expect(mockStartConversation).toHaveBeenCalledWith({ prompt: 'Test prompt' });
    expect(report).toBeDefined();
    expect(report.title).toBeTruthy();
  });

  it('starts new chat', async () => {
    mockStartConversation.mockResolvedValue({
      report_id: 'conv-123',
      messages: [
        {
          message_id: 'msg-123',
          prompt: 'Test prompt',
          role: 'user',
        },
      ],
    });

    const { result } = renderHook(() => useReports(), {
      wrapper: ReportProvider,
    });

    const response = await result.current.startNewChat('Test prompt');

    expect(mockStartConversation).toHaveBeenCalledWith({ prompt: 'Test prompt' });
    expect(response.conversationId).toBeTruthy();
    expect(response.messageId).toBeTruthy();
  });

  it('sends chat message to existing conversation', async () => {
    mockContinueConversation.mockResolvedValue({
      report_id: 'conv-123',
      messages: [
        {
          message_id: 'msg-456',
          prompt: 'Follow-up prompt',
          role: 'user',
        },
      ],
    });

    const { result } = renderHook(() => useReports(), {
      wrapper: ReportProvider,
    });

    await result.current.sendChatMessage('conv-123', 'Follow-up prompt');

    expect(mockContinueConversation).toHaveBeenCalledWith('conv-123', { prompt: 'Follow-up prompt' });
  });

  it('fetches attachment result', async () => {
    mockGetReportData.mockResolvedValue({
      data: [
        {
          title: 'Attachment Data',
          type: 'table',
          data: [['Col1'], ['Value1']],
        },
      ],
    });

    const { result } = renderHook(() => useReports(), {
      wrapper: ReportProvider,
    });

    await result.current.fetchAttachmentResult('report-123', 'msg-123', 'att-123');

    expect(mockGetReportData).toHaveBeenCalledWith('report-123', 'msg-123');
  });

  it('sets current report', async () => {
    const { result } = renderHook(() => useReports(), {
      wrapper: ReportProvider,
    });

    const testReport = {
      id: 'test-id',
      title: 'Test Report',
      description: 'Test description',
      content: 'Test content',
      status: 'draft' as const,
      type: 'General',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    result.current.setCurrentReport(testReport);

    await waitFor(() => {
      expect(result.current.currentReport).toEqual(testReport);
    });
  });

  it('handles errors gracefully', async () => {
    mockStartConversation.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useReports(), {
      wrapper: ReportProvider,
    });

    await expect(
      result.current.generateReportFromPrompt('Test prompt')
    ).rejects.toThrow();
  });
});
