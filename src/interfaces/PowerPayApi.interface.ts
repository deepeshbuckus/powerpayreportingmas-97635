// PowerPay API Interfaces

export type UUID = string;

export interface SaveReportRequest {
  report_id?: UUID;
  name?: string;
  description?: string;
}

export interface ReportResponse {
  report_id?: UUID;
  name?: string;
  description?: string;
  created_at?: string;
}

export interface ConversationRequest {
  prompt?: string;
}

export interface ConversationMessage {
  message_id?: UUID;
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

export interface ConversationResponse {
  report_id?: UUID;
  messages?: ConversationMessage[];
}

export interface ReportDataResponse {
  data?: string[][];
}

export type GetToken = () => string | Promise<string | null> | null;

export interface PowerPayApiOptions {
  baseUrl?: string;
  getToken?: GetToken;
  token?: string;
  fetchFn?: typeof fetch;
  onUnauthorized?: () => void;
}

export class PowerPayHttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, statusText: string, details?: unknown) {
    super(`${status} ${statusText}`);
    this.name = "PowerPayHttpError";
    this.status = status;
    this.details = details;
  }
}
