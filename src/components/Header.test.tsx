import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ReportContext, type ReportContextType } from '@/contexts/ReportContext';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

const renderHeader = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ReportContext.Provider value={mockContextValue}>
        <Header />
      </ReportContext.Provider>
    </MemoryRouter>
  );
};

describe('Header', () => {
  it('renders app title', () => {
    renderHeader();
    expect(screen.getByText('Payroll Intelligence')).toBeInTheDocument();
  });

  it('renders settings and user buttons', () => {
    renderHeader();
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('shows back button when not on dashboard', () => {
    renderHeader('/chat');
    expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
  });

  it('hides back button on dashboard route', () => {
    renderHeader('/dashboard');
    expect(screen.queryByRole('button', { name: /Back/i })).not.toBeInTheDocument();
  });

  it('navigates back when back button is clicked', async () => {
    const user = userEvent.setup();
    renderHeader('/chat');

    const backButton = screen.getByRole('button', { name: /Back/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('renders logo link to home', () => {
    renderHeader();
    const link = screen.getByRole('link', { name: /Payroll Intelligence/i });
    expect(link).toHaveAttribute('href', '/');
  });
});
