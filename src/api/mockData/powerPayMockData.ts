// Mock data for PowerPay API tests

import type { ReportResponse, ConversationResponse } from '@/interfaces/PowerPayApi.interface';

export const mockReports: ReportResponse[] = [
  {
    report_id: 'report-1',
    name: 'Q4 Payroll Summary',
    description: 'Comprehensive quarterly payroll analysis',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    report_id: 'report-2',
    name: 'Employee Benefits Report',
    description: 'Detailed breakdown of employee benefits',
    created_at: '2024-01-20T14:30:00Z'
  }
];

export const mockConversationResponse: ConversationResponse = {
  report_id: 'conv-123',
  messages: [
    {
      message_id: 'msg-1',
      prompt: 'Show me payroll data for Q4',
      role: 'user'
    },
    {
      message_id: 'msg-2',
      role: 'assistant',
      summary: 'Here is your Q4 payroll summary',
      response: [
        ['Employee', 'Department', 'Salary'],
        ['John Doe', 'Engineering', '$120,000'],
        ['Jane Smith', 'Sales', '$95,000']
      ],
      key_insights: [
        'Total payroll increased by 8%',
        'Engineering has highest average salary'
      ],
      suggested_prompts: [
        'Show overtime analysis',
        'Compare with Q3'
      ]
    }
  ]
};

export const mockReportData = {
  data: [
    ['Employee ID', 'Name', 'Department', 'Salary', 'Bonus'],
    ['001', 'John Doe', 'Engineering', '120000', '15000'],
    ['002', 'Jane Smith', 'Sales', '95000', '12000'],
    ['003', 'Bob Johnson', 'Marketing', '85000', '8000']
  ]
};
