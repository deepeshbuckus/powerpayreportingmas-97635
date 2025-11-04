import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInterface } from './ChatInterface';
import { ReportContext, type ReportContextType } from '@/contexts/ReportContext';

const mockContextValue: ReportContextType = {
  reports: [],
  currentReport: null,
  messageId: null,
  conversationId: null,
  attachmentId: null,
  setCurrentReport: vi.fn(),
  addReport: vi.fn(),
  updateReport: vi.fn(),
  generateReportFromPrompt: vi.fn(),
  startNewChat: vi.fn(),
  sendChatMessage: vi.fn(),
  fetchAttachmentResult: vi.fn(),
  fetchConversationMessages: vi.fn(),
  setSessionData: vi.fn(),
  setMessageId: vi.fn(),
  setAttachmentId: vi.fn(),
};

const renderWithContext = (contextValue: Partial<ReportContextType> = {}) => {
  const value = { ...mockContextValue, ...contextValue };
  return render(
    <ReportContext.Provider value={value}>
      <ChatInterface />
    </ReportContext.Provider>
  );
};

describe('ChatInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders initial welcome message', () => {
    renderWithContext();
    expect(screen.getByText(/AI-powered HR reporting assistant/i)).toBeInTheDocument();
  });

  it('renders prompting tips when chat is empty', () => {
    renderWithContext();
    expect(screen.getByText(/Prompting Tips/i)).toBeInTheDocument();
    expect(screen.getByText(/Be specific with your request/i)).toBeInTheDocument();
  });

  it('allows user to type and send a message', async () => {
    const user = userEvent.setup();
    const generateReportFromPrompt = vi.fn().mockResolvedValue({
      id: 'test-report-id',
      title: 'Test Report',
      description: '',
      content: '',
      status: 'draft',
      type: 'General',
      summary: 'Test summary',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    renderWithContext({ generateReportFromPrompt });

    const input = screen.getByPlaceholderText(/Describe the report you need/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await user.type(input, 'Show me payroll data');
    await user.click(sendButton);

    await waitFor(() => {
      expect(generateReportFromPrompt).toHaveBeenCalledWith('Show me payroll data');
    });
  });

  it('disables input when message is empty', () => {
    renderWithContext();

    const input = screen.getByPlaceholderText(/Describe the report you need/i);
    expect(input).toBeDisabled();
  });

  it('loads chat history from localStorage on mount', () => {
    const mockHistory = JSON.stringify([
      {
        id: '1',
        sender: 'user',
        content: 'Test message',
        timestamp: new Date().toISOString(),
      },
    ]);
    localStorage.setItem('loadedChatHistory', mockHistory);

    renderWithContext();

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders suggested prompts when available', () => {
    const currentReport = {
      id: 'test-id',
      title: 'Test Report',
      description: '',
      content: '',
      status: 'draft' as const,
      type: 'General',
      summary: 'Test summary',
      suggestedPrompts: ['Show more details', 'Export data'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    renderWithContext({ currentReport });

    expect(screen.getByText('Show more details')).toBeInTheDocument();
    expect(screen.getByText('Export data')).toBeInTheDocument();
  });

  it('handles suggested prompt clicks', async () => {
    const user = userEvent.setup();
    const sendChatMessage = vi.fn().mockResolvedValue(undefined);
    const conversationId = 'test-id';

    const currentReport = {
      id: 'test-id',
      title: 'Test Report',
      description: '',
      content: '',
      status: 'draft' as const,
      type: 'General',
      summary: 'Test summary',
      suggestedPrompts: ['Show more details'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    renderWithContext({ currentReport, sendChatMessage, conversationId });

    const promptButton = screen.getByText('Show more details');
    await user.click(promptButton);

    await waitFor(() => {
      expect(sendChatMessage).toHaveBeenCalledWith(conversationId, 'Show more details');
    });
  });

  it('clears input after sending message', async () => {
    const user = userEvent.setup();
    const generateReportFromPrompt = vi.fn().mockResolvedValue({
      id: 'test-id',
      title: 'Test',
      description: '',
      content: '',
      status: 'draft',
      type: 'General',
      summary: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    renderWithContext({ generateReportFromPrompt });

    const input = screen.getByPlaceholderText(/Describe the report you need/i) as HTMLInputElement;
    await user.type(input, 'Test prompt');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    const generateReportFromPrompt = vi.fn().mockRejectedValue(new Error('API Error'));

    renderWithContext({ generateReportFromPrompt });

    const input = screen.getByPlaceholderText(/Describe the report you need/i);
    await user.type(input, 'Test prompt');
    await user.click(screen.getByRole('button', { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/Sorry, I encountered an error/i)).toBeInTheDocument();
    });
  });
});
