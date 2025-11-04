import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Index from './Index';
import { BrowserRouter } from 'react-router-dom';
import { ReportContext, type ReportContextType } from '@/contexts/ReportContext';
import { vi } from 'vitest';

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

const renderIndex = () => {
  return render(
    <BrowserRouter>
      <ReportContext.Provider value={mockContextValue}>
        <Index />
      </ReportContext.Provider>
    </BrowserRouter>
  );
};

describe('Index Page', () => {
  it('renders chat interface and report preview', () => {
    renderIndex();
    
    // ChatInterface renders the welcome message
    expect(screen.getByText(/AI-powered HR reporting assistant/i)).toBeInTheDocument();
    
    // ReportPreview shows empty state initially
    expect(screen.getByText(/No Preview Available/i)).toBeInTheDocument();
  });

  it('has correct layout structure', () => {
    const { container } = renderIndex();
    
    // Check for the main flex container
    const mainContainer = container.querySelector('.flex.h-\\[calc\\(100vh-3rem\\)\\]');
    expect(mainContainer).toBeInTheDocument();
  });
});
