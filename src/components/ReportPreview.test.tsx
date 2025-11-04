import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportPreview } from './ReportPreview';
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
      <ReportPreview />
    </ReportContext.Provider>
  );
};

describe('ReportPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no report is available', () => {
    renderWithContext();
    expect(screen.getByText(/No Preview Available/i)).toBeInTheDocument();
  });

  it('renders report title and summary', () => {
    const currentReport = {
      id: 'test-id',
      title: 'Employee Payroll Report',
      description: '',
      content: '',
      status: 'draft' as const,
      type: 'General',
      summary: 'This report shows payroll data for Q4 2024',
      apiData: {
        title: 'Payroll Data',
        type: 'table',
        data: [['Name', 'Amount'], ['John', '1000']],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    renderWithContext({ currentReport });

    expect(screen.getByText('Employee Payroll Report')).toBeInTheDocument();
    expect(screen.getByText('This report shows payroll data for Q4 2024')).toBeInTheDocument();
  });

  it('renders key insights when available', () => {
    const currentReport = {
      id: 'test-id',
      title: 'Test Report',
      description: '',
      content: '',
      status: 'draft' as const,
      type: 'General',
      summary: 'Test summary',
      keyInsights: ['Insight 1', 'Insight 2'],
      apiData: {
        title: 'Data',
        type: 'table',
        data: [['Col1'], ['Val1']],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    renderWithContext({ currentReport });

    expect(screen.getByText('Insight 1')).toBeInTheDocument();
    expect(screen.getByText('Insight 2')).toBeInTheDocument();
  });

  it('renders suggested next steps when available', () => {
    const currentReport = {
      id: 'test-id',
      title: 'Test Report',
      description: '',
      content: '',
      status: 'draft' as const,
      type: 'General',
      summary: 'Test summary',
      suggestedPrompts: ['Next step 1', 'Next step 2'],
      apiData: {
        title: 'Data',
        type: 'table',
        data: [['Col1'], ['Val1']],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    renderWithContext({ currentReport });

    expect(screen.getByText('Next step 1')).toBeInTheDocument();
    expect(screen.getByText('Next step 2')).toBeInTheDocument();
  });

  it('renders API data tables when available', () => {
    const currentReport = {
      id: 'test-id',
      title: 'Test Report',
      description: '',
      content: '',
      status: 'draft' as const,
      type: 'General',
      summary: 'Test summary',
      apiData: {
        title: 'Employee Data',
        type: 'table',
        data: [
          ['Name', 'Department'],
          ['John Doe', 'IT'],
          ['Jane Smith', 'HR'],
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    renderWithContext({ currentReport });

    expect(screen.getByText('Employee Data')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('IT')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('HR')).toBeInTheDocument();
  });

  it('renders comprehensive information when available', async () => {
    const user = userEvent.setup();
    const currentReport = {
      id: 'test-id',
      title: 'Test Report',
      description: '',
      content: '',
      status: 'draft' as const,
      type: 'General',
      summary: 'Test summary',
      comprehensiveInfo: 'Detailed information here.',
      apiData: {
        title: 'Data',
        type: 'table',
        data: [['Col1'], ['Val1']],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    renderWithContext({ currentReport });

    const trigger = screen.getByText(/Comprehensive Information/i);
    await user.click(trigger);
    
    expect(screen.getByText(/Detailed information here/i)).toBeInTheDocument();
  });

  it('handles export button click', async () => {
    const user = userEvent.setup();

    const currentReport = {
      id: 'test-id',
      title: 'Test Report',
      description: '',
      content: '',
      status: 'draft' as const,
      type: 'General',
      summary: 'Test summary',
      apiData: {
        title: 'Data',
        type: 'table',
        data: [{ Col1: 'Value1' }],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    renderWithContext({ currentReport });

    const exportButton = screen.getAllByRole('button', { name: /export/i })[0];
    await user.click(exportButton);

    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it('renders object array format for API data', () => {
    const currentReport = {
      id: 'test-id',
      title: 'Test Report',
      description: '',
      content: '',
      status: 'draft' as const,
      type: 'General',
      summary: 'Test summary',
      apiData: {
        title: 'Employees',
        type: 'table',
        data: [
          { name: 'John', age: 30 },
          { name: 'Jane', age: 25 },
        ],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    renderWithContext({ currentReport });

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
  });
});
