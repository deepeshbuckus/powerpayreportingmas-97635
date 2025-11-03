// Hook for exporting reports
import { useState, useCallback } from 'react';
import { powerPayReportService } from '@/services/PowerPayReportService';
import type { Report } from '@/models/powerPayReport';

export interface UseReportExportResult {
  exporting: boolean;
  error: Error | null;
  exportReport: (report: Report) => Promise<void>;
}

export function useReportExport(): UseReportExportResult {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportReport = useCallback(async (report: Report) => {
    try {
      setExporting(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
      powerPayReportService.exportReportToCSV(report);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setExporting(false);
    }
  }, []);

  return {
    exporting,
    error,
    exportReport
  };
}
