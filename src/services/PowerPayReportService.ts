// PowerPay Report Service - Business Logic Layer
import * as powerPayAPI from '@/api/powerPayRequests';
import type { UUID } from '@/interfaces/PowerPayApi.interface';
import type { Report, ChatMessage, ConversationMessage } from '@/models/powerPayReport';
import { ReportStatus, ReportType } from '@/models/powerPayReport';

export class PowerPayReportService {
  /**
   * Start a new report conversation
   */
  async startNewReport(prompt: string): Promise<{
    reportId: string;
    messageId: string;
    report: Report;
    messages: ChatMessage[];
  }> {
    const response = await powerPayAPI.startConversation({ prompt });
    
    const reportId = response.report_id || '';
    const lastMessage = response.messages?.[response.messages.length - 1];
    const messageId = lastMessage?.message_id || '';
    
    // Transform messages for chat interface
    const messages = this.transformApiMessagesToChat(response.messages || []);
    
    // Create report from response
    const tableData = this.extractTableData(lastMessage);
    const report = this.createReportFromMessage(prompt, lastMessage, reportId, tableData);
    
    return { reportId, messageId, report, messages };
  }

  /**
   * Continue an existing report conversation
   */
  async continueReport(
    conversationId: string,
    prompt: string
  ): Promise<{
    messages: ChatMessage[];
    report?: Report;
  }> {
    const response = await powerPayAPI.continueConversation(conversationId as UUID, { prompt });
    
    const messages = this.transformApiMessagesToChat(response.messages || []);
    const latestMessage = response.messages?.[0]; // API returns newest first
    
    if (latestMessage) {
      const tableData = this.extractTableData(latestMessage);
      if (tableData) {
        const report = this.createReportFromMessage(prompt, latestMessage, conversationId, tableData);
        return { messages, report };
      }
    }
    
    return { messages };
  }

  /**
   * Load conversation history
   */
  async loadReportHistory(conversationId: string): Promise<ChatMessage[]> {
    const response = await powerPayAPI.getConversationMessages(conversationId as UUID);
    return this.transformApiMessagesToChat(response.messages || []);
  }

  /**
   * Save report metadata (name, description)
   */
  async saveReportMetadata(
    reportId: string,
    name: string,
    description: string
  ): Promise<void> {
    await powerPayAPI.saveReport({
      report_id: reportId as UUID,
      name,
      description
    });
  }

  /**
   * Export report to CSV format
   */
  exportReportToCSV(report: Report): void {
    let csvContent = '';
    const filename = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;

    if (report.apiData && report.apiData.data && report.apiData.data.length > 0) {
      // Handle array of arrays format
      if (Array.isArray(report.apiData.data[0])) {
        const tableData = report.apiData.data as string[][];
        csvContent = tableData.map(row => row.join(',')).join('\n');
      } else {
        // Handle object array format
        const headers = Object.keys(report.apiData.data[0]);
        csvContent = headers.join(',') + '\n';
        
        (report.apiData.data as Record<string, any>[]).forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          });
          csvContent += values.join(',') + '\n';
        });
      }
    } else {
      csvContent = 'Field,Value\n';
      csvContent += `Title,"${report.title}"\n`;
      csvContent += `Type,"${report.type}"\n`;
      csvContent += `Created At,"${report.createdAt instanceof Date ? report.createdAt.toLocaleDateString() : report.createdAt}"\n`;
      csvContent += `Description,"${report.description}"\n`;
    }

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Transform API messages to chat format
   */
  private transformApiMessagesToChat(messages: ConversationMessage[]): ChatMessage[] {
    return messages.map((msg, index) => {
      const isUser = msg.role === 'user';
      const tableData = this.extractTableData(msg);
      
      return {
        id: msg.message_id || `msg-${index}`,
        message_id: msg.message_id,
        content: msg.summary || msg.prompt || '',
        sender: isUser ? 'user' : 'assistant',
        role: msg.role,
        prompt: msg.prompt,
        timestamp: new Date().toISOString(),
        tableData,
        response: tableData,
        summary: msg.summary,
        comprehensiveInfo: msg.comprehensive_information,
        keyInsights: msg.key_insights,
        suggestedPrompts: msg.suggested_prompts
      };
    });
  }

  /**
   * Extract table data from message
   */
  private extractTableData(message?: ConversationMessage): string[][] | null {
    if (!message) return null;
    
    if (Array.isArray(message.response)) {
      return message.response;
    }
    
    if (message.content && Array.isArray(message.content)) {
      return this.parsePipeDelimitedContent(message.content);
    }
    
    return null;
  }

  /**
   * Parse pipe-delimited content to table format
   */
  private parsePipeDelimitedContent(content: string[]): string[][] | null {
    const tableLines = content.filter(line => line.includes('|'));
    if (tableLines.length < 2) return null;
    
    return tableLines.map(line =>
      line.split('|').map(cell => cell.trim()).filter(cell => cell)
    );
  }

  /**
   * Create report object from API message
   */
  private createReportFromMessage(
    prompt: string,
    message: ConversationMessage | undefined,
    reportId: string,
    tableData: string[][] | null
  ): Report {
    return {
      id: reportId,
      title: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
      description: `Report generated from prompt: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`,
      content: '',
      status: ReportStatus.DRAFT,
      type: ReportType.GENERAL,
      createdAt: new Date(),
      updatedAt: new Date(),
      summary: message?.summary,
      comprehensiveInfo: message?.comprehensive_information,
      keyInsights: message?.key_insights,
      suggestedPrompts: message?.suggested_prompts,
      apiData: tableData ? {
        title: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
        type: 'tabular',
        data: tableData
      } : undefined
    };
  }
}

// Export singleton instance
export const powerPayReportService = new PowerPayReportService();
