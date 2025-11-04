import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
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
    expect(screen.getByText(/AI HR report assistant/i)).toBeInTheDocument();
  });

  it('renders prompting tips when chat is empty', () => {
    renderWithContext();
    expect(screen.getByText(/Prompting Tips/i)).toBeInTheDocument();
    expect(screen.getByText(/Be specific with time ranges/i)).toBeInTheDocument();
  });

  it('allows user to type and send a message', async () => {
    const user = userEvent.setup();
    const generateReportFromPrompt = vi.fn().mockResolvedValue({
      id: 'test-123',
      title: 'Test Report',
      type: 'Payroll',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    renderWithContext({ generateReportFromPrompt });

    const input = screen.getByPlaceholderText(/Describe your HR.*payroll report/i);
    const sendButton = screen.getByRole('button', { name: /send message/i });

    await user.type(input, 'Show me payroll data');
    await user.click(sendButton);

    await waitFor(() => {
      expect(generateReportFromPrompt).toHaveBeenCalledWith('Show me payroll data');
    });
  });

  it('disables send button when input is empty', () => {
    renderWithContext();

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();
  });

  it('loads chat history from localStorage on mount', () => {
    const mockHistory = JSON.stringify([
      {
        id: '1',
        role: 'user',
        prompt: 'Test message',
        timestamp: new Date().toISOString(),
      },
    ]);
    localStorage.setItem('loadedChatHistory', mockHistory);
    localStorage.setItem('loadedConversationId', 'test-conversation-id');

    renderWithContext();

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders suggested prompts when available in last message', async () => {
    const generateReportFromPrompt = vi.fn().mockResolvedValue({
      id: 'test-id',
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

    const input = screen.getByPlaceholderText(/Describe your HR\/payroll report requirements/i);
    await userEvent.setup().type(input, 'Test query');
    await userEvent.setup().click(screen.getByRole('button', { name: /send message/i }));

    // Wait for the response
    await waitFor(() => {
      expect(generateReportFromPrompt).toHaveBeenCalled();
    });
  });

  it('sets input value when suggested prompt is clicked', async () => {
    const user = userEvent.setup();

    // Set up a message with suggested prompts
    const mockHistory = JSON.stringify([
      {
        id: '1',
        role: 'assistant',
        summary: 'Test response',
        suggestedPrompts: ['Show more details'],
        timestamp: new Date().toISOString(),
      },
    ]);
    localStorage.setItem('loadedChatHistory', mockHistory);
    localStorage.setItem('loadedConversationId', 'test-conversation-id');

    renderWithContext();

    // Find and click the suggested prompt button
    const promptButton = await screen.findByText('Show more details');
    await user.click(promptButton);

    // Verify the input value was set
    const input = screen.getByPlaceholderText(/Describe your HR\/payroll report requirements/i) as HTMLInputElement;
    expect(input.value).toBe('Show more details');
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

    const input = screen.getByPlaceholderText(/Describe your HR\/payroll report requirements/i) as HTMLInputElement;
    await user.type(input, 'Test prompt');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    const generateReportFromPrompt = vi.fn().mockRejectedValue(new Error('API Error'));

    renderWithContext({ generateReportFromPrompt });

    const input = screen.getByPlaceholderText(/Describe your HR\/payroll report requirements/i);
    await user.type(input, 'Test prompt');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/I apologize.*error/i)).toBeInTheDocument();
    });
  });
});
