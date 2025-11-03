// PowerPay Report Service Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PowerPayReportService } from './PowerPayReportService';
import * as powerPayAPI from '@/api/powerPayRequests';
import { mockConversationResponse } from '@/api/mockData/powerPayMockData';

vi.mock('@/api/powerPayRequests');

describe('PowerPayReportService', () => {
  let service: PowerPayReportService;

  beforeEach(() => {
    service = new PowerPayReportService();
    vi.clearAllMocks();
  });

  describe('startNewReport', () => {
    it('should start a new report and transform data correctly', async () => {
      vi.mocked(powerPayAPI.startConversation).mockResolvedValue(mockConversationResponse);

      const result = await service.startNewReport('Test prompt');

      expect(result.reportId).toBe('conv-123');
      expect(result.messageId).toBe('msg-2');
      expect(result.messages).toHaveLength(2);
      expect(result.report.title).toContain('Test prompt');
      expect(powerPayAPI.startConversation).toHaveBeenCalledWith({ prompt: 'Test prompt' });
    });
  });

  describe('continueReport', () => {
    it('should continue conversation and return updated messages', async () => {
      vi.mocked(powerPayAPI.continueConversation).mockResolvedValue(mockConversationResponse);

      const result = await service.continueReport('conv-123', 'Follow-up prompt');

      expect(result.messages).toHaveLength(2);
      expect(powerPayAPI.continueConversation).toHaveBeenCalledWith(
        'conv-123',
        { prompt: 'Follow-up prompt' }
      );
    });
  });

  describe('loadReportHistory', () => {
    it('should load and transform conversation history', async () => {
      vi.mocked(powerPayAPI.getConversationMessages).mockResolvedValue(mockConversationResponse);

      const messages = await service.loadReportHistory('conv-123');

      expect(messages).toHaveLength(2);
      expect(messages[0].sender).toBe('user');
      expect(messages[1].sender).toBe('assistant');
    });
  });

  describe('saveReportMetadata', () => {
    it('should call API to save report metadata', async () => {
      vi.mocked(powerPayAPI.saveReport).mockResolvedValue({});

      await service.saveReportMetadata('report-1', 'Test Report', 'Test Description');

      expect(powerPayAPI.saveReport).toHaveBeenCalledWith({
        report_id: 'report-1',
        name: 'Test Report',
        description: 'Test Description'
      });
    });
  });

  describe('exportReportToCSV', () => {
    it('should generate CSV content from report data', () => {
      const mockReport: any = {
        title: 'Test Report',
        type: 'Payroll',
        createdAt: new Date('2024-01-01'),
        description: 'Test',
        apiData: {
          title: 'Test',
          type: 'tabular',
          data: [
            ['Name', 'Salary'],
            ['John', '100000'],
            ['Jane', '95000']
          ]
        }
      };

      // Mock document methods
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

      service.exportReportToCSV(mockReport);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });
});
