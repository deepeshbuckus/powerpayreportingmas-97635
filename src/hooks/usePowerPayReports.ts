// Custom hooks for PowerPay Reports
import { useState, useEffect, useCallback } from 'react';
import { powerPayReportService } from '@/services/PowerPayReportService';
import * as powerPayAPI from '@/api/powerPayRequests';
import type { ReportResponse } from '@/interfaces/PowerPayApi.interface';
import type { DashboardReport } from '@/models/powerPayReport';

export interface UsePowerPayReportsResult {
  reports: DashboardReport[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage PowerPay reports list
 */
export function usePowerPayReports(): UsePowerPayReportsResult {
  const [reports, setReports] = useState<DashboardReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await powerPayAPI.getReports();
      
      // Transform to dashboard format and sort by date (newest first)
      const transformed: DashboardReport[] = (data || [])
        .map((r: ReportResponse) => ({
          conversationId: r.report_id || '',
          defaultTitle: r.description || 'Untitled Report',
          reportName: r.name || '',
          createdAt: r.created_at || new Date().toISOString(),
          mapped: !!r.name
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setReports(transformed);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    loading,
    error,
    refetch: fetchReports
  };
}

/**
 * Hook to manage a single conversation
 */
export interface UseConversationResult {
  messages: any[];
  loading: boolean;
  error: Error | null;
  loadConversation: (conversationId: string) => Promise<void>;
}

export function useConversation(): UseConversationResult {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      setLoading(true);
      setError(null);
      const chatMessages = await powerPayReportService.loadReportHistory(conversationId);
      setMessages(chatMessages);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load conversation:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    messages,
    loading,
    error,
    loadConversation
  };
}
