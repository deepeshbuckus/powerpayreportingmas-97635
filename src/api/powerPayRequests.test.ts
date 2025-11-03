// PowerPay API Requests Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as powerPayAPI from './powerPayRequests';
import { mockReports, mockConversationResponse, mockReportData } from './mockData/powerPayMockData';

// Mock fetch globally
global.fetch = vi.fn();

describe('PowerPay API Requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReports', () => {
    it('should fetch reports successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockReports)
      });

      const result = await powerPayAPI.getReports();
      expect(result).toEqual(mockReports);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/reports'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
    });

    it('should handle fetch errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        clone: () => ({ json: async () => ({ error: 'Server error' }) }),
        text: async () => 'Server error'
      });

      await expect(powerPayAPI.getReports()).rejects.toThrow('500 Internal Server Error');
    });
  });

  describe('saveReport', () => {
    it('should save report successfully', async () => {
      const payload = { report_id: 'test-1', name: 'Test Report', description: 'Test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockReports[0])
      });

      const result = await powerPayAPI.saveReport(payload);
      expect(result).toEqual(mockReports[0]);
    });
  });

  describe('startConversation', () => {
    it('should start conversation successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockConversationResponse)
      });

      const result = await powerPayAPI.startConversation({ prompt: 'Test prompt' });
      expect(result).toEqual(mockConversationResponse);
    });
  });

  describe('getReportData', () => {
    it('should fetch report data successfully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify(mockReportData)
      });

      const result = await powerPayAPI.getReportData('report-1', 'msg-1');
      expect(result).toEqual(mockReportData);
    });
  });
});
