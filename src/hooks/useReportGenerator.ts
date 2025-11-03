// Hook for generating reports
import { useState, useCallback } from 'react';
import { powerPayReportService } from '@/services/PowerPayReportService';
import type { Report, ChatMessage } from '@/models/powerPayReport';

export interface UseReportGeneratorResult {
  generating: boolean;
  error: Error | null;
  startNewReport: (prompt: string) => Promise<{
    reportId: string;
    messageId: string;
    report: Report;
    messages: ChatMessage[];
  }>;
  continueConversation: (conversationId: string, prompt: string) => Promise<{
    messages: ChatMessage[];
    report?: Report;
  }>;
}

export function useReportGenerator(): UseReportGeneratorResult {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const startNewReport = useCallback(async (prompt: string) => {
    try {
      setGenerating(true);
      setError(null);
      return await powerPayReportService.startNewReport(prompt);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, []);

  const continueConversation = useCallback(async (conversationId: string, prompt: string) => {
    try {
      setGenerating(true);
      setError(null);
      return await powerPayReportService.continueReport(conversationId, prompt);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setGenerating(false);
    }
  }, []);

  return {
    generating,
    error,
    startNewReport,
    continueConversation
  };
}
