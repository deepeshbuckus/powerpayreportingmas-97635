import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveReportDialog } from './SaveReportDialog';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockMutateAsync = vi.fn();
const mockGetConversationMessages = vi.fn();

vi.mock('@/hooks/usePowerPay', () => ({
  usePowerPayClient: () => ({
    getConversationMessages: mockGetConversationMessages,
  }),
  useSaveReport: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderDialog = (props = {}) => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    reportId: 'test-report-id',
    initialPrompt: 'Test prompt',
    ...props,
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SaveReportDialog {...defaultProps} />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('SaveReportDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders with initial prompt as name and description', () => {
    renderDialog({ initialPrompt: 'Show payroll data' });

    const nameInput = screen.getByLabelText(/Report Name/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/Description/i) as HTMLTextAreaElement;

    expect(nameInput.value).toBe('Show payroll data');
    expect(descriptionInput.value).toBe('Show payroll data');
  });

  it('truncates long initial prompts in name field', () => {
    const longPrompt = 'a'.repeat(100);
    renderDialog({ initialPrompt: longPrompt });

    const nameInput = screen.getByLabelText(/Report Name/i) as HTMLInputElement;
    expect(nameInput.value).toMatch(/\.\.\.$/);
    expect(nameInput.value.length).toBeLessThan(longPrompt.length);
  });

  it('allows editing name and description', async () => {
    const user = userEvent.setup();
    renderDialog();

    const nameInput = screen.getByLabelText(/Report Name/i);
    const descriptionInput = screen.getByLabelText(/Description/i);

    await user.clear(nameInput);
    await user.type(nameInput, 'New Report Name');
    await user.clear(descriptionInput);
    await user.type(descriptionInput, 'New description');

    expect(nameInput).toHaveValue('New Report Name');
    expect(descriptionInput).toHaveValue('New description');
  });

  it('requires name field to save', async () => {
    const user = userEvent.setup();
    renderDialog();

    const nameInput = screen.getByLabelText(/Report Name/i);
    const saveButton = screen.getByRole('button', { name: /Save Report/i });

    await user.clear(nameInput);

    expect(saveButton).toBeDisabled();
  });

  it('saves report with correct data', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    mockGetConversationMessages.mockResolvedValue({ messages: [] });

    renderDialog();

    const saveButton = screen.getByRole('button', { name: /Save Report/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        report_id: 'test-report-id',
        name: 'Test prompt',
        description: 'Test prompt',
      });
    });
  });

  it('navigates to chat after successful save', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    mockGetConversationMessages.mockResolvedValue({ messages: [] });

    renderDialog();

    const saveButton = screen.getByRole('button', { name: /Save Report/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });
  });

  it('stores chat history in localStorage after save', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({});
    mockGetConversationMessages.mockResolvedValue({
      messages: [
        {
          message_id: 'msg-1',
          prompt: 'Test prompt',
          role: 'user',
        },
      ],
    });

    renderDialog();

    const saveButton = screen.getByRole('button', { name: /Save Report/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(localStorage.getItem('loadedChatHistory')).toBeTruthy();
      expect(localStorage.getItem('loadedConversationId')).toBe('test-report-id');
    });
  });

  it('shows loading state while saving', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderDialog();

    const saveButton = screen.getByRole('button', { name: /Save Report/i });
    await user.click(saveButton);

    expect(screen.getByRole('button', { name: /Save Report/i })).toBeDisabled();
  });

  it('handles save errors gracefully', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValue(new Error('Save failed'));

    renderDialog();

    const saveButton = screen.getByRole('button', { name: /Save Report/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  it('closes dialog when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog({ onOpenChange });

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
