// Page-specific hook for Custom AI Report Dashboard
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePowerPayReports } from '@/hooks/usePowerPayReports';
import { useReportGenerator } from '@/hooks/useReportGenerator';
import { powerPayReportService } from '@/services/PowerPayReportService';
import type { DashboardReport } from '@/models/powerPayReport';
import type { UUID } from '@/interfaces/PowerPayApi.interface';

export interface UseCustomAIReportDashboardResult {
  reports: DashboardReport[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  chatInput: string;
  setChatInput: (input: string) => void;
  isStartingChat: boolean;
  saveDialogOpen: boolean;
  setSaveDialogOpen: (open: boolean) => void;
  currentReportId: string | null;
  currentPrompt: string;
  filteredReports: DashboardReport[];
  handleStartChat: () => Promise<void>;
  handleEditReport: (conversationId: string) => Promise<void>;
  handleUpdateReportName: (conversationId: string, newName: string) => Promise<void>;
}

export function useCustomAIReportDashboard(): UseCustomAIReportDashboardResult {
  const navigate = useNavigate();
  const { reports, loading, refetch } = usePowerPayReports();
  const { startNewReport } = useReportGenerator();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');

  // Filter reports based on search query
  const filteredReports = reports.filter(report =>
    (report.reportName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    report.defaultTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChat = async () => {
    if (!chatInput.trim() || isStartingChat) return;
    
    setIsStartingChat(true);
    try {
      const result = await startNewReport(chatInput);
      
      setCurrentPrompt(chatInput);
      setCurrentReportId(result.reportId);
      setChatInput('');
      setSaveDialogOpen(true);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      throw error;
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleEditReport = async (conversationId: string) => {
    try {
      const messages = await powerPayReportService.loadReportHistory(conversationId);
      
      // Transform messages to the expected format
      const transformedMessages = messages.map((msg) => ({
        id: msg.message_id || msg.id,
        message_id: msg.message_id,
        prompt: msg.prompt || '',
        content: msg.content || msg.prompt || '',
        response: msg.response || null,
        tableData: msg.tableData || null,
        summary: msg.summary,
        comprehensiveInfo: msg.comprehensiveInfo,
        keyInsights: msg.keyInsights,
        suggestedPrompts: msg.suggestedPrompts,
        role: msg.role || (msg.prompt ? 'user' : 'assistant'),
        timestamp: msg.timestamp || new Date().toISOString()
      }));

      localStorage.setItem('loadedChatHistory', JSON.stringify(transformedMessages));
      localStorage.setItem('loadedConversationId', conversationId);
      
      navigate('/custom-ai-reports/chat');
    } catch (error) {
      console.error('Failed to load chat history:', error);
      throw error;
    }
  };

  const handleUpdateReportName = async (conversationId: string, newName: string) => {
    try {
      await powerPayReportService.saveReportMetadata(
        conversationId,
        newName,
        'Updated report name'
      );
      await refetch();
    } catch (error) {
      console.error('Failed to update report name:', error);
      throw error;
    }
  };

  return {
    reports,
    loading,
    searchQuery,
    setSearchQuery,
    chatInput,
    setChatInput,
    isStartingChat,
    saveDialogOpen,
    setSaveDialogOpen,
    currentReportId,
    currentPrompt,
    filteredReports,
    handleStartChat,
    handleEditReport,
    handleUpdateReportName
  };
}
