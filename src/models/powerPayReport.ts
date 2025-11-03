// PowerPay Report Models and Types

export enum ReportStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export enum ReportType {
  PAYROLL = 'Payroll',
  BENEFITS = 'Benefits',
  ATTENDANCE = 'Attendance',
  DEMOGRAPHICS = 'Demographics',
  PERFORMANCE = 'Performance',
  GENERAL = 'General',
  DATA_REPORT = 'data-report'
}

export interface Report {
  id: string;
  title: string;
  description: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  status: ReportStatus | 'draft' | 'published' | 'archived';
  type: string;
  attachmentId?: string;
  summary?: string;
  comprehensiveInfo?: string;
  keyInsights?: string[];
  suggestedPrompts?: string[];
  apiData?: {
    title: string;
    type: string;
    data: Record<string, any>[] | string[][];
  };
}

export interface ConversationMessage {
  message_id?: string;
  prompt?: string;
  response?: string[][];
  role?: string;
  content?: string[];
  summary?: string;
  comprehensive_information?: string;
  key_insights?: string[];
  suggested_prompts?: string[];
  attachment_id?: string;
  attachments?: Array<{ attachment_id: string }>;
}

export interface ChatMessage {
  id: string;
  message_id?: string;
  content: string;
  sender: 'user' | 'assistant';
  role?: string;
  prompt?: string;
  timestamp: Date | string;
  tableData?: string[][] | null;
  response?: string[][] | null;
  summary?: string;
  comprehensiveInfo?: string;
  keyInsights?: string[];
  suggestedPrompts?: string[];
}

export interface DashboardReport {
  conversationId: string;
  defaultTitle: string;
  reportName: string;
  createdAt: string;
  mapped: boolean;
}

export const VALIDATION = {
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_PROMPT_LENGTH: 2000
};
